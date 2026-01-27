import asyncio
import os
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("DATABASE_URL not found")
    exit(1)

engine = create_async_engine(DATABASE_URL, echo=True)

async def migrate():
    async with engine.begin() as conn:
        print("Migrating schema...")
        
        stmts = [
            'ALTER TABLE "user" ADD COLUMN IF NOT EXISTS profile_picture VARCHAR',
            'ALTER TABLE "user" ADD COLUMN IF NOT EXISTS resume_path VARCHAR',
            'ALTER TABLE "user" ADD COLUMN IF NOT EXISTS bio VARCHAR',
            'ALTER TABLE "user" ADD COLUMN IF NOT EXISTS phone_number VARCHAR',
            'ALTER TABLE "user" ADD COLUMN IF NOT EXISTS company_name VARCHAR',
            'ALTER TABLE "user" ADD COLUMN IF NOT EXISTS university VARCHAR'
        ]
        
        for stmt in stmts:
            try:
                await conn.execute(text(stmt))
                print(f"Executed: {stmt}")
            except Exception as e:
                print(f"Error executing {stmt}: {e}")
                
    print("Migration complete.")

if __name__ == "__main__":
    asyncio.run(migrate())
