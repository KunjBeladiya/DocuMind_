from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from src.core.database import get_db
from src.api.dependencies import get_current_user
from src.models.chat import Chat
from src.models.quiz import Quiz, QuizQuestion, QuizOption
from src.models.enums import QuizStatus
from src.schemas.quiz import (
    QuizGenerateRequest, QuizSubmitRequest, QuizResponse, QuizResultResponse
)
from src.services.rag_service import generate_quiz_data

router = APIRouter(prefix="/quizzes", tags=["Quizzes"])

@router.post("/chats/{chat_id}/generate", response_model=QuizResponse)
async def generate_quiz(
    chat_id: str,
    data: QuizGenerateRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    result = await db.execute(select(Chat).where(Chat.id == chat_id))
    chat = result.scalar_one_or_none()

    if not chat or chat.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    try:
        # Generate the structured quiz data via LLM
        quiz_data = generate_quiz_data(chat_id, data.count, data.difficulty.value)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    try:
        # Create the DB objects
        new_quiz = Quiz(
            chat_id=chat_id,
            title=quiz_data.title,
            difficulty=data.difficulty,
            total_marks=len(quiz_data.questions),
            status=QuizStatus.CREATED
        )

        db.add(new_quiz)
        await db.flush() # flush to get new_quiz.id

        for q_data in quiz_data.questions:
            db_question = QuizQuestion(
                quiz_id=new_quiz.id,
                question=q_data.question
            )
            db.add(db_question)
            await db.flush() # flush to get db_question.id

            for opt_data in q_data.options:
                db_option = QuizOption(
                    question_id=db_question.id,
                    text=opt_data.text,
                    is_correct=opt_data.is_correct
                )
                db.add(db_option)

        await db.commit()
    except Exception as db_e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(db_e))

    # Refetch quiz with relationships
    result = await db.execute(
        select(Quiz)
        .where(Quiz.id == new_quiz.id)
        .options(
            selectinload(Quiz.questions).selectinload(QuizQuestion.options)
        )
    )
    return result.scalar_one()


@router.get("/chats/{chat_id}", response_model=list[QuizResponse])
async def get_chat_quizzes(
    chat_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    result = await db.execute(select(Chat).where(Chat.id == chat_id))
    chat = result.scalar_one_or_none()

    if not chat or chat.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    result = await db.execute(
        select(Quiz)
        .where(Quiz.chat_id == chat_id)
        .options(
            selectinload(Quiz.questions).selectinload(QuizQuestion.options)
        )
        .order_by(Quiz.created_at.desc())
    )

    return result.scalars().all()


@router.get("/{quiz_id}", response_model=QuizResponse)
async def get_quiz(
    quiz_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    result = await db.execute(
        select(Quiz)
        .where(Quiz.id == quiz_id)
        .options(
            selectinload(Quiz.chat),
            selectinload(Quiz.questions).selectinload(QuizQuestion.options)
        )
    )
    quiz = result.scalar_one_or_none()

    if not quiz or quiz.chat.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Quiz Not found")

    return quiz


@router.post("/{quiz_id}/submit", response_model=QuizResultResponse)
async def submit_quiz(
    quiz_id: str,
    data: QuizSubmitRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    result = await db.execute(
        select(Quiz)
        .where(Quiz.id == quiz_id)
        .options(
            selectinload(Quiz.chat),
            selectinload(Quiz.questions).selectinload(QuizQuestion.options)
        )
    )
    quiz = result.scalar_one_or_none()

    if not quiz or quiz.chat.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Quiz Not found")

    score = 0
    correct_answers = {}
    
    for question in quiz.questions:
        selected_option_id = data.answers.get(question.id)
        correct_opt = next((o for o in question.options if o.is_correct), None)
        
        if correct_opt:
            correct_answers[question.id] = correct_opt.id
            if selected_option_id == correct_opt.id:
                score += 1
                
    quiz.score = score
    quiz.status = QuizStatus.COMPLETED

    await db.commit()

    return QuizResultResponse(
        score=score,
        total_marks=quiz.total_marks,
        status=quiz.status,
        correct_answers=correct_answers
    )


@router.delete("/{quiz_id}")
async def delete_quiz(
    quiz_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    result = await db.execute(
        select(Quiz)
        .where(Quiz.id == quiz_id)
        .options(selectinload(Quiz.chat))
    )
    quiz = result.scalar_one_or_none()

    if not quiz or quiz.chat.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Quiz Not found")

    await db.delete(quiz)
    await db.commit()

    return {"message": "Deleted"}
