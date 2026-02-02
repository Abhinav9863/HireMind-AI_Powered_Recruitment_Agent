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
    """
    Analyze resume using LLM for ATS scoring.
    Returns a dict with score, feedback, keywords, etc.
    """
    prompt = f"""
You are an expert strict ATS (Applicant Tracking System) Analyzer with ZERO TOLERANCE for non-resume documents.

🚨 MANDATORY FIRST STEP - DOCUMENT VALIDATION:
Before analyzing, you MUST verify this is a resume/CV by checking for ALL of these:
1. Has a "Work Experience" or "Employment History" section
2. Has an "Education" section with degree/institution
3. Has a "Skills" section listing technical or professional abilities
4. Does NOT contain words like: ticket, booking, PNR, fare, invoice, receipt, passenger, reservation, train, flight, payment confirmation
5. Contains career-related terms: projects, responsibilities, achievements, certifications

IF ANY OF THESE CHECKS FAIL → IMMEDIATELY RETURN score = 0 with feedback explaining it's not a resume.

Target Role: "{job_title}"
Job Description: {job_description if job_description else "Industry standards for this role"}

Document Content:
{resume_text[:4000]}

VALIDATION PROCESS:
Step 1: Check if document contains at least 2 of these resume sections: [Experience, Education, Skills, Projects, Summary, Objective]
Step 2: Check if document contains any of these NON-RESUME indicators: [ticket, booking, PNR, fare, invoice, receipt, passenger, train, flight, reservation, confirmation number, total amount, tax invoice]
Step 3: If Step 2 found ANY non-resume indicators OR Step 1 found LESS than 2 sections → score = 0

STRICT SCORING GUIDELINES (only if document passed validation):
- 90-100: Perfect match with ALL key skills, exceptional candidate
- 75-89: Strong match with most key skills, highly qualified
- 60-74: Good match, qualified but missing some important skills
- 40-59: Moderate match, missing several key skills
- 20-39: Weak match, significant skill gaps
- 0-19: Poor match or not enough relevant experience
- 0: NOT A RESUME or completely irrelevant to the role

Output ONLY valid JSON (no markdown):
{{
    "score": <int 0-100>,
    "matched_keywords": ["keyword1", "keyword2"],
    "missing_critical_keywords": ["must-have skill 1", "must-have skill 2"],
    "missing_bonus_keywords": ["nice-to-have skill 1"],
    "formatting_issues": ["issue 1", "issue 2"],
    "feedback": "If score=0 explain why this is not a resume. Otherwise, provide detailed constructive feedback about the resume quality and job match",
    "strengths": ["strength 1", "strength 2"]
}}
"""
    
    try:
        print(f"🤖 Calling LLM for ATS analysis...")
        completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a helpful assistant that outputs raw JSON data without markdown formatting."},
                {"role": "user", "content": prompt}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.3,  # Lower temperature for analytical tasks
        )
        content = completion.choices[0].message.content
        print(f"✅ LLM Response received (length: {len(content)})")
        
        # Clean cleanup - remove markdown code blocks if present
        content = content.replace("```json", "").replace("```", "").strip()
        
        # Extract JSON from response
        start = content.find('{')
        end = content.rfind('}') + 1
        if start != -1 and end != -1:
            json_str = content[start:end]
            result = json.loads(json_str)
            print(f"✅ JSON parsed successfully. Score: {result.get('score', 'N/A')}")
            
            # 🛡️ SAFETY CHECK: Double-validate that non-resume documents get score = 0
            # This is a fail-safe in case the LLM ignores our instructions
            resume_text_lower = resume_text.lower()
            
            # Check for non-resume indicators
            non_resume_indicators = [
                'ticket', 'booking', 'pnr', 'fare', 'invoice', 'receipt', 
                'passenger', 'train', 'flight', 'reservation', 
                'confirmation number', 'total amount', 'tax invoice',
                'payment confirmation', 'transaction id'
            ]
            
            # Check for resume indicators
            resume_indicators = [
                'experience', 'education', 'skills', 'work history',
                'employment', 'university', 'college', 'degree',
                'project', 'certification', 'professional'
            ]
            
            non_resume_count = sum(1 for indicator in non_resume_indicators if indicator in resume_text_lower)
            resume_count = sum(1 for indicator in resume_indicators if indicator in resume_text_lower)
            
            # If document has 2+ non-resume indicators and fewer than 3 resume indicators
            # Force score to 0 regardless of what LLM said
            if non_resume_count >= 2 and resume_count < 3:
                print(f"🛡️ SAFETY OVERRIDE: Document appears to be non-resume (non-resume indicators: {non_resume_count}, resume indicators: {resume_count})")
                result['score'] = 0
                result['feedback'] = "This document appears to be a ticket, receipt, invoice, or other non-resume document. Please upload a proper CV/Resume with your work experience, education, and skills."
                result['missing_critical_keywords'] = ["This is not a resume"]
                result['matched_keywords'] = []
                result['strengths'] = []
            
            return result
            
        print(f"⚠️ ATS Parse Error - Could not find JSON in response")
        print(f"Raw LLM Output: {content[:300]}...")
        return {
            "score": 50, 
            "matched_keywords": [],
            "missing_critical_keywords": ["JSON Parsing Error"], 
            "missing_bonus_keywords": [],
            "formatting_issues": [],
            "feedback": "Could not analyze resume properly. Please try again.",
            "strengths": []
        }
        
    except json.JSONDecodeError as e:
        print(f"❌ JSON Decode Error: {e}")
        print(f"Attempted to parse: {content[:500] if 'content' in locals() else 'N/A'}...")
        return {
            "score": 0, 
            "matched_keywords": [],
            "missing_critical_keywords": ["JSON Error"], 
            "missing_bonus_keywords": [],
            "formatting_issues": [],
            "feedback": f"Analysis failed due to formatting error: {str(e)}",
            "strengths": []
        }
    except Exception as e:
        print(f"❌ ATS LLM Error: {type(e).__name__}: {e}")
        return {
            "score": 0, 
            "matched_keywords": [],
            "missing_critical_keywords": ["System Error"], 
            "missing_bonus_keywords": [],
            "formatting_issues": [],
            "feedback": f"System error during analysis: {str(e)}",
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
