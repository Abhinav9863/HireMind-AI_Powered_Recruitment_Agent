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
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Profile fields (Optional based on role)
    company_name: Optional[str] = None # For HR
    university: Optional[str] = None   # For Student
