"""
Database Migration: Add Phone Verification Fields
This script adds SMS verification fields to the User table for multi-factor authentication.

New fields:
- phone_verified: Boolean flag for phone verification status
- sms_otp: Stores the current OTP code
- sms_otp_expires: Timestamp for OTP expiration
"""

import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

async def migrate():
    engine = create_async_engine(DATABASE_URL, echo=True)
    
    async with engine.begin() as conn:
        print("🔧 Adding phone verification fields to User table...")
        
        # Add phone_verified column
        try:
            await conn.execute(text(
                "ALTER TABLE \"user\" ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE"
            ))
            print("✅ Added phone_verified column")
        except Exception as e:
            print(f"⚠️  phone_verified column might already exist: {e}")
        
        # Add sms_otp column
        try:
            await conn.execute(text(
                "ALTER TABLE \"user\" ADD COLUMN sms_otp VARCHAR(10)"
            ))
            print("✅ Added sms_otp column")
        except Exception as e:
            print(f"⚠️  sms_otp column might already exist: {e}")
        
        # Add sms_otp_expires column
        try:
            await conn.execute(text(
                "ALTER TABLE \"user\" ADD COLUMN sms_otp_expires TIMESTAMP"
            ))
            print("✅ Added sms_otp_expires column")
        except Exception as e:
            print(f"⚠️  sms_otp_expires column might already exist: {e}")
        
        print("\n✅ Migration completed successfully!")
    
    await engine.dispose()

if __name__ == "__main__":
    print("=" * 60)
    print("  Phone Verification Migration Script")
    print("=" * 60)
    asyncio.run(migrate())
