from pydantic import BaseModel, Field
from typing import List, Dict
from datetime import datetime
from src.models.enums import QuizDifficulty, QuizStatus

class QuizGenerateRequest(BaseModel):
    count: int = Field(..., ge=1, le=20, description="Number of questions to generate (1-20)")
    difficulty: QuizDifficulty

class QuizSubmitRequest(BaseModel):
    answers: Dict[str, str] = Field(..., description="Map of question_id to selected_option_id")

class QuizOptionResponse(BaseModel):
    id: str
    text: str

    class Config:
        from_attributes = True

class QuizQuestionResponse(BaseModel):
    id: str
    question: str
    options: List[QuizOptionResponse]

    class Config:
        from_attributes = True

class QuizResponse(BaseModel):
    id: str
    chat_id: str
    title: str
    difficulty: QuizDifficulty
    status: QuizStatus
    score: int | None
    total_marks: int | None
    created_at: datetime
    questions: List[QuizQuestionResponse] | None = None

    class Config:
        from_attributes = True

class QuizResultResponse(BaseModel):
    score: int
    total_marks: int
    status: QuizStatus
    # A map from question_id to the string ID of the correct option
    correct_answers: Dict[str, str]
