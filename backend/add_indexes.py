"""
Database Index Migration Script
Adds indexes to frequently queried columns for better performance
"""

import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://hiremind:password@localhost:5435/hiremind_db")

async def add_indexes():
    """Add indexes to improve query performance"""
    engine = create_async_engine(DATABASE_URL, echo=True)
    
    async with engine.begin() as conn:
        print("✅ Adding database indexes for better performance...")
        
        # ✅ BUG #10 FIX: Add indexes on frequently queried foreign keys
        
        # Index on application.job_id (queried when showing job applications)
        await conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_application_job_id 
            ON application(job_id);
        """))
        print("✅ Created index: idx_application_job_id")
        
        # Index on application.student_id (queried when showing student's applications)
        await conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_application_student_id 
            ON application(student_id);
        """))
        print("✅ Created index: idx_application_student_id")
        
        # Index on job.hr_id (queried when showing HR's jobs)
        await conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_job_hr_id 
            ON job(hr_id);
        """))
        print("✅ Created index: idx_job_hr_id")
        
        # Index on user.email (already exists as UNIQUE, but explicit index helps)
        await conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_user_email 
            ON "user"(email);
        """))
        print("✅ Created index: idx_user_email")
        
        # Index on job.created_at for ordering
        await conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_job_created_at 
            ON job(created_at DESC);
        """))
        print("✅ Created index: idx_job_created_at")
        
        print("\n🎉 All indexes created successfully!")
        print("Performance improvements:")
        print("  - Faster job application lookups")
        print("  - Faster user queries")
        print("  - Better job listing pagination")
    
    await engine.dispose()

if __name__ == "__main__":
    print("Starting database index migration...")
    asyncio.run(add_indexes())
    print("✅ Migration complete!")
