from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import shutil
import os

from database import get_session
from models import User
from auth import get_current_user, verify_password, get_password_hash
from schemas import UserRead, UserUpdate, ChangePasswordRequest

router = APIRouter(
    prefix="/users",
    tags=["users"]
)

@router.get("/me", response_model=UserRead)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/profile", response_model=UserRead)
async def update_user_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name
    if user_update.university_or_company is not None:
        current_user.university_or_company = user_update.university_or_company
    if user_update.bio is not None:
        current_user.bio = user_update.bio
    if user_update.phone_number is not None:
        current_user.phone_number = user_update.phone_number
        
    session.add(current_user)
    await session.commit()
    await session.refresh(current_user)
    return current_user

@router.post("/upload/photo", response_model=UserRead)
async def upload_profile_picture(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    # ✅ SECURITY FIX: Validate file size (5MB max for images)
    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Image too large. Maximum size is 5MB")
    
    # ✅ SECURITY FIX: Validate image type
    allowed_extensions = {'.jpg', '.jpeg', '.png', '.gif'}
    filename = file.filename.lower()
    if not any(filename.endswith(ext) for ext in allowed_extensions):
        raise HTTPException(status_code=400, detail="Only image files (jpg, png, gif) are allowed")
    
    # ✅ SECURITY FIX: Use basename to prevent path traversal
    import time
    safe_filename = os.path.basename(file.filename)
    safe_filename = "".join([c for c in safe_filename if c.isalnum() or c in "._-"]).strip()
    
    # Ensure directory exists
    os.makedirs("uploads", exist_ok=True)
    
    # Add timestamp to prevent overwrites
    timestamp = int(time.time())
    file_location = f"uploads/pfp_{current_user.id}_{timestamp}_{safe_filename}"
    
    with open(file_location, "wb") as file_object:
        file_object.write(content)
        
    current_user.profile_picture = file_location
    session.add(current_user)
    await session.commit()
    await session.refresh(current_user)
    return current_user

@router.post("/upload/resume", response_model=UserRead)
async def upload_default_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    # ✅ SECURITY FIX: Validate file size (10MB max for resumes)
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Resume too large. Maximum size is 10MB")
    
    # ✅ SECURITY FIX: Validate PDF type
    allowed_extensions = {'.pdf'}
    filename = file.filename.lower()
    if not any(filename.endswith(ext) for ext in allowed_extensions):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed for resumes")
    
    # ✅ SECURITY FIX: Use basename to prevent path traversal
    import time
    safe_filename = os.path.basename(file.filename)
    safe_filename = "".join([c for c in safe_filename if c.isalnum() or c in "._-"]).strip()
    
    # Ensure directory exists
    os.makedirs("uploads", exist_ok=True)
    
    # Add timestamp to prevent overwrites
    timestamp = int(time.time())
    file_location = f"uploads/resume_{current_user.id}_{timestamp}_{safe_filename}"
    
    with open(file_location, "wb") as file_object:
        file_object.write(content)
        
    current_user.resume_path = file_location
    session.add(current_user)
    await session.commit()
    await session.refresh(current_user)
    return current_user

@router.post("/upload/policy", response_model=UserRead)
async def upload_company_policy(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    # Limit file size to 10MB
    MAX_FILE_SIZE = 10 * 1024 * 1024
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Policy file too large. Maximum size is 10MB")
    
    # Validate PDF
    filename = file.filename.lower()
    if not filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed for company policies")
    
    import time
    safe_filename = os.path.basename(file.filename)
    safe_filename = "".join([c for c in safe_filename if c.isalnum() or c in "._-"]).strip()
    
    os.makedirs("uploads", exist_ok=True)
    
    timestamp = int(time.time())
    file_location = f"uploads/policy_{current_user.id}_{timestamp}_{safe_filename}"
    
    with open(file_location, "wb") as file_object:
        file_object.write(content)
        
    current_user.company_policy_path = file_location
    session.add(current_user)
    await session.commit()
    await session.refresh(current_user)
    return current_user

@router.post("/change-password")
async def change_password(
    password_data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    print(f"🔐 Attempting password change for user: {current_user.email}")
    # Verify old password
    if not verify_password(password_data.old_password, current_user.hashed_password):
        print(f"❌ Password change failed: Incorrect old password for {current_user.email}")
        raise HTTPException(status_code=400, detail="Incorrect current password")
    
    # Check new password complexity (reusing logic from signup would be best, but for now simple check)
    if len(password_data.new_password) < 8:
         print(f"❌ Password change failed: New password too short for {current_user.email}")
         raise HTTPException(status_code=400, detail="New password must be at least 8 characters long")
    
    # Update password
    current_user.hashed_password = get_password_hash(password_data.new_password)
    session.add(current_user)
    await session.commit()
    
    print(f"✅ Password changed successfully for {current_user.email}")
    return {"message": "Password updated successfully"}

@router.delete("/me")
async def delete_account(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    print(f"⚠️ Attempting DELETE ACCOUNT for user: {current_user.email} (ID: {current_user.id})")
    from sqlalchemy import delete, select
    from models import Job, Application, ATSAnalysis, InterviewSlot  # Import models here to avoid circular imports
    
    try:
        # 1. Delete ATS Analysis History
        await session.execute(delete(ATSAnalysis).where(ATSAnalysis.user_id == current_user.id))

        if current_user.role == "hr":
            # 2. HR Specific Cleanup
            
            # a. Delete Interview Slots created by HR
            await session.execute(delete(InterviewSlot).where(InterviewSlot.hr_id == current_user.id))
            
            # b. Delete Jobs created by HR (and their applications)
            # First find all jobs by this HR
            result = await session.execute(select(Job).where(Job.hr_id == current_user.id))
            hr_jobs = result.scalars().all()
            hr_job_ids = [job.id for job in hr_jobs]
            
            if hr_job_ids:
                # Delete applications for these jobs
                await session.execute(delete(Application).where(Application.job_id.in_(hr_job_ids)))
                # Delete the jobs
                await session.execute(delete(Job).where(Job.id.in_(hr_job_ids)))
                
        else:
            # 3. Candidate Specific Cleanup
            
            # a. Delete Applications made by Candidate
            await session.execute(delete(Application).where(Application.student_id == current_user.id))
            
            # b. Unbook Interview Slots (Set candidate_id to None and status to AVAILABLE)
            # Find slots where this candidate is booked
            result = await session.execute(select(InterviewSlot).where(InterviewSlot.candidate_id == current_user.id))
            booked_slots = result.scalars().all()
            for slot in booked_slots:
                slot.candidate_id = None
                slot.status = "AVAILABLE"
                session.add(slot)
                
        # 4. Finally Delete the User
        await session.delete(current_user)
        await session.commit()
        
        print(f"✅ Account deleted successfully: {current_user.email}")
        return {"message": "Account deleted successfully"}
        
    except Exception as e:
        print(f"❌ DELETE ACCOUNT FAILED for {current_user.email}: {str(e)}")
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete account: {str(e)}")
