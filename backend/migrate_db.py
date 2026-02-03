import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import os

# Adjust connection string for local host access (exposed port 5435)
DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql+asyncpg://hiremind:password@localhost:5435/hiremind_db")

async def migrate():
    print(f"🔌 Connecting to database...")
    engine = create_async_engine(DATABASE_URL, echo=True)
    
    async with engine.begin() as conn:
        print("🚀 Running migrations...")
        
        # 1. Add work_location to Job table
        try:
            await conn.execute(text("ALTER TABLE job ADD COLUMN work_location VARCHAR DEFAULT 'In-Office';"))
            print("✅ Added work_location to job table")
        except Exception as e:
            print(f"⚠️  work_location might already exist: {e}")

        # 2. Add experience_years to Application table
        try:
            await conn.execute(text("ALTER TABLE application ADD COLUMN experience_years INTEGER DEFAULT 0;"))
            print("✅ Added experience_years to application table")
        except Exception as e:
            print(f"⚠️  experience_years might already exist: {e}")

    await engine.dispose()
    print("✨ Migration completed")

if __name__ == "__main__":
    asyncio.run(migrate())
