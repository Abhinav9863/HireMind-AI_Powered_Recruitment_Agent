"""
Add 'viewed' column to application table
"""

import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://hiremind:password@localhost:5435/hiremind_db")

async def add_viewed_column():
    """Add viewed column to application table"""
    engine = create_async_engine(DATABASE_URL, echo=True)
    
    async with engine.begin() as conn:
        print("✅ Adding 'viewed' column to application table...")
        
        await conn.execute(text("""
            ALTER TABLE application 
            ADD COLUMN IF NOT EXISTS viewed BOOLEAN DEFAULT FALSE;
        """))
        print("✅ Added 'viewed' column successfully!")
        
        # Update all existing applications to viewed=false
        await conn.execute(text("""
            UPDATE application 
            SET viewed = FALSE 
            WHERE viewed IS NULL;
        """))
        print("✅ Updated existing applications to unviewed")
    
    await engine.dispose()
    print("✅ Migration complete!")

if __name__ == "__main__":
    print("Starting database migration for 'viewed' column...")
    asyncio.run(add_viewed_column())
