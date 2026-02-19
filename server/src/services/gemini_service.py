import google.generativeai as genai
from src.core.config import settings


genai.configure(api_key=settings.GEMINI_API_KEY)


def generate_answer(context: str, question: str):
    model = genai.GenerativeModel("gemini-pro")

    prompt = f"""
    You are an AI assistant.
    Answer only using the context below.

    Context:
    {context}

    Question:
    {question}
    """

    response = model.generate_content(prompt)
    return response.text


def generate_embedding(text: str):
    model = "models/embedding-001"
    return genai.embed_content(model=model, content=text)["embedding"]
