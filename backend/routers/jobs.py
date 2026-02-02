from fastapi import APIRouter, HTTPException, Depends, status, File, UploadFile, Form
import shutil
import os
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from database import get_session
from models import Job, User, UserRole, Application
from schemas import JobCreate, JobRead, TokenData, ApplicationReadWithStudent
from auth import oauth2_scheme, get_current_user

router = APIRouter(
    prefix="/jobs",
    tags=["jobs"]
)

@router.post("/", response_model=JobRead)
async def create_job(
    title: str = Form(...),
    description: str = Form(...),
    location: str = Form(...),
    salary_range: str = Form(...),
    job_type: str = Form(...),
    experience_required: int = Form(0),  # ✅ FIX: Accept experience requirement from frontend
    policy_file: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user), 
    session: AsyncSession = Depends(get_session)
):
    if current_user.role != UserRole.HR:
        raise HTTPException(status_code=403, detail="Only HR can post jobs")
    
    policy_path = None
    if policy_file:
        # Sanitize filename
        safe_filename = "".join([c for c in policy_file.filename if c.isalnum() or c in "._-"]).strip()
        if not safe_filename:
             safe_filename = "policy_doc.pdf"
        file_location = f"uploads/{safe_filename}"
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(policy_file.file, file_object)
        policy_path = file_location

    new_job = Job(
        title=title,
        company=current_user.university_or_company or "Unknown Company",
        description=description,
        location=location,
        salary_range=salary_range,
        job_type=job_type,
        experience_required=experience_required,  # ✅ FIX: Include experience in Job creation
        policy_path=policy_path,
        hr_id=current_user.id
    )
    
    session.add(new_job)
    await session.commit()
    await session.refresh(new_job)
    return new_job

@router.get("/", response_model=List[JobRead])
async def get_jobs(session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Job).order_by(Job.created_at.desc()))
    jobs = result.scalars().all()
    return jobs

@router.get("/my", response_model=List[JobRead])
async def get_my_jobs(current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    if current_user.role != UserRole.HR:
        raise HTTPException(status_code=403, detail="Only HR can access this")
        
    result = await session.execute(select(Job).where(Job.hr_id == current_user.id).order_by(Job.created_at.desc()))
    jobs = result.scalars().all()
    return jobs

@router.get("/{job_id}/applications", response_model=List[ApplicationReadWithStudent])
async def get_job_applications(job_id: int, current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    if current_user.role != UserRole.HR:
        raise HTTPException(status_code=403, detail="Only HR can access this")
    
    # Verify the job belongs to this HR
    result = await session.execute(select(Job).where(Job.id == job_id))
    job = result.scalars().first()
    
    if not job:
          raise HTTPException(status_code=404, detail="Job not found")
          
    if job.hr_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only view applications for your own jobs")
        
    # Fetch applications with student details
    stmt = (
        select(Application, User)
        .join(User, Application.student_id == User.id)
        .where(Application.job_id == job_id)
    )
    results = await session.execute(stmt)
    
    final_results = []
    for application, student in results:
        app_dict = application.dict()
        app_dict["student_name"] = student.full_name
        app_dict["student_email"] = student.email
        final_results.append(app_dict)
        
    return final_results
