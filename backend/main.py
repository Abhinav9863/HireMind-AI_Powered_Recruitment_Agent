from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from contextlib import asynccontextmanager

from database import init_db, get_session
from models import User, UserRole
from schemas import UserCreate, Token
from auth import get_password_hash, create_access_token, verify_password
from routers import interview, jobs, ats, applications, users
import secrets
from pydantic import BaseModel, EmailStr

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(title="HireMind API", lifespan=lifespan)

app.include_router(interview.router)
app.include_router(jobs.router)
app.include_router(ats.router)
app.include_router(applications.router)
app.include_router(users.router)

# CORS (Allow Frontend to connect)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"], # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    # Check if user exists
    result = await session.execute(select(User).where(User.email == user.email))
    existing_user = result.scalars().first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # 1. HR Domain Restriction
    if user.role == UserRole.HR:
        public_domains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com"]
        domain = user.email.split("@")[-1]
        if domain in public_domains:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="HR accounts must use a corporate email address (e.g., name@company.com). Public domains are not allowed."
            )

    # Create new user
    hashed_password = get_password_hash(user.password)
    verification_token = secrets.token_urlsafe(32)
    
    db_user = User(
        email=user.email,
        full_name=user.full_name,
        hashed_password=hashed_password,
        role=user.role,
        company_name=user.company_name,
        university=user.university,
        is_verified=True, # Enforce verification -> Disabled for now
        verification_token=verification_token
    )
    
    session.add(db_user)
    await session.commit()
    await session.refresh(db_user)
    
    # Simulate Sending Email (Log it)
    print(f"--- EMAIL SIMULATION ---")
    print(f"To: {db_user.email}")
    print(f"Subject: Verify your HireMind Account")
    print(f"Link: http://localhost:8000/auth/verify?token={verification_token}")
    print(f"------------------------")

    return {"access_token": "", "token_type": "bearer"} # Don't login yet


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    role: str # 'student' or 'hr' - Enforced context

@app.post("/auth/login", response_model=Token)
async def login(user_data: LoginRequest, session: AsyncSession = Depends(get_session)):
    
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
    # if not user.is_verified:
    #      raise HTTPException(
    #         status_code=status.HTTP_403_FORBIDDEN,
    #         detail="Email not verified. Please check your inbox for the verification link."
    #     )

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
