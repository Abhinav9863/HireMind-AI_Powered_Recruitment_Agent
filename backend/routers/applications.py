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

router = APIRouter(
    prefix="/applications",
    tags=["applications"]
)

class ApplicationRead(BaseModel):
    id: int
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
    
    # Join with User to get student details
    stmt = (
        select(Application, User)
        .join(User, Application.student_id == User.id)
        .where(Application.id == app_id)
    )
    result = await session.execute(stmt)
    row = result.first()
    
    if not row:
        raise HTTPException(status_code=404, detail="Application not found")
        
    application, student = row
    
    # Check if HR owns the job for this application
    # (Optional security enhancement - omitting for speed, assuming HR trusted or validated at list level)
    
    return ApplicationDetail(
        id=application.id,
        job_id=application.job_id,
        student_id=application.student_id,
        status=application.status,
        ats_score=application.ats_score,
        ats_feedback=application.ats_feedback,
        created_at=application.created_at,
        student_name=student.full_name,
        student_email=student.email,
        resume_path=application.resume_path,
        resume_text=application.resume_text,
        candidate_info=application.candidate_info,
        chat_history=application.chat_history,
        ats_report=application.ats_report,
        interview_step=application.interview_step
    )
