import asyncio
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_session, engine
from models import User

async def get_token():
    async with engine.begin() as conn:
        # We need to manually create a session because get_session is a generator
        from sqlalchemy.orm import sessionmaker
        async_session = sessionmaker(
            engine, class_=AsyncSession, expire_on_commit=False
        )
        async with async_session() as session:
            result = await session.execute(select(User))
            users = result.scalars().all()
            for user in users:
                print(f"User: {user.email} | Token: {user.verification_token}")

if __name__ == "__main__":
    asyncio.run(get_token())
