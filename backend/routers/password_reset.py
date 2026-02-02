from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime, timedelta
import secrets
import os

from database import get_session
from models import User
from auth import get_password_hash, create_reset_token
from email_utils import send_password_reset_email

router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

@router.post("/forgot-password")
async def forgot_password(
    request: ForgotPasswordRequest,
    session: AsyncSession = Depends(get_session)
):
    """
    Send password reset email to user
    
    Flow:
    1. User submits email
    2. System finds user by email
    3. Generates secure reset token
    4. Saves token and expiration to database
    5. Sends email with reset link
    """
    # Find user
    result = await session.execute(select(User).where(User.email == request.email))
    user = result.scalars().first()
    
    # Always return success message (don't reveal if email exists)
    if not user:
        return {
            "message": "If an account exists with this email, a password reset link has been sent."
        }
    
    # Generate reset token (secure random string)
    reset_token = secrets.token_urlsafe(32)
    
    # Set token and expiration (1 hour)
    user.reset_password_token = reset_token
    user.reset_password_expires = datetime.utcnow() + timedelta(hours=1)
    
    session.add(user)
    await session.commit()
    
    # Generate reset link
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    reset_link = f"{frontend_url}/reset-password?token={reset_token}"
    
    # Send email
    await send_password_reset_email(user.email, user.full_name, reset_link)
    
    return {
        "message": "If an account exists with this email, a password reset link has been sent."
    }


@router.post("/reset-password")
async def reset_password(
    request: ResetPasswordRequest,
    session: AsyncSession = Depends(get_session)
):
    """
    Reset password using token from email
    
    Flow:
    1. User clicks link in email
    2. Frontend captures token from URL
    3. User enters new password
    4. Backend validates token
    5. Updates password
    """
    # Find user by reset token
    result = await session.execute(
        select(User).where(User.reset_password_token == request.token)
    )
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired reset token"
        )
    
    # Check if token is expired
    if not user.reset_password_expires or user.reset_password_expires < datetime.utcnow():
        raise HTTPException(
            status_code=400,
            detail="Reset token has expired. Please request a new password reset."
        )
    
    # Update password
    user.hashed_password = get_password_hash(request.new_password)
    
    # Clear reset token
    user.reset_password_token = None
    user.reset_password_expires = None
    
    session.add(user)
    await session.commit()
    
    return {
        "message": "Password reset successfully. You can now login with your new password."
    }
