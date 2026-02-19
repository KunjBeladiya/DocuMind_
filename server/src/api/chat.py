from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.core.database import get_db
from src.api.dependencies import get_current_user
from src.models.chat import Chat
from src.models.pdf import PDFDocument
from src.models.message import Message
from src.schemas.chat import ChatCreate, QuestionRequest ,ChatResponse , ChatUpdate , MessageResponse
from src.services.cloudinary_service import upload_pdf
from src.services.rag_service import process_pdf, ask_question , delete_chat_collection
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


@router.get("/", response_model=list[ChatResponse])
async def list_chats(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    result = await db.execute(
        select(Chat)
        .where(Chat.user_id == current_user.id)
        .order_by(Chat.created_at.desc())
    )

    chats = result.scalars().all()
    return chats


@router.get("/{chat_id}", response_model=ChatResponse)
async def get_chat(
    chat_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    result = await db.execute(select(Chat).where(Chat.id == chat_id))
    chat = result.scalar_one_or_none()

    if not chat or chat.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    return chat


@router.get("/{chat_id}/messages", response_model=list[MessageResponse])
async def get_chat_messages(
    chat_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    result = await db.execute(select(Chat).where(Chat.id == chat_id))
    chat = result.scalar_one_or_none()

    if not chat or chat.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    result = await db.execute(
        select(Message)
        .where(Message.chat_id == chat_id)
        .order_by(Message.created_at.asc())
    )

    messages = result.scalars().all()
    return messages



@router.patch("/{chat_id}", response_model=ChatResponse)
async def update_chat(
    chat_id: str,
    update_data: ChatUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    result = await db.execute(select(Chat).where(Chat.id == chat_id))
    chat = result.scalar_one_or_none()

    if not chat or chat.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    chat.title = update_data.title

    await db.commit()
    await db.refresh(chat)

    return chat



@router.delete("/{chat_id}")
async def delete_chat(
    chat_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    result = await db.execute(select(Chat).where(Chat.id == chat_id))
    chat = result.scalar_one_or_none()

    if not chat or chat.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    await db.delete(chat)
    await db.commit()

    # Delete Chroma collection
    delete_chat_collection(chat_id)

    return {"message": "Chat deleted successfully"}



@router.get("/{chat_id}/documents")
async def list_documents(
    chat_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    result = await db.execute(select(Chat).where(Chat.id == chat_id))
    chat = result.scalar_one_or_none()

    if not chat or chat.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    result = await db.execute(
        select(PDFDocument).where(PDFDocument.chat_id == chat_id)
    )

    documents = result.scalars().all()
    return documents
