# src/api/auth.py

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.database import get_db
from src.schemas.user import UserRegister, UserLogin, TokenResponse, UserResponse
from src.services.auth_service import register_user, login_user


router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse)
async def register(user: UserRegister, db: AsyncSession = Depends(get_db)):
    return await register_user(db, user)


@router.post("/login", response_model=TokenResponse)
async def login(user: UserLogin, db: AsyncSession = Depends(get_db)):
    token = await login_user(db, user.email, user.password)
    return {"access_token": token}
