"""
Verification Router - Handles SMS OTP and CAPTCHA verification
Provides multi-factor authentication endpoints for enhanced security.
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import Optional
import os
import secrets
import requests
from datetime import datetime, timedelta

from fastapi import APIRouter
router = APIRouter(
    prefix="/verification",
    tags=["verification"]
)

# Twilio Configuration (REMOVED)

# RECAPTCHA Configuration		
RECAPTCHA_SECRET_KEY = os.getenv("RECAPTCHA_SECRET_KEY")


# ============================================================================
# CAPTCHA VERIFICATION
# ============================================================================

class CaptchaRequest(BaseModel):
    token: str  # reCAPTCHA token from frontend

@router.post("/verify-captcha")
async def verify_captcha(captcha: CaptchaRequest):
    """
    Verify Google reCAPTCHA token
    
    **How it works:**
    1. Frontend displays reCAPTCHA widget
    2. User completes "I'm not a robot" challenge
    3. Frontend receives token
    4. Send token to this endpoint
    5. We verify with Google's API
    6. Return success/failure
    
    **Purpose**: Prevent automated bot signups/logins
    """
    if not RECAPTCHA_SECRET_KEY:
        # Development mode: allow without reCAPTCHA
        print("⚠️  WARNING: reCAPTCHA not configured, accepting all requests (DEV MODE)")
        return {"success": True, "message": "CAPTCHA verification skipped (development mode)"}
    
    # Verify with Google reCAPTCHA API
    response = requests.post(
        "https://www.google.com/recaptcha/api/siteverify",
        data={
            "secret": RECAPTCHA_SECRET_KEY,
            "response": captcha.token
        }
    )
    
    result = response.json()
    
    if result.get("success"):
        return {"success": True, "message": "CAPTCHA verified successfully"}
    else:
        raise HTTPException(
            status_code=400,
            detail="CAPTCHA verification failed. Please try again."
        )
