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

        # ---------------------------------------------------------
        # AUTO-MIGRATION: Check & Add Missing Columns for Production
        # ---------------------------------------------------------
        from sqlalchemy import text
        
        # Helper function to add column if it doesn't exist
        async def ensure_column(table, column, definition):
            try:
                # Check if column exists
                check_sql = text(f"SELECT 1 FROM information_schema.columns WHERE table_name='{table}' AND column_name='{column}'")
                result = await conn.execute(check_sql)
                if not result.fetchone():
                    print(f"⚠️ Column '{column}' missing in '{table}'. Adding...")
                    await conn.execute(text(f"ALTER TABLE \"{table}\" ADD COLUMN {column} {definition}"))
                    print(f"✅ Added column '{column}' to '{table}'")
                else:
                    print(f"start_up_check: Column '{column}' exists in '{table}'")
            except Exception as e:
                print(f"❌ Error checking/adding column {column} in {table}: {e}")

        # Execute checks for Job table
        await ensure_column('job', 'experience_required', 'INTEGER DEFAULT 0 NOT NULL')
        await ensure_column('job', 'work_location', "VARCHAR DEFAULT 'In-Office' NOT NULL")
        await ensure_column('job', 'policy_path', 'VARCHAR')
        
        # Execute checks for User table
        await ensure_column('user', 'company_policy_path', 'VARCHAR')
        
        # Execute checks for Application table (Malpractice Detection)
        await ensure_column('application', 'tab_switch_count', 'INTEGER DEFAULT 0 NOT NULL')
        await ensure_column('application', 'is_disqualified_malpractice', 'BOOLEAN DEFAULT FALSE NOT NULL')

async def get_session() -> AsyncSession:
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    async with async_session() as session:
        yield session
