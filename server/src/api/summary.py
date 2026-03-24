from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.core.database import get_db
from src.api.dependencies import get_current_user
from src.models.chat import Chat
from src.models.summary import Summary
from src.schemas.summary import SummaryCreate, SummaryResponse
from src.services.rag_service import generate_summary


router = APIRouter(prefix="/summaries", tags=["Summaries"])

@router.post("/chats/{chat_id}", response_model=SummaryResponse)
async def create_summary(
    chat_id: str,
    data: SummaryCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):

    result = await db.execute(select(Chat).where(Chat.id == chat_id))
    chat = result.scalar_one_or_none()

    if not chat or chat.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    content = generate_summary(chat_id, data.type)

    summary = Summary(
        chat_id=chat_id,
        type=data.type,
        content=content
    )

    db.add(summary)
    await db.commit()
    await db.refresh(summary)

    return summary

@router.get("/chats/{chat_id}", response_model=list[SummaryResponse])
async def get_summaries(
    chat_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):

    result = await db.execute(select(Chat).where(Chat.id == chat_id))
    chat = result.scalar_one_or_none()

    if not chat or chat.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    result = await db.execute(
        select(Summary).where(Summary.chat_id == chat_id)
    )

    return result.scalars().all()



@router.get("/{summary_id}", response_model=SummaryResponse)
async def get_summary(
    summary_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):

    result = await db.execute(select(Summary).where(Summary.id == summary_id))
    summary = result.scalar_one_or_none()

    if not summary:
        raise HTTPException(status_code=404, detail="Not found")

    return summary


@router.delete("/{summary_id}")
async def delete_summary(
    summary_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):

    result = await db.execute(select(Summary).where(Summary.id == summary_id))
    summary = result.scalar_one_or_none()

    if not summary:
        raise HTTPException(status_code=404, detail="Not found")

    await db.delete(summary)
    await db.commit()

    return {"message": "Deleted"}