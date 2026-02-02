from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
from datetime import datetime
from typing import List

from database import get_session
from models import InterviewSlot, User, UserRole
from auth import get_current_user
import secrets

router = APIRouter(
    prefix="/schedule",
    tags=["schedule"]
)

class SlotCreate(BaseModel):
    start_time: datetime
    end_time: datetime

class SlotRead(BaseModel):
    id: int
    hr_id: int
    candidate_id: int | None
    start_time: datetime
    end_time: datetime
    meet_link: str
    status: str

@router.post("/slots", response_model=SlotRead)
async def create_slot(
    slot: SlotCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    if current_user.role != UserRole.HR:
        raise HTTPException(status_code=403, detail="Only HR can create interview slots")

    # Generate a simulated Google Meet link
    # Format: meet.google.com/abc-defg-hij
    chars = "abcdefghijklmnopqrstuvwxyz"
    part1 = "".join(secrets.choice(chars) for _ in range(3))
    part2 = "".join(secrets.choice(chars) for _ in range(4))
    part3 = "".join(secrets.choice(chars) for _ in range(3))
    meet_link = f"https://meet.google.com/{part1}-{part2}-{part3}"

    new_slot = InterviewSlot(
        hr_id=current_user.id,
        start_time=slot.start_time.replace(tzinfo=None),
        end_time=slot.end_time.replace(tzinfo=None),
        meet_link=meet_link,
        status="AVAILABLE"
    )

    session.add(new_slot)
    await session.commit()
    await session.refresh(new_slot)
    return new_slot

@router.get("/slots", response_model=List[SlotRead])
async def get_slots(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    # If HR, show THEIR slots
    # If Student, technically no need to see all, but maybe for future self-selection
    # For now, restrict to HR seeing their own
    
    if current_user.role == UserRole.HR:
        stmt = select(InterviewSlot).where(InterviewSlot.hr_id == current_user.id).order_by(InterviewSlot.start_time)
    else:
        # Students shouldn't casually browse assignments yet, unless we change logic
        # But allow empty return for safety
        return []

    result = await session.execute(stmt)
    return result.scalars().all()
