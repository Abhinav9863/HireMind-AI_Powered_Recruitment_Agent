from sqlmodel import SQLModel, Field
from enum import Enum
from typing import Optional, List
from datetime import datetime
from sqlalchemy import Column, JSON, Text

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
    
    # Profile fields
    university_or_company: Optional[str] = None  # Unified field for university or previous company
    profile_picture: Optional[str] = None
    resume_path: Optional[str] = None
    bio: Optional[str] = None
    phone_number: Optional[str] = None
    
    # Email Verification fields (OTP-based)
    email_otp: Optional[str] = None  # Stores the current email OTP code
    email_otp_expires: Optional[datetime] = None  # Email OTP expiration time
    
    # Password Reset fields
    reset_password_token: Optional[str] = None  # Token for password reset
    reset_password_expires: Optional[datetime] = None  # Token expiration time
    


class Job(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    company: str
    description: str
    location: str
    salary_range: str
    job_type: str = "Full-time"
    policy_path: Optional[str] = None
    experience_required: int = Field(default=0)  # Minimum years of experience (0 = freshers welcome)
    hr_id: int = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Application(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    job_id: int = Field(foreign_key="job.id")
    student_id: int = Field(foreign_key="user.id")
    resume_path: Optional[str] = None
    status: str = Field(default="Applied") # Applied, Interviewing, Rejected, Offer
    ats_score: int = 0
    ats_feedback: Optional[str] = None
    ats_report: Optional[dict] = Field(default={}, sa_column=Column(JSON))
    interview_transcript: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Interview Logic Fields
    resume_text: Optional[str] = Field(default=None, sa_column=Column(Text))
    interview_step: str = Field(default="init") # init, name, college, experience_check, cgpa, role_details, skills, technical_1, technical_2, technical_3, completed
    candidate_info: Optional[dict] = Field(default={}, sa_column=Column(JSON)) # Stores name, college, cgpa, skills
    generated_questions: Optional[list] = Field(default=[], sa_column=Column(JSON))
    current_question_index: int = Field(default=0)
    chat_history: Optional[list] = Field(default=[], sa_column=Column(JSON))

class ATSAnalysis(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    job_title: str
    score: int
    analysis_data: dict = Field(default={}, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)

class InterviewSlot(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    hr_id: int = Field(foreign_key="user.id")
    candidate_id: Optional[int] = Field(default=None, foreign_key="user.id", nullable=True)
    start_time: datetime
    end_time: datetime
    meet_link: str
    status: str = Field(default="AVAILABLE") # AVAILABLE, BOOKED
    is_collapsed: bool = Field(default=False)
