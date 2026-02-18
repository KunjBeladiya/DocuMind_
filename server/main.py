from fastapi import FastAPI
from src.api import auth

app = FastAPI()

app.include_router(auth.router)
