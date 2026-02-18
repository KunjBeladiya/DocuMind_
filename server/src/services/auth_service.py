# src/services/auth_service.py

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.models.user import User
from src.schemas.user import UserRegister
from src.utils.security import hash_password, verify_password, create_access_token
from fastapi import HTTPException, status


async def register_user(db: AsyncSession, user_data: UserRegister):
    result = await db.execute(select(User).where(User.email == user_data.email))
    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    new_user = User(
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
        name=user_data.name
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return new_user


async def login_user(db: AsyncSession, email: str, password: str):
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    token = create_access_token({"sub": user.id})

    return token
