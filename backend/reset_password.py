"""
Quick script to reset password for a user
"""
import asyncio
import sys
import os
from dotenv import load_dotenv

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

load_dotenv()

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.future import select
from models import User
from auth import get_password_hash

DATABASE_URL = os.getenv("DATABASE_URL")

async def reset_password(email: str, new_password: str):
    """Reset password for a user"""
    engine = create_async_engine(DATABASE_URL, echo=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Find user
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalars().first()
        
        if not user:
            print(f"❌ User with email {email} not found!")
            return
        
        # Update password
        user.hashed_password = get_password_hash(new_password)
        session.add(user)
        await session.commit()
        
        print(f"✅ Password reset successfully for {email}")
        print(f"   New password: {new_password}")
        print(f"   Role: {user.role.value}")
        print(f"   Verified: {user.is_verified}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python reset_password.py <email> <new_password>")
        print("Example: python reset_password.py abhinav@sayonetech.com NewPassword@123")
        sys.exit(1)
    
    email = sys.argv[1]
    new_password = sys.argv[2]
    
    asyncio.run(reset_password(email, new_password))
