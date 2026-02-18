import uuid
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.sql import func
from src.core.database import Base
from sqlalchemy.orm import relationship

class PDFDocument(Base):
    __tablename__ = "pdf_documents"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    chat_id = Column(String, ForeignKey("chats.id"), nullable=False, index=True)

    file_name = Column(String)
    file_path = Column(String)
    page_count = Column(Integer)

    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    chat = relationship("Chat", back_populates="documents")

