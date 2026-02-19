import chromadb
from chromadb.config import Settings


client = chromadb.Client(
    Settings(persist_directory="./chroma_db", anonymized_telemetry=False)
)


def get_chat_collection(chat_id: str):
    return client.get_or_create_collection(name=f"chat_{chat_id}")
