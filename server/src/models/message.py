import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from src.core.database import Base
from sqlalchemy.orm import relationship
from src.models.enums import MessageRole

class Message(Base):
    __tablename__ = "messages"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    chat_id = Column(String, ForeignKey("chats.id"), nullable=False, index=True)

    content = Column(String, nullable=False)
    role = Column(Enum(MessageRole), nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    chat = relationship("Chat", back_populates="messages")

