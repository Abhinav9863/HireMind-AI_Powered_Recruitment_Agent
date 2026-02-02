"""
Migration script to add experience_required column to job table
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import os

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql+asyncpg://hiremind:password@localhost:5432/hiremind_db")

async def migrate():
    engine = create_async_engine(DATABASE_URL, echo=True)
    
    async with engine.begin() as conn:
        # Check if column exists
        result = await conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='job' AND column_name='experience_required';
        """))
        exists = result.fetchone()
        
        if exists:
            print("✅ Column 'experience_required' already exists in job table")
        else:
            # Add the column with default value 0
            await conn.execute(text("""
                ALTER TABLE job 
                ADD COLUMN experience_required INTEGER DEFAULT 0 NOT NULL;
            """))
            print("✅ Added 'experience_required' column to job table")
            
            # Update existing jobs to default to 0 (freshers welcome)
            await conn.execute(text("""
                UPDATE job SET experience_required = 0 WHERE experience_required IS NULL;
            """))
            print("✅ Set default value 0 for all existing jobs")
    
    await engine.dispose()
    print("\n🎉 Migration completed successfully!")

if __name__ == "__main__":
    asyncio.run(migrate())
