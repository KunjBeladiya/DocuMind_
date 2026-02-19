from fastapi import FastAPI
from src.api import auth
from src.api import chat

app = FastAPI()

app.include_router(auth.router)
app.include_router(chat.router)