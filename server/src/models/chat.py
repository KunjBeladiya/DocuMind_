import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from src.core.database import Base

class Chat(Base):
    __tablename__ = "chats"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String)

    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="chats")
    messages = relationship("Message", back_populates="chat", cascade="all, delete")
    documents = relationship("PDFDocument", back_populates="chat", cascade="all, delete")
    summaries = relationship("Summary", back_populates="chat", cascade="all, delete")
    quizzes = relationship("Quiz", back_populates="chat", cascade="all, delete")

