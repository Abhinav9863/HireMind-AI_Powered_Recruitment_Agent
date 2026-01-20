from sqlmodel import SQLModel, Field
from enum import Enum
from typing import Optional
from datetime import datetime

class UserRole(str, Enum):
    STUDENT = "student"
    HR = "hr"

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    full_name: str
    hashed_password: str
    role: UserRole
    is_verified: bool = Field(default=False)
    verification_token: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Profile fields (Optional based on role)
    company_name: Optional[str] = None # For HR
    university: Optional[str] = None   # For Student

class Job(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    company: str
    description: str
    location: str
    salary_range: str
    job_type: str = "Full-time"
    hr_id: int = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Application(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    job_id: int = Field(foreign_key="job.id")
    student_id: int = Field(foreign_key="user.id")
    resume_path: Optional[str] = None
    ats_score: int = 0
    ats_feedback: Optional[str] = None
    interview_transcript: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
