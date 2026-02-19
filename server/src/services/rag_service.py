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