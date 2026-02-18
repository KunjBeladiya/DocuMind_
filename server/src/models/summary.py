import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from src.core.database import Base
from src.models.enums import SummaryType
from sqlalchemy.orm import relationship

class Summary(Base):
    __tablename__ = "summaries"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    chat_id = Column(String, ForeignKey("chats.id"), nullable=False, index=True)

    type = Column(Enum(SummaryType), nullable=False)
    content = Column(String, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    chat = relationship("Chat", back_populates="summaries")

