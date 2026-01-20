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
