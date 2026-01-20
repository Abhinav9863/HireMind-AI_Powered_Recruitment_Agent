from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from contextlib import asynccontextmanager

from database import init_db, get_session
from models import User
from routers import interview, jobs

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(title="HireMind API", lifespan=lifespan)

app.include_router(interview.router)
app.include_router(jobs.router)

# CORS (Allow Frontend to connect)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"], # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        full_name=user.full_name,
        hashed_password=hashed_password,
        role=user.role,
        company_name=user.company_name,
        university=user.university
    )
    
    session.add(db_user)
    await session.commit()
    await session.refresh(db_user)
    
    # Generate Token immediately (Auto-login)
    access_token = create_access_token(data={"sub": db_user.email, "role": db_user.role.value})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/auth/login", response_model=Token)
async def login(user_data: UserCreate, session: AsyncSession = Depends(get_session)):
    # Note: Using UserCreate here just for input structure, usually OAuth2PasswordRequestForm is stricter
    # But for custom JSON login, we'll verify email/password manually.
    
    result = await session.execute(select(User).where(User.email == user_data.email))
    user = result.scalars().first()
    
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token = create_access_token(data={"sub": user.email, "role": user.role.value})
    return {"access_token": access_token, "token_type": "bearer"}

from pydantic import BaseModel
class MockLoginRequest(BaseModel):
    role: str

@app.post("/auth/google-mock", response_model=Token)
async def google_mock_login(request: MockLoginRequest, session: AsyncSession = Depends(get_session)):
    """
    Simulates a Google Login for demonstration purposes.
    Automatically logs in (or creates) a user: demo_student@gmail.com or demo_hr@gmail.com
    """
    role_str = request.role
    email = f"demo_{role_str}@gmail.com"
    
    # Check if demo user exists
    result = await session.execute(select(User).where(User.email == email))
    user = result.scalars().first()
    
    if not user:
        # Create Demo User on the fly
        hashed_password = get_password_hash("demo_password")
        user = User(
            email=email,
            full_name=f"Demo {role_str.capitalize()}",
            hashed_password=hashed_password,
            role=UserRole.HR if role_str == "hr" else UserRole.STUDENT,
            company_name="Google Demo Inc" if role_str == "hr" else None,
            university="Stanford University" if role_str != "hr" else None
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
    
    access_token = create_access_token(data={"sub": user.email, "role": user.role.value})
    return {"access_token": access_token, "token_type": "bearer"}
