from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from contextlib import asynccontextmanager
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from loguru import logger
import sys

from database import init_db, get_session
from models import User, UserRole
from schemas import UserCreate, Token
from auth import get_password_hash, create_access_token, verify_password
from routers import interview, jobs, ats, applications, users, verification, schedule, password_reset
import secrets
from datetime import datetime, timedelta
from pydantic import BaseModel, EmailStr

# ✅ SECURITY FIX: Structured logging setup (Bug #12)
logger.remove()  # Remove default handler
logger.add(sys.stdout, format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {message}", level="INFO")
logger.add("logs/app.log", rotation="1 day", retention="7 days", level="DEBUG")  # File logging

# ✅ SECURITY FIX: Rate limiter setup (Bug #8)
limiter = Limiter(key_func=get_remote_address)

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(title="HireMind API", lifespan=lifespan)

# Add rate limiter to app state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.include_router(interview.router)
app.include_router(jobs.router)
app.include_router(ats.router)
app.include_router(applications.router)
app.include_router(users.router)
app.include_router(verification.router)
app.include_router(schedule.router)
app.include_router(password_reset.router)

# CORS (Allow Frontend to connect)
# Get allowed origins from environment variable, default to localhost for development
import os as _os_cors
ALLOWED_ORIGINS = _os_cors.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:5174").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ SECURITY FIX: Add security headers to mitigate XSS risk (Bug #6)
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    # Prevent clickjacking
    response.headers["X-Frame-Options"] = "DENY"
    # Prevent MIME type sniffing
    response.headers["X-Content-Type-Options"] = "nosniff"
    # Enable XSS protection
    response.headers["X-XSS-Protection"] = "1; mode=block"
    # Content Security Policy - helps prevent XSS
    response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
    # HSTS for HTTPS (important in production)
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

# ✅ LOGGING: Request logging middleware (Bug #12)
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Request: {request.method} {request.url.path}")
    response = await call_next(request)
    logger.info(f"Response: {response.status_code} for {request.method} {request.url.path}")
    return response

from fastapi.staticfiles import StaticFiles
import os

# Create uploads directory if not exists
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

@app.get("/")
def read_root():
    return {"message": "Welcome to HireMind API"}

@app.post("/auth/signup", response_model=Token)
async def signup(user: UserCreate, session: AsyncSession = Depends(get_session)):
    """
    User Signup with Dual OTP Verification
    
    Flow:
    1. User submits signup form (email, phone, password, etc.)
    2. Generate TWO OTP codes (email + SMS)
    3. Send email OTP via console/email
    4. Send SMS OTP via Twilio
    5. User verifies using EITHER OTP
    6. Account activated
    """
    
    # ✅ SECURITY FIX: Validate password strength (Bug #9)
    password = user.password
    if len(password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long"
        )
    if not any(c.isupper() for c in password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one uppercase letter"
        )
    if not any(c.islower() for c in password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one lowercase letter"
        )
    if not any(c.isdigit() for c in password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one number"
        )
    if not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)"
        )
    
    # Check if user exists
    result = await session.execute(select(User).where(User.email == user.email))
    existing_user = result.scalars().first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    

    
    # HR Domain Restriction
    if user.role == UserRole.HR:
        public_domains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com"]
        domain = user.email.split("@")[-1]
        if domain in public_domains:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="HR accounts must use a corporate email address. Public domains are not allowed."
            )

    # Generate OTP codes
    # Generate OTP codes
    from datetime import timedelta
    from email_utils import send_email_otp
    
    email_otp = str(secrets.randbelow(1000000)).zfill(6)  # 6-digit code
    
    # ✅ TEST MODE BYPASS (For Demo/Dev)
    # If email starts with 'test' or ends with 'example.com', use fixed OTP '000000'
    if user.email.lower().startswith("test") or user.email.lower().endswith("@example.com"):
        email_otp = "000000"
        print(f"🔓 TEST MODE: Fixed OTP '000000' generated for {user.email}")
    otp_expiry = datetime.utcnow() + timedelta(minutes=5)
    otp_expiry = datetime.utcnow() + timedelta(minutes=5)
    
    # Create new user with OTPs
    hashed_password = get_password_hash(user.password)
    
    db_user = User(
        email=user.email,
        full_name=user.full_name,
        hashed_password=hashed_password,
        role=user.role,
        university_or_company=user.university_or_company,
        is_verified=False,  # Require OTP verification
        verification_token=secrets.token_urlsafe(32),  # Keep for backward compatibility
        email_otp=email_otp,
        email_otp_expires=otp_expiry
    )
    
    session.add(db_user)
    await session.commit()
    await session.refresh(db_user)
    
    # Send Email OTP (async)
    await send_email_otp(db_user.email, db_user.full_name, email_otp)

    return {
        "access_token": "", 
        "token_type": "bearer",
        # Include user_id in response for frontend to use in verification
    }


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    role: str # 'student' or 'hr' - Enforced context

