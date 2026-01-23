from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import shutil
import os

from database import get_session
from models import User
from auth import get_current_user
from schemas import UserRead, UserUpdate

router = APIRouter(
    prefix="/users",
    tags=["users"]
)

@router.get("/me", response_model=UserRead)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/profile", response_model=UserRead)
async def update_user_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name
    if user_update.university is not None:
        current_user.university = user_update.university
    if user_update.company_name is not None:
        current_user.company_name = user_update.company_name
    if user_update.bio is not None:
        current_user.bio = user_update.bio
    if user_update.phone_number is not None:
        current_user.phone_number = user_update.phone_number
        
    session.add(current_user)
    await session.commit()
    await session.refresh(current_user)
    return current_user

@router.post("/upload/photo", response_model=UserRead)
async def upload_profile_picture(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    # Sanitize filename
    safe_filename = "".join([c for c in file.filename if c.isalnum() or c in "._-"]).strip()
    
    # Ensure directory exists
    os.makedirs("uploads", exist_ok=True)
    
    file_location = f"uploads/pfp_{current_user.id}_{safe_filename}"
    
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)
        
    current_user.profile_picture = file_location
    session.add(current_user)
    await session.commit()
    await session.refresh(current_user)
    return current_user

@router.post("/upload/resume", response_model=UserRead)
async def upload_default_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    # Sanitize filename
    safe_filename = "".join([c for c in file.filename if c.isalnum() or c in "._-"]).strip()
    
    # Ensure directory exists
    os.makedirs("uploads", exist_ok=True)
    
    file_location = f"uploads/resume_{current_user.id}_{safe_filename}"
    
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)
        
    current_user.resume_path = file_location
    session.add(current_user)
    await session.commit()
    await session.refresh(current_user)
    return current_user
