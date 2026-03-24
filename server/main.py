from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.api import auth
from src.api import chat

app = FastAPI()

origins = [
    "http://localhost:5173",  # frontend
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # or ["*"] for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(chat.router)