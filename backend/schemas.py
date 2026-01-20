from pydantic import BaseModel, EmailStr
from typing import Optional
from models import UserRole

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: UserRole
    # Optional fields
    company_name: Optional[str] = None
    university: Optional[str] = None

class UserRead(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: UserRole

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None
class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = None # e.g. Job Title

class ChatResponse(BaseModel):
    reply: str

# Job Schemas
class JobCreate(BaseModel):
    title: str
    description: str
    location: str
    salary_range: str
    job_type: str

class JobRead(JobCreate):
    id: int
    company: str
    hr_id: int
    created_at: datetime

# Application Schemas
from datetime import datetime
class ApplicationCreate(BaseModel):
    job_id: int

class ApplicationRead(BaseModel):
    id: int
    job_id: int
    student_id: int
    ats_score: int
    ats_feedback: Optional[str]
    created_at: datetime