# ✅ SECURITY FIX: Rate limit login attempts (Bug #8)
@app.post("/auth/login", response_model=Token)
@limiter.limit("5/minute")  # Max 5 login attempts per minute per IP
async def login(request: Request, user_data: LoginRequest, session: AsyncSession = Depends(get_session)):
    
    result = await session.execute(select(User).where(User.email == user_data.email))
    user = result.scalars().first()
    
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 2. Enforce RBAC (Context Check)
    # If user tries to login as HR but is a Student (or vice versa), block them.
    if user.role.value != user_data.role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access Denied: You are registered as a {user.role.value.capitalize()}, but are trying to login to the {user_data.role.capitalize()} Portal."
        )

    # 3. Enforce Email Verification
    if not user.is_verified:
         raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account not verified. Please verify your account using OTP."
        )

    access_token = create_access_token(data={"sub": user.email, "role": user.role.value})
    return {"access_token": access_token, "token_type": "bearer"}

from pydantic import BaseModel
class MockLoginRequest(BaseModel):
    role: str


@app.get("/auth/verify")
async def verify_email(token: str, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(User).where(User.verification_token == token))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=400, detail="Invalid verification token")
        
    user.is_verified = True
    user.verification_token = None
    session.add(user)
    await session.commit()
    
    return {"message": "Email verified successfully! You can now login."}


# ============================================================================
# DUAL OTP VERIFICATION ENDPOINTS
# ============================================================================

class VerifyOTPRequest(BaseModel):
    email_or_phone: str  # User can provide email OR phone
    otp: str  # 6-digit code
    verification_type: str  # "email" or "sms"

class ResendOTPRequest(BaseModel):
    email: str
    method: str  # "email" or "sms" or "both"


@app.post("/auth/verify-otp")
async def verify_otp(request: VerifyOTPRequest, session: AsyncSession = Depends(get_session)):
    """
    Verify OTP Code (Email OR SMS)
    User can verify using EITHER email OTP or SMS OTP
    """
    
    # Find user by email
    result = await session.execute(
        select(User).where(User.email == request.email_or_phone)
    )
    
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if already verified
    if user.is_verified:
        return {"success": True, "message": "Account already verified"}
    
    # Verify OTP
    if not user.email_otp:
        raise HTTPException(status_code=400, detail="No email OTP found. Please request a new code.")
    
    if user.email_otp_expires and datetime.utcnow() > user.email_otp_expires:
        raise HTTPException(status_code=400, detail="Email OTP has expired. Please request a new code.")
    
    if user.email_otp != request.otp:
        raise HTTPException(status_code=400, detail="Invalid email OTP code")
    
    # Success! Mark user as verified
    user.is_verified = True
    user.email_otp = None  # Clear email OTP
    user.email_otp_expires = None
    
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
    Resend OTP Code(s) - Email, SMS, or Both
    """
    from email_utils import send_email_otp
    
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
        
        # Send Email OTP (async)
        await send_email_otp(user.email, user.full_name, email_otp)
    
    session.add(user)
    await session.commit()
    
    return {
        "success": True,
        "message": f"OTP code(s) resent successfully via email"
    }


# @app.post("/auth/google-mock", response_model=Token)
# async def google_mock_login(request: MockLoginRequest, session: AsyncSession = Depends(get_session)):
#     """
#     Simulates a Google Login for demonstration purposes.
#     Automatically logs in (or creates) a user: demo_student@gmail.com or demo_hr@gmail.com
#     """
#     role_str = request.role
#     email = f"demo_{role_str}@gmail.com"
#     
#     # Check if demo user exists
#     result = await session.execute(select(User).where(User.email == email))
#     user = result.scalars().first()
#     
#     if not user:
#         # Create Demo User on the fly
#         hashed_password = get_password_hash("demo_password")
#         user = User(
#             email=email,
#             full_name=f"Demo {role_str.capitalize()}",
#             hashed_password=hashed_password,
#             role=UserRole.HR if role_str == "hr" else UserRole.STUDENT,
#             company_name="Google Demo Inc" if role_str == "hr" else None,
#             university="Stanford University" if role_str != "hr" else None,
#             is_verified=True # Auto-verify demo accounts
#         )
#         session.add(user)
#         await session.commit()
#         await session.refresh(user)
#     
#     access_token = create_access_token(data={"sub": user.email, "role": user.role.value})
#     return {"access_token": access_token, "token_type": "bearer"}
