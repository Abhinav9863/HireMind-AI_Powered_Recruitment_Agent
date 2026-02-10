from sqlmodel import SQLModel, create_engine
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# Database URL (Matches docker-compose services)
DATABASE_URL = os.getenv("DATABASE_URL")

# Fix for Render: SQLAlchemy AsyncEngine requires 'postgresql+asyncpg://'
if DATABASE_URL and DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

engine = create_async_engine(DATABASE_URL, echo=False, future=True)

async def init_db():
    async with engine.begin() as conn:
        # await conn.run_sync(SQLModel.metadata.drop_all) # Uncomment to reset DB
        await conn.run_sync(SQLModel.metadata.create_all)
        
        # ---------------------------------------------------------
        # AUTO-MIGRATION: Check & Add Missing Columns for Production
        # ---------------------------------------------------------
        from sqlalchemy import text
        
        # We use raw SQL 'DO' blocks to safely add columns if they don't exist
        # This is safer than checking information_schema manually in python

        # Job: experience_required
        await conn.execute(text("""
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='job' AND column_name='experience_required') THEN 
                    ALTER TABLE job ADD COLUMN experience_required INTEGER DEFAULT 0 NOT NULL; 
                END IF;
            END $$;
        """))

        # Job: work_location
        await conn.execute(text("""
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='job' AND column_name='work_location') THEN 
                    ALTER TABLE job ADD COLUMN work_location VARCHAR DEFAULT 'In-Office' NOT NULL; 
                END IF;
            END $$;
        """))

        # Job: policy_path
        await conn.execute(text("""
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='job' AND column_name='policy_path') THEN 
                    ALTER TABLE job ADD COLUMN policy_path VARCHAR; 
                END IF;
            END $$;
        """))

        # User: company_policy_path
        await conn.execute(text("""
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user' AND column_name='company_policy_path') THEN 
                    ALTER TABLE "user" ADD COLUMN company_policy_path VARCHAR; 
                END IF;
            END $$;
        """))

async def get_session() -> AsyncSession:
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    async with async_session() as session:
        yield session
