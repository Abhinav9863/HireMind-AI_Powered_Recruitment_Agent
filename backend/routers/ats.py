from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict
import os
import json
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from groq import Groq
from database import get_session
from models import User, ATSAnalysis
from auth import get_current_user
from utils import extract_text_from_pdf

router = APIRouter(
    prefix="/ats",
    tags=["ats"]
)

client = Groq(
    api_key=os.environ.get("GROQ_API_KEY"),
)

class ATSAnalysisResponse(BaseModel):
    score: int
    matched_keywords: List[str]
    missing_critical_keywords: List[str]
    missing_bonus_keywords: List[str] = []
    formatting_issues: List[str] = []
    feedback: str
    strengths: List[str]

class ATSHistoryItem(BaseModel):
    id: int
    job_title: str
    score: int
    created_at: datetime

def analyze_resume_with_llm(resume_text: str, job_title: str, job_description: str = "") -> dict:
    prompt = f"""
    You are an expert strict ATS (Applicant Tracking System) Analyzer.
    
    Task: Critically analyze the resume vs the job title/description.
    Target Role: "{job_title}"
    Context: {job_description if job_description else "Industry standards"}
    
    Resume Content:
    {resume_text[:4000]}
    
    Output strictly valid JSON:
    {{
        "score": <int 0-100. Be strict. >80 is exceptional, 60-80 is good, <60 needs work>,
        "matched_keywords": ["list", "of", "skills", "found"],
        "missing_critical_keywords": ["MUST HAVE skills missing from resume"],
        "missing_bonus_keywords": ["Good to have skills missing"],
        "formatting_issues": ["List of formatting/structure issues"],
        "feedback": "Detailed advice. Reference specific sections of the resume.",
        "strengths": ["List of strong points"]
    }}
    """
    
    try:
        completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a helpful assistant that outputs raw JSON data without markdown formatting."},
                {"role": "user", "content": prompt}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.3, # Lower temperature for analytical tasks
        )
        content = completion.choices[0].message.content
        
        # Clean cleanup
        content = content.replace("```json", "").replace("```", "").strip()
        
        start = content.find('{')
        end = content.rfind('}') + 1
        if start != -1 and end != -1:
            json_str = content[start:end]
            return json.loads(json_str)
            
        print(f"ATS Parse Error Raw: {content}")
        return {
            "score": 50, 
            "matched_keywords": [],
            "missing_critical_keywords": ["Parsing Error"], 
            "missing_bonus_keywords": [],
            "formatting_issues": [],
            "feedback": "Could not analyze resume. Please try again.",
            "strengths": []
        }
        
    except Exception as e:
        print(f"ATS LLM Error: {e}")
        return {
            "score": 0, 
            "matched_keywords": [],
            "missing_critical_keywords": ["Error"], 
            "missing_bonus_keywords": [],
            "formatting_issues": [],
            "feedback": f"System Error: {str(e)}",
            "strengths": []
        }

@router.post("/analyze", response_model=ATSAnalysisResponse)
async def analyze_resume(
    resume: UploadFile = File(...),
    job_title: str = Form(...),
    job_description: str = Form(""),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    content = await resume.read()
    resume_text = extract_text_from_pdf(content)
    
    if not resume_text or len(resume_text) < 50:
        raise HTTPException(status_code=400, detail="Could not extract text from PDF. Please upload a readable text PDF.")
        
    analysis_result = analyze_resume_with_llm(resume_text, job_title, job_description)
    
    # Save History
    db_analysis = ATSAnalysis(
        user_id=current_user.id,
        job_title=job_title,
        score=analysis_result.get("score", 0),
        analysis_data=analysis_result
    )
    session.add(db_analysis)
    await session.commit()
    
    return analysis_result

@router.get("/history", response_model=List[ATSHistoryItem])
async def get_ats_history(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    stmt = select(ATSAnalysis).where(ATSAnalysis.user_id == current_user.id).order_by(ATSAnalysis.created_at.desc())
    result = await session.execute(stmt)
    history = result.scalars().all()
    return history
