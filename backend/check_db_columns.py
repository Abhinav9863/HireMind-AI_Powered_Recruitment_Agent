
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

async def check_columns():
    engine = create_async_engine(DATABASE_URL)
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'user'"))
        columns = [row[0] for row in result.fetchall()]
        print("Columns in 'user' table:")
        for col in columns:
            print(f"- {col}")
            
        required = ["phone_verified", "sms_otp", "sms_otp_expires"]
        missing = [col for col in required if col not in columns]
        
        if missing:
            print(f"\n❌ Missing columns: {missing}")
        else:
            print("\n✅ All modification columns present!")

if __name__ == "__main__":
    asyncio.run(check_columns())
