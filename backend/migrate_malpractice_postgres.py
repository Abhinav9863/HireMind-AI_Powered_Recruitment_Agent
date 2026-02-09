import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv()

# Get DB URL and ensure async driver
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

async def migrate():
    engine = create_async_engine(DATABASE_URL, echo=True)
    async with engine.begin() as conn:
        try:
            print("Attempting to add tab_switch_count...")
            await conn.execute(text("ALTER TABLE application ADD COLUMN IF NOT EXISTS tab_switch_count INTEGER DEFAULT 0"))
            print("Success or already exists.")
        except Exception as e:
             print(f"Error adding tab_switch_count: {e}")

        try:
            print("Attempting to add is_disqualified_malpractice...")
            await conn.execute(text("ALTER TABLE application ADD COLUMN IF NOT EXISTS is_disqualified_malpractice BOOLEAN DEFAULT FALSE"))
            print("Success or already exists.")
        except Exception as e:
            print(f"Error adding is_disqualified_malpractice: {e}")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(migrate())
