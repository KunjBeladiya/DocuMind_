from pydantic import BaseModel
from datetime import datetime


class ChatCreate(BaseModel):
    title: str

class QuestionRequest(BaseModel):
    question: str

class ChatUpdate(BaseModel):
    title: str


class ChatResponse(BaseModel):
    id: str
    title: str
    created_at: datetime

    class Config:
        from_attributes = True


class MessageResponse(BaseModel):
    id: str
    content: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True