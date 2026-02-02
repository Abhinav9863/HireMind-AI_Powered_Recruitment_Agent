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
    candidate_name: str | None = None
    candidate_email: str | None = None
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
    if current_user.role == UserRole.HR:
        # Join with User to get candidate details
        stmt = (
            select(InterviewSlot, User)
            .outerjoin(User, InterviewSlot.candidate_id == User.id)
            .where(InterviewSlot.hr_id == current_user.id)
            .order_by(InterviewSlot.start_time)
        )
    else:
        return []

    result = await session.execute(stmt)
    rows = result.all()
    
    final_slots = []
    for slot, candidate in rows:
        slot_dict = slot.dict()
        if candidate:
            slot_dict["candidate_name"] = candidate.full_name
            slot_dict["candidate_email"] = candidate.email
        final_slots.append(slot_dict)
        
    return final_slots

