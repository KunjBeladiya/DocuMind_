from langchain_community.vectorstores import Chroma
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import FastEmbedEmbeddings
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from chromadb import Client
from chromadb.config import Settings

from pydantic import BaseModel, Field
from src.core.config import settings


# ✅ Use FastEmbed (NO HF, NO transformers)
embedding_model = FastEmbedEmbeddings()


def get_vectorstore(chat_id: str):
    return Chroma(
        collection_name=f"chat_{chat_id}",
        embedding_function=embedding_model,
        persist_directory="./chroma_db"
    )


def get_llm():
    return ChatGroq(
        groq_api_key=settings.GROQ_API_KEY,
        model_name="llama-3.3-70b-versatile",
        temperature=0
    )


def process_pdf(chat_id: str, file_path: str):

    loader = PyPDFLoader(file_path)
    documents = loader.load()

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200
    )

    chunks = splitter.split_documents(documents)

    vectorstore = get_vectorstore(chat_id)
    vectorstore.add_documents(chunks)
    vectorstore.persist()


def ask_question(chat_id: str, question: str):

    vectorstore = get_vectorstore(chat_id)
    retriever = vectorstore.as_retriever(search_kwargs={"k": 5})

    prompt = ChatPromptTemplate.from_template(
        """
        You are an AI assistant.
        Answer ONLY using the context below.

        Context:
        {context}

        Question:
        {question}
        """
    )

    llm = get_llm()

    def format_docs(docs):
        return "\n\n".join(doc.page_content for doc in docs)

    rag_chain = (
        {
            "context": retriever | format_docs,
            "question": RunnablePassthrough()
        }
        | prompt
        | llm
        | StrOutputParser()
    )

    return rag_chain.invoke(question)


def delete_chat_collection(chat_id: str):
    client = Client(Settings(persist_directory="./chroma_db"))
    try:
        client.delete_collection(name=f"chat_{chat_id}")
    except Exception:
        pass


def generate_summary(chat_id: str, summary_type: str):

    vectorstore = get_vectorstore(chat_id)
    retriever = vectorstore.as_retriever(search_kwargs={"k": 10})

    if summary_type == "SHORT":
        instruction = "Give a short summary in 5-6 lines."
    elif summary_type == "DETAILED":
        instruction = "Give a detailed explanation covering all important points."
    elif summary_type == "BULLET":
        instruction = "Summarize in clear bullet points."
    else:
        raise ValueError("Invalid summary type")

    prompt = ChatPromptTemplate.from_template(
        """
        You are an AI assistant.

        Based on the context below, generate a summary.

        Context:
        {context}

        Instruction:
        {instruction}
        """
    )

    llm = get_llm()

    def format_docs(docs):
        return "\n\n".join(doc.page_content for doc in docs)

    chain = (
        {
            "context": retriever | format_docs,
            "instruction": lambda _: instruction
        }
        | prompt
        | llm
        | StrOutputParser()
    )

    return chain.invoke("Provide a comprehensive summary of the main topics in this document.")

import json

class QuizOptionGen(BaseModel):
    text: str
    is_correct: bool

class QuizQuestionGen(BaseModel):
    question: str
    options: list[QuizOptionGen]

class QuizGenData(BaseModel):
    title: str
    questions: list[QuizQuestionGen]

def generate_quiz_data(chat_id: str, count: int, difficulty: str) -> QuizGenData:
    vectorstore = get_vectorstore(chat_id)
    retriever = vectorstore.as_retriever(search_kwargs={"k": 15})

    prompt_template = """You are an expert educational AI assistant.

Based on the context below, generate a multiple-choice quiz.

Rules you MUST follow:
- Generate EXACTLY {count} questions.
- Difficulty level: {difficulty}
- Each question MUST have EXACTLY 4 answer options (A, B, C, D).
- EXACTLY ONE option per question must be the correct answer.
- Make questions based ONLY on information found in the context.
- Create a concise title for the quiz.

You MUST respond with ONLY a valid JSON object matching this exact format, with no explanation or markdown:
{{
  "title": "Quiz Title Here",
  "questions": [
    {{
      "question": "Question text here?",
      "options": [
        {{"text": "Option A text", "is_correct": false}},
        {{"text": "Option B text", "is_correct": true}},
        {{"text": "Option C text", "is_correct": false}},
        {{"text": "Option D text", "is_correct": false}}
      ]
    }}
  ]
}}

Context:
{context}
"""

    def format_docs(docs):
        return "\n\n".join(doc.page_content for doc in docs)

    query = f"Generate {count} {difficulty} difficulty quiz questions about the core concepts in this document."
    
    # Retrieve relevant context
    docs = retriever.invoke(query)
    context = format_docs(docs)

    # Build the final prompt string
    final_prompt = prompt_template.format(
        count=count,
        difficulty=difficulty,
        context=context
    )

    # Call the LLM directly  
    llm = get_llm()
    response = llm.invoke(final_prompt)
    raw = response.content.strip()

    # Strip markdown fences if the model adds them
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    # Parse and validate
    data = json.loads(raw)

    questions = []
    for q in data["questions"]:
        options = [QuizOptionGen(text=o["text"], is_correct=o["is_correct"]) for o in q["options"]]
        questions.append(QuizQuestionGen(question=q["question"], options=options))

    return QuizGenData(title=data["title"], questions=questions)
