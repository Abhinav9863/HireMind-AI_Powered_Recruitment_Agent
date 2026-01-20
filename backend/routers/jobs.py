from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from database import get_session
from models import Job, User, UserRole
from schemas import JobCreate, JobRead, TokenData
from auth import oauth2_scheme, verify_token # We need to expose verify_token or re-implement dependency

# Temporarily re-implementing get_current_user dependency here if not in auth.py
# Ideally, move get_current_user to auth.py and import it.
from jose import jwt, JWTError
from auth import SECRET_KEY, ALGORITHM

async def get_current_user(token: str = Depends(oauth2_scheme), session: AsyncSession = Depends(get_session)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        role: str = payload.get("role")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email, role=role)
    except JWTError:
        raise credentials_exception
        
    result = await session.execute(select(User).where(User.email == token_data.email))
    user = result.scalars().first()
    if user is None:
        raise credentials_exception
    return user

router = APIRouter(
    prefix="/jobs",
    tags=["jobs"]
)

@router.post("/", response_model=JobRead)
async def create_job(job: JobCreate, current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    if current_user.role != UserRole.HR:
        raise HTTPException(status_code=403, detail="Only HR can post jobs")
    
    new_job = Job(
        title=job.title,
        company=current_user.company_name or "Unknown Company",
        description=job.description,
        location=job.location,
        salary_range=job.salary_range,
        job_type=job.job_type,
        hr_id=current_user.id
    )
    
    session.add(new_job)
    await session.commit()
    await session.refresh(new_job)
    return new_job

@router.get("/", response_model=List[JobRead])
async def get_jobs(session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Job).order_by(Job.created_at.desc()))
    jobs = result.scalars().all()
    return jobs
