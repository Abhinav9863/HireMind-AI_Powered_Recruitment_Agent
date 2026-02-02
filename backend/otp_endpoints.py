"""
OTP Verification Endpoints for Dual Verification System
Add these to main.py after the verify_email endpoint
"""

from pydantic import BaseModel

# OTP Verification Schemas
class VerifyOTPRequest(BaseModel):
    email_or_phone: str  # User can provide email OR phone
    otp: str  # 6-digit code
    verification_type: str  # "email" or "sms"

class ResendOTPRequest(BaseModel):
    email: str
    method: str  # "email" or "sms" or "both"

# ============================================================================
# OTP VERIFICATION ENDPOINTS
# ============================================================================

@app.post("/auth/verify-otp")
async def verify_otp(request: VerifyOTPRequest, session: AsyncSession = Depends(get_session)):
    """
    Verify OTP Code (Email OR SMS)
    
    User can verify using EITHER:
    - Email OTP received via email
    - SMS OTP received via Twilio
    
    Flow:
    1. User enters OTP + specifies type (email/sms)
    2. Find user by email or phone
    3. Check if OTP matches and not expired
    4. Mark user as verified
    5. Clear OTPs
    """
    
    # Find user by email or phone
    if request.verification_type == "email":
        result = await session.execute(
            select(User).where(User.email == request.email_or_phone)
        )
    else:  # sms
        result = await session.execute(
            select(User).where(User.phone_number == request.email_or_phone)
        )
    
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
   # Check if already verified
    if user.is_verified:
        return {"success": True, "message": "Account already verified"}
    
    # Verify OTP based on type
    if request.verification_type == "email":
        if not user.email_otp:
            raise HTTPException(status_code=400, detail="No email OTP found. Please request a new code.")
        
        if user.email_otp_expires and datetime.utcnow() > user.email_otp_expires:
            raise HTTPException(status_code=400, detail="Email OTP has expired. Please request a new code.")
        
        if user.email_otp != request.otp:
            raise HTTPException(status_code=400, detail="Invalid email OTP code")
            
    elif request.verification_type == "sms":
        if not user.sms_otp:
            raise HTTPException(status_code=400, detail="No SMS OTP found. Please request a new code.")
        
        if user.sms_otp_expires and datetime.utcnow() > user.sms_otp_expires:
            raise HTTPException(status_code=400, detail="SMS OTP has expired. Please request a new code.")
        
        if user.sms_otp != request.otp:
            raise HTTPException(status_code=400, detail="Invalid SMS OTP code")
    else:
        raise HTTPException(status_code=400, detail="Invalid verification type. Use 'email' or 'sms'")
    
    # Success! Mark user as verified
    user.is_verified = True
    user.email_otp = None  # Clear email OTP
    user.email_otp_expires = None
    user.sms_otp = None  # Clear SMS OTP
    user.sms_otp_expires = None
    
    session.add(user)
    await session.commit()
    
    print(f"✅ User {user.email} verified successfully via {request.verification_type.upper()} OTP!")
    
    return {
        "success": True,
        "message": f"Account verified successfully via {request.verification_type.upper()} OTP! You can now login."
    }


@app.post("/auth/resend-otp")
async def resend_otp(request: ResendOTPRequest, session: AsyncSession = Depends(get_session)):
    """
    Resend OTP Code(s)
    
    User can request to resend:
    - Email OTP only
    - SMS OTP only
    - Both OTPs
    """
    
    result = await session.execute(select(User).where(User.email == request.email))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.is_verified:
        return {"success": True, "message": "Account already verified"}
    
    # Generate new OTP codes
    from datetime import timedelta
    otp_expiry = datetime.utcnow() + timedelta(minutes=5)
    
    if request.method in ["email", "both"]:
        # Generate and send email OTP
        email_otp = str(secrets.randbelow(1000000)).zfill(6)
        user.email_otp = email_otp
        user.email_otp_expires = otp_expiry
        
        print(f"\n{'=' * 70}")
        print(f"📧 EMAIL OTP RESENT")
        print(f"{'=' * 70}")
        print(f"To: {user.email}")
        print(f"Your new verification code is: {email_otp}")
        print(f"Code expires in 5 minutes.")
        print(f"{'=' * 70}\n")
    
    if request.method in ["sms", "both"]:
        # Generate and send SMS OTP
        sms_otp = str(secrets.randbelow(1000000)).zfill(6)
        user.sms_otp = sms_otp
        user.sms_otp_expires = otp_expiry
        
        try:
            from twilio.rest import Client
            import os as twilio_os
            
            TWILIO_SID = twilio_os.getenv("TWILIO_ACCOUNT_SID")
            TWILIO_TOKEN = twilio_os.getenv("TWILIO_AUTH_TOKEN")
            TWILIO_PHONE = twilio_os.getenv("TWILIO_PHONE_NUMBER")
            
            if TWILIO_SID and TWILIO_TOKEN:
                client = Client(TWILIO_SID, TWILIO_TOKEN)
                message = client.messages.create(
                    body=f"Your HireMind verification code is: {sms_otp}. Valid for 5 minutes.",
                    from_=TWILIO_PHONE,
                    to=user.phone_number
                )
                print(f"✅ SMS OTP resent to {user.phone_number}")
            else:
                print(f"\n{'=' * 70}")
                print(f"📱 SMS OTP RESENT (Development Mode)")
                print(f"{'=' * 70}")
                print(f"To: {user.phone_number}")
                print(f"Your new verification code is: {sms_otp}")
                print(f"Code expires in 5 minutes.")
                print(f"{'=' * 70}\n")
        except Exception as e:
            print(f"⚠️ SMS resend failed: {e}")
    
    session.add(user)
    await session.commit()
    
    return {
        "success": True,
        "message": f"OTP code(s) resent successfully via {request.method}"
    }
