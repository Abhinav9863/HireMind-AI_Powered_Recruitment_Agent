from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Dict, Any
from pydantic import BaseModel
from datetime import datetime

from database import get_session
from models import Application, User, UserRole, Job
from auth import get_current_user
from schemas import ApplicationDetail, StatusUpdate  # Make sure this import is correct

router = APIRouter(
    prefix="/applications",
    tags=["applications"]
)

class ApplicationRead(BaseModel):
    id: int
    job_id: int  # ✅ Added job_id
    status: str
    job_title: str
    company_name: str
    applied_at: datetime

class StatusUpdate(BaseModel):
    status: str

@router.get("/my", response_model=List[ApplicationRead])
async def get_my_applications(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Only students can view their applications")

    stmt = select(Application, Job).join(Job).where(Application.student_id == current_user.id)
    result = await session.execute(stmt)
    # result is (Application, Job) tuples
    
    apps = []
    for app, job in result:
        apps.append(ApplicationRead(
            id=app.id,
            job_id=app.job_id,  # ✅ Populate job_id
            status=app.status,
            job_title=job.title,
            company_name=job.company,
            applied_at=app.created_at
        ))
    return apps

@router.put("/{app_id}/status")
async def update_application_status(
    app_id: int,
    status_update: StatusUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    if current_user.role != UserRole.HR:
        raise HTTPException(status_code=403, detail="Only HR can update status")
        
    result = await session.execute(select(Application).where(Application.id == app_id))
    app = result.scalars().first()
    
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
        
    
    
    # Check for Acceptance (Interviewing) and Schedule Logic
    # Frontend sends "Interviewing" when clicking Accept
    if status_update.status == "Interviewing" and app.status != "Interviewing":
        from models import InterviewSlot
        from email_utils import send_interview_scheduled_email
        
        # Verify job ownership
        job_result = await session.execute(select(Job).where(Job.id == app.job_id))
        job = job_result.scalars().first()
        
        if job.hr_id != current_user.id:
             raise HTTPException(status_code=403, detail="You do not own this job application")

        # Find first available slot
        slot_stmt = (
            select(InterviewSlot)
            .where(InterviewSlot.hr_id == current_user.id)
            .where(InterviewSlot.status == "AVAILABLE")
            .order_by(InterviewSlot.start_time)
        )
        slot_result = await session.execute(slot_stmt)
        slot = slot_result.scalars().first()
        
        if not slot:
            raise HTTPException(
                status_code=400, 
                detail="No interview slots available. Please add slots in the Schedule tab first."
            )
            
        # Book the slot
        slot.status = "BOOKED"
        slot.candidate_id = app.student_id
        session.add(slot)
        
        # Get Student Info for Email
        student_result = await session.execute(select(User).where(User.id == app.student_id))
        student = student_result.scalars().first()
        
        # Send Email
        date_str = slot.start_time.strftime("%B %d, %Y") 
        time_str = slot.start_time.strftime("%I:%M %p")
        
        await send_interview_scheduled_email(
            student.email, 
            student.full_name, 
            date_str, 
            time_str, 
            slot.meet_link
        )

    # Check for Rejection Logic
    elif status_update.status == "Rejected" and app.status != "Rejected":
        from email_utils import send_rejection_email
        
        # Get Student and Job Info for Email
        student_result = await session.execute(select(User).where(User.id == app.student_id))
        student = student_result.scalars().first()
        
        # Fetch Job Title (if not already joined)
        job_result = await session.execute(select(Job).where(Job.id == app.job_id))
        job = job_result.scalars().first()
        
        await send_rejection_email(student.email, student.full_name, job.title)

        
    app.status = status_update.status
    session.add(app)
    await session.commit()
    return {"message": "Status updated successfully", "status": app.status}

@router.get("/{app_id}", response_model=ApplicationDetail)
async def get_application_detail(
    app_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    if current_user.role != UserRole.HR:
         raise HTTPException(status_code=403, detail="Only HR can view application details")
    
    # Join with Job to check ownership
    stmt = (
        select(Application, User, Job)
        .join(User, Application.student_id == User.id)
        .join(Job, Application.job_id == Job.id)
        .where(Application.id == app_id)
    )
    result = await session.execute(stmt)
    row = result.first()
    
    if not row:
        raise HTTPException(status_code=404, detail="Application not found")
        
    application, student, job = row
    
    # Security Check: Ensure HR owns this job
    if job.hr_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access Denied: You do not own this job posting.")
    
    # ✅ Mark as viewed when HR opens the application
    if not application.viewed:
        application.viewed = True
        session.add(application)
        await session.commit()
        await session.refresh(application)
    
    return {
        "id": application.id,
        "job_id": application.job_id,
        "student_id": application.student_id,
        "ats_score": application.ats_score,
        "ats_feedback": application.ats_feedback,
        "status": application.status,
        "viewed": application.viewed,
        "created_at": application.created_at,
        "candidate_name": student.full_name,
        "candidate_email": student.email,
        "resume_path": student.resume_path,
        "resume_text": application.resume_text,
        "candidate_info": application.candidate_info,
        "chat_history": application.chat_history,
        "ats_report": application.ats_report,
        "interview_step": application.interview_step
    }
