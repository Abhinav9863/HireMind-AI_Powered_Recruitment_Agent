from fastapi import APIRouter, HTTPException, Depends, status, File, UploadFile, Form
import shutil
import os
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from database import get_session
from models import Job, User, UserRole, Application
from schemas import JobCreate, JobRead, JobUpdate, TokenData, ApplicationReadWithStudent
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
    work_location: str = Form("In-Office"),  # Remote, Hybrid, In-Office
    experience_required: int = Form(0),  # ✅ FIX: Accept experience requirement from frontend
    use_profile_policy: bool = Form(False), # ✅ NEW: Flag to use existing profile policy
    policy_file: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user), 
    session: AsyncSession = Depends(get_session)
):
    if current_user.role != UserRole.HR:
        raise HTTPException(status_code=403, detail="Only HR can post jobs")
    
    policy_path = None
    
    # 1. Check if using profile policy
    if use_profile_policy:
        if current_user.company_policy_path and os.path.exists(current_user.company_policy_path):
             policy_path = current_user.company_policy_path
        else:
             # Fallback or strict error? Let's just ignore if not found for robust UX, or could raise 400.
             # Ideally frontend controls this, but backend should be safe.
             print(f"WARN: use_profile_policy is True but no policy found at {current_user.company_policy_path}")

    # 2. Check if specific file uploaded (overrides profile policy if both present, or used if flag is False)
    if policy_file:
        # ✅ SECURITY FIX: Validate file size (10MB max)
        MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
        content = await policy_file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB")
        
        # ✅ SECURITY FIX: Validate file type
        allowed_extensions = {'.pdf'}
        filename = policy_file.filename.lower()
        if not any(filename.endswith(ext) for ext in allowed_extensions):
            raise HTTPException(status_code=400, detail="Only PDF files are allowed for policy documents")
        
        # ✅ SECURITY FIX: Use basename to prevent path traversal
        safe_filename = os.path.basename(policy_file.filename)
        safe_filename = "".join([c for c in safe_filename if c.isalnum() or c in "._-"]).strip()
        
        if not safe_filename:
             safe_filename = "policy_doc.pdf"
        
        # Add timestamp to prevent file overwrites
        import time
        timestamp = int(time.time())
        safe_filename = f"policy_{current_user.id}_{timestamp}_{safe_filename}"
        
        file_location = f"uploads/{safe_filename}"
        with open(file_location, "wb") as file_object:
            file_object.write(content)
        policy_path = file_location

    new_job = Job(
        title=title,
        company=current_user.university_or_company or "Unknown Company",
        description=description,
        location=location,
        salary_range=salary_range,
        job_type=job_type,
        work_location=work_location,  # ✅ NEW: Include work location
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
    
    # For each job, count unviewed and total applications
    jobs_with_counts = []
    for job in jobs:
        app_result = await session.execute(
            select(Application).where(Application.job_id == job.id)
        )
        applications = app_result.scalars().all()
        
        unviewed_count = sum(1 for app in applications if not app.viewed)
        total_count = len(applications)
        
        job_dict = job.dict()
        job_dict['unviewed_count'] = unviewed_count
        job_dict['total_applications'] = total_count
        jobs_with_counts.append(job_dict)
    
    return jobs_with_counts

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
        app_dict["candidate_name"] = student.full_name
        app_dict["candidate_email"] = student.email
        final_results.append(app_dict)
        
    return final_results

@router.put("/{job_id}", response_model=JobRead)
async def update_job(
    job_id: int,
    job_update: JobUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    if current_user.role != UserRole.HR:
        raise HTTPException(status_code=403, detail="Only HR can update jobs")
        
    result = await session.execute(select(Job).where(Job.id == job_id))
    job = result.scalars().first()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    if job.hr_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only update your own jobs")
    
    job_data = job_update.dict(exclude_unset=True)
    for key, value in job_data.items():
        setattr(job, key, value)
        
    session.add(job)
    await session.commit()
    await session.refresh(job)
    
    # Populate counts for response to match JobRead schema
    # (Though pure update usually just returns the object, keeping it consistent)
    return job

@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_job(
    job_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    if current_user.role != UserRole.HR:
        raise HTTPException(status_code=403, detail="Only HR can delete jobs")
        
    result = await session.execute(select(Job).where(Job.id == job_id))
    job = result.scalars().first()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    if job.hr_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own jobs")
        
    # Optional: Delete related applications or cascade? 
    # SQLAlchemy relationship cascade usually handles this, but let's be safe.
    # For now, we assume simple deletion is enough.
    
    await session.delete(job)
    await session.commit()
    return None

