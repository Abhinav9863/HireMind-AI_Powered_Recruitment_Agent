"""
Database Migration: Dual OTP Verification System
This script migrates the database for dual verification (Email OTP + SMS OTP)

Changes:
1. Add email_otp and email_otp_expires fields
2. Replace university and company_name with university_or_company
3. Make phone_number required (migration keeps it nullable, app logic requires it)
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
        print("=" * 70)
        print("  DUAL OTP VERIFICATION SYSTEM - Database Migration")
        print("=" * 70)
        
        # 1. Add email OTP fields
        print("\n📧 Adding Email OTP fields...")
        try:
            await conn.execute(text(
                'ALTER TABLE "user" ADD COLUMN email_otp VARCHAR(10)'
            ))
            print("✅ Added email_otp column")
        except Exception as e:
            print(f"⚠️  email_otp column might already exist: {e}")
        
        try:
            await conn.execute(text(
                'ALTER TABLE "user" ADD COLUMN email_otp_expires TIMESTAMP'
            ))
            print("✅ Added email_otp_expires column")
        except Exception as e:
            print(f"⚠️  email_otp_expires column might already exist: {e}")
        
        # 2. Add university_or_company field
        print("\n🏫 Adding unified university_or_company field...")
        try:
            await conn.execute(text(
                'ALTER TABLE "user" ADD COLUMN university_or_company VARCHAR(255)'
           ))
            print("✅ Added university_or_company column")
        except Exception as e:
            print(f"⚠️  university_or_company column might already exist: {e}")
        
        # 3. Migrate existing data from university and company_name
        print("\n📊 Migrating existing data...")
        try:
            # Copy university data for students
            await conn.execute(text(
                '''UPDATE "user" 
                   SET university_or_company = university 
                   WHERE university IS NOT NULL AND role = 'student' '''
            ))
            print("✅ Migrated university data")
            
            # Copy company_name data for HR
            await conn.execute(text(
                '''UPDATE "user" 
                   SET university_or_company = company_name 
                   WHERE company_name IS NOT NULL AND role = 'hr' '''
            ))
            print("✅ Migrated company_name data")
        except Exception as e:
            print(f"⚠️  Data migration issue: {e}")
        
        # 4. Drop old columns (optional - commented out for safety)
        print("\n🗑️  Cleaning up old columns...")
        print("⚠️  Skipping drop of university and company_name (safety - uncomment to remove)")
        # Uncomment these after verifying data migration:
        # await conn.execute(text('ALTER TABLE "user" DROP COLUMN IF EXISTS university'))
        # await conn.execute(text('ALTER TABLE "user" DROP COLUMN IF EXISTS company_name'))
        
        print("\n" + "=" * 70)
        print("✅ Migration completed successfully!")
        print("=" * 70)
        print("\nNext steps:")
        print("1. Verify data migration: Check if university_or_company is populated")
        print("2. If confirmed, uncomment drop column statements and re-run")
        print("3. Restart backend container")
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(migrate())
