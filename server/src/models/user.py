import uuid
from sqlalchemy.orm import relationship
from sqlalchemy import Column, String, DateTime
from sqlalchemy.sql import func
from src.core.database import Base
from sqlalchemy.orm import relationship

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    name = Column(String)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    chats = relationship("Chat", back_populates="user", cascade="all, delete")

