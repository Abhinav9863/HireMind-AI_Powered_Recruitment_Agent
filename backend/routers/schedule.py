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

    # 1. Overlap Check
    # Existing Start < New End AND Existing End > New Start
    stmt = (
        select(InterviewSlot)
        .where(InterviewSlot.hr_id == current_user.id)
        .where(InterviewSlot.start_time < slot.end_time.replace(tzinfo=None))
        .where(InterviewSlot.end_time > slot.start_time.replace(tzinfo=None))
    )
    result = await session.execute(stmt)
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Slot occupied: This time range overlaps with an existing slot.")

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


class SlotUpdate(BaseModel):
    start_time: datetime
    end_time: datetime


@router.put("/slots/{slot_id}", response_model=SlotRead)
async def update_slot(
    slot_id: int,
    slot_update: SlotUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    if current_user.role != UserRole.HR:
        raise HTTPException(status_code=403, detail="Only HR can update interview slots")

    # Fetch the slot
    result = await session.execute(select(InterviewSlot).where(InterviewSlot.id == slot_id))
    slot = result.scalars().first()

    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")

    # Verify ownership
    if slot.hr_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only update your own slots")

    # 1. Overlap Check (Excluding self)
    stmt = (
        select(InterviewSlot)
        .where(InterviewSlot.hr_id == current_user.id)
        .where(InterviewSlot.id != slot_id) 
        .where(InterviewSlot.start_time < slot_update.end_time.replace(tzinfo=None))
        .where(InterviewSlot.end_time > slot_update.start_time.replace(tzinfo=None))
    )
    result = await session.execute(stmt)
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Slot occupied: This time range overlaps with an existing slot.")

    # Store old times for email notification
    was_booked = slot.status == "BOOKED"
    candidate_id = slot.candidate_id

    # Update slot times
    slot.start_time = slot_update.start_time.replace(tzinfo=None)
    slot.end_time = slot_update.end_time.replace(tzinfo=None)

    session.add(slot)
    await session.commit()
    await session.refresh(slot)

    # If slot was booked, send reschedule email to candidate
    if was_booked and candidate_id:
        from email_utils import send_interview_rescheduled_email
        from models import Application, Job # Import here to avoid circular
        
        # Get candidate info
        candidate_result = await session.execute(select(User).where(User.id == candidate_id))
        candidate = candidate_result.scalars().first()

        # Attempt to find Job Title (heuristic: find latest application with this HR)
        job_title = "Scheduled Interview"
        try:
             # Find applications where candidate = candidate_id AND job.hr_id = current_user.id
             app_stmt = (
                 select(Application, Job)
                 .join(Job, Application.job_id == Job.id)
                 .where(Application.student_id == candidate_id)
                 .where(Job.hr_id == current_user.id)
                 .order_by(Application.created_at.desc())
             )
             app_res = await session.execute(app_stmt)
             app_row = app_res.first()
             if app_row:
                 _, job = app_row
                 job_title = job.title
        except Exception as e:
             print(f"Error fetching job title for email: {e}")

        if candidate:
            new_datetime_str = f"{slot.start_time.strftime('%B %d, %Y')} at {slot.start_time.strftime('%I:%M %p')}"

            await send_interview_rescheduled_email(
                candidate.email,
                candidate.full_name,
                job_title,
                new_datetime_str,
                slot.meet_link
            )

    # Return updated slot with candidate info
    slot_dict = slot.dict()
    if candidate_id:
        candidate_result = await session.execute(select(User).where(User.id == candidate_id))
        candidate = candidate_result.scalars().first()
        if candidate:
            slot_dict["candidate_name"] = candidate.full_name
            slot_dict["candidate_email"] = candidate.email

    return slot_dict


@router.delete("/slots/{slot_id}")
async def delete_slot(
    slot_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    if current_user.role != UserRole.HR:
        raise HTTPException(status_code=403, detail="Only HR can delete interview slots")

    # Fetch the slot
    result = await session.execute(select(InterviewSlot).where(InterviewSlot.id == slot_id))
    slot = result.scalars().first()

    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")

    # Verify ownership
    if slot.hr_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own slots")

    # If slot was booked, send cancellation email to candidate
    if slot.status == "BOOKED" and slot.candidate_id:
        from email_utils import send_interview_cancelled_email
        from models import Application, Job
        
        # Get candidate info
        candidate_result = await session.execute(select(User).where(User.id == slot.candidate_id))
        candidate = candidate_result.scalars().first()
        
        # Attempt to find Job Title
        job_title = "Scheduled Interview"
        try:
             app_stmt = (
                 select(Application, Job)
                 .join(Job, Application.job_id == Job.id)
                 .where(Application.student_id == slot.candidate_id)
                 .where(Job.hr_id == current_user.id)
                 .order_by(Application.created_at.desc())
             )
             app_res = await session.execute(app_stmt)
             app_row = app_res.first()
             if app_row:
                 _, job = app_row
                 job_title = job.title
        except Exception as e:
             print(f"Error fetching job title for email: {e}")

        if candidate:
            await send_interview_cancelled_email(
                candidate.email,
                candidate.full_name,
                job_title
            )

    # Delete the slot
    await session.delete(slot)
    await session.commit()

    return {"message": "Slot deleted successfully", "notified": slot.status == "BOOKED"}

