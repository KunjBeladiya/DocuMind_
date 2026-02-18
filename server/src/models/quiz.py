import uuid
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Enum, Boolean
from sqlalchemy.sql import func
from src.core.database import Base
from src.models.enums import QuizDifficulty, QuizStatus
from sqlalchemy.orm import relationship

class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    chat_id = Column(String, ForeignKey("chats.id"), nullable=False, index=True)

    title = Column(String)
    difficulty = Column(Enum(QuizDifficulty))
    status = Column(Enum(QuizStatus), default=QuizStatus.CREATED)

    score = Column(Integer)
    total_marks = Column(Integer)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    chat = relationship("Chat", back_populates="quizzes")
    questions = relationship("QuizQuestion", back_populates="quiz", cascade="all, delete")



class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    quiz_id = Column(String, ForeignKey("quizzes.id"), nullable=False, index=True)

    question = Column(String, nullable=False)

    quiz = relationship("Quiz", back_populates="questions")
    options = relationship("QuizOption", back_populates="question", cascade="all, delete")



class QuizOption(Base):
    __tablename__ = "quiz_options"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    question_id = Column(String, ForeignKey("quiz_questions.id"), nullable=False, index=True)

    text = Column(String, nullable=False)
    is_correct = Column(Boolean, default=False)

    question = relationship("QuizQuestion", back_populates="options")

