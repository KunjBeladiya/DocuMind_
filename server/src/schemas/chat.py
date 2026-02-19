from pydantic import BaseModel


class ChatCreate(BaseModel):
    title: str


class QuestionRequest(BaseModel):
    question: str
