from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.core.database import get_db
from src.api.dependencies import get_current_user
from src.models.chat import Chat
from src.models.pdf import PDFDocument
from src.models.message import Message
from src.schemas.chat import ChatCreate, QuestionRequest
from src.services.cloudinary_service import upload_pdf
from src.services.rag_service import process_pdf, ask_question
import os
import uuid
import shutil


router = APIRouter(prefix="/chats", tags=["Chats"])


# Create Chat
@router.post("/")
async def create_chat(
    chat_data: ChatCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    new_chat = Chat(
        title=chat_data.title,
        user_id=current_user.id
    )

    db.add(new_chat)
    await db.commit()
    await db.refresh(new_chat)

    return new_chat


# Upload PDF
@router.post("/{chat_id}/upload")
async def upload_pdf_to_chat(
    chat_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):

    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF allowed")

    result = await db.execute(select(Chat).where(Chat.id == chat_id))
    chat = result.scalar_one_or_none()

    if not chat or chat.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    os.makedirs("temp", exist_ok=True)
    temp_path = f"temp/{uuid.uuid4()}.pdf"

    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    cloudinary_url = upload_pdf(temp_path)

    pdf_doc = PDFDocument(
        chat_id=chat_id,
        file_name=file.filename,
        file_path=cloudinary_url
    )

    db.add(pdf_doc)
    await db.commit()

    process_pdf(chat_id, temp_path)

    os.remove(temp_path)

    return {"message": "PDF uploaded and processed"}


# Ask Question
@router.post("/{chat_id}/ask")
async def ask_chat(
    chat_id: str,
    request: QuestionRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):

    result = await db.execute(select(Chat).where(Chat.id == chat_id))
    chat = result.scalar_one_or_none()

    if not chat or chat.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    user_msg = Message(
        chat_id=chat_id,
        content=request.question,
        role="USER"
    )

    db.add(user_msg)
    await db.commit()

    answer = ask_question(chat_id, request.question)

    assistant_msg = Message(
        chat_id=chat_id,
        content=answer,
        role="ASSISTANT"
    )

    db.add(assistant_msg)
    await db.commit()

    return {"answer": answer}
