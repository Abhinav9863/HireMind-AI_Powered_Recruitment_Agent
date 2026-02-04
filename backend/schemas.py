from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from models import UserRole

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str

    role: UserRole
    # Unified field for university or previous company
    university_or_company: Optional[str] = None

class UserRead(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: UserRole
    university_or_company: Optional[str] = None
    profile_picture: Optional[str] = None
    resume_path: Optional[str] = None
    bio: Optional[str] = None
    phone_number: Optional[str] = None
    company_policy_path: Optional[str] = None

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    university_or_company: Optional[str] = None
    bio: Optional[str] = None
    phone_number: Optional[str] = None

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

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
    work_location: str = "In-Office"
    experience_required: int = 0

class JobRead(JobCreate):
    id: int
    company: str
    hr_id: int
    created_at: datetime
    policy_path: Optional[str] = None
    work_location: str = "In-Office"
    unviewed_count: int = 0
    total_applications: int = 0

# Application Schemas
from datetime import datetime
class ApplicationCreate(BaseModel):
    job_id: int
    experience_years: int = 0

class ApplicationRead(BaseModel):
    id: int
    job_id: int
    student_id: int
    ats_score: int
    ats_feedback: Optional[str]
    status: str
    viewed: bool = False
    experience_years: int = 0
    created_at: datetime
    
class ApplicationReadWithStudent(ApplicationRead):
    candidate_name: str
    candidate_email: str

class ApplicationDetail(ApplicationReadWithStudent):
    resume_path: Optional[str]
    resume_text: Optional[str]
    candidate_info: Optional[dict]
    chat_history: Optional[list]
    ats_report: Optional[dict]
    interview_step: str

class StatusUpdate(BaseModel):
    status: str
