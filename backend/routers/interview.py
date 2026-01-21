from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import Optional, List
import os
from pypdf import PdfReader
import io
import json
from groq import Groq

from database import get_session
from models import Application, Job, User, UserRole
from auth import get_current_user
from routers.ats import analyze_resume_with_llm

router = APIRouter(
    prefix="/interview",
    tags=["interview"]
)

# Initialize Groq Client
client = Groq(
    api_key=os.environ.get("GROQ_API_KEY"),
)

class ChatRequest(BaseModel):
    application_id: int
    message: str

class ChatResponse(BaseModel):
    reply: str
    is_completed: bool = False
    application_id: Optional[int] = None

from utils import extract_text_from_pdf

def generate_technical_questions(resume_text: str, job_title: str) -> List[str]:
    prompt = f"""
    You are an expert technical interviewer for the role of {job_title}.
    Analyze the candidate's resume deepy to extract specific projects and technical contributions.
    
    Generate exactly 3 HIGHLY SPECIFIC technical questions.
    
    CRITICAL RULES:
    1. Questions MUST be about specific projects mentioned in the resume.
    2. Format examples:
       - "How did you implement [Specific Feature] in your [Project Name]?"
       - "What was the most complex database challenge you faced in [Project Name], and how did you solve it?"
       - "Can you explain the architecture choices behind [Project Name]?"
    3. Do NOT ask generic questions like "Tell me about yourself" or "What are your strengths".
    4. Focus on the "HOW" and "WHY" of their implementation details.
    
    Resume Content:
    {resume_text[:3000]}
    
    Return ONLY a JSON array of strings. Example: ["Question 1", "Question 2", "Question 3"]
    """
    
    try:
        completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a helpful assistant that outputs raw JSON data without markdown formatting."},
                {"role": "user", "content": prompt}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.5,
        )
        content = completion.choices[0].message.content
        print(f"DEBUG: Raw LLM Response: {content}") # Debug log

        # 1. Try direct JSON parse
        try:
            questions = json.loads(content)
            return questions[:3]
        except:
            pass
            
        # 2. Try scrubbing markdown code blocks
        clean_content = content.replace("```json", "").replace("```", "").strip()
        try:
            questions = json.loads(clean_content)
            return questions[:3]
        except:
            pass

        # 3. Try finding array brackets
        start_idx = content.find('[')
        end_idx = content.rfind(']') + 1
        if start_idx != -1 and end_idx != -1:
            json_str = content[start_idx:end_idx]
            questions = json.loads(json_str)
            return questions[:3]
            
        print("ERROR: Could not parse JSON from LLM response")
        return [
            "Could you explain the system architecture of your most recent project?",
            "What specific challenges did you face with database optimization?", 
            "How do you handle API security in your applications?"
        ]
    except Exception as e:
        print(f"LLM Generation Error: {e}")
        return [
            "Describe the most complex feature you implemented in your last project.",
            "How did you ensure scalability in your backend architecture?",
            "What is your approach to debugging complex asynchronous issues?"
        ]

@router.post("/start", response_model=ChatResponse)
async def start_interview(
    job_id: int = Form(...),
    resume: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Only students can apply")

    # 1. Read PDF
    content = await resume.read()
    resume_text = extract_text_from_pdf(content)
    
    # 2. Get Job Details (for context)
    result = await session.execute(select(Job).where(Job.id == job_id))
    job = result.scalars().first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # 3. Check for existing application
    stmt = select(Application).where(
        Application.student_id == current_user.id,
        Application.job_id == job_id
    )
    result = await session.execute(stmt)
    existing_app = result.scalars().first()
    
    if existing_app:
        # Reset if exists for demo purposes, or return existing state
        await session.delete(existing_app)
        await session.commit()

    # 4. Generate Questions
    questions = generate_technical_questions(resume_text, job.title)
    
    # 5. Run ATS Analysis (Real)
    print(f"Running ATS Analysis for {current_user.email} on job {job.title}...")
    ats_result = analyze_resume_with_llm(resume_text, job.title, job.description)
    print(f"ATS Score: {ats_result.get('score')}")

    # 6. Create Application Record
    # Save file temporarily (optional, using resume_path as placeholder)
    file_location = f"uploads/{current_user.id}_{job_id}_{resume.filename}"
    with open(file_location, "wb") as f:
        f.write(content)

    new_app = Application(
        job_id=job_id,
        student_id=current_user.id,
        resume_path=file_location,
        resume_text=resume_text,
        generated_questions=questions,
        interview_step="name", # First step
        status="Interviewing",
        candidate_info={},
        chat_history=[],
        ats_score=ats_result.get("score", 0),
        ats_feedback=ats_result.get("feedback", "Pending analysis."),
        ats_report=ats_result
    )
    
    session.add(new_app)
    await session.commit()
    await session.refresh(new_app)

    return ChatResponse(
        reply="Hello! I've received your resume. To start the interview, may I please have your full name?",
        application_id=new_app.id
    )

@router.post("/chat", response_model=ChatResponse)
async def chat_interview(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    # Fetch Application
    result = await session.execute(select(Application).where(Application.id == request.application_id))
    app = result.scalars().first()
    
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
        
    if app.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    user_msg = request.message.strip()
    
    # Update History
    current_history = list(app.chat_history) if app.chat_history else []
    current_history.append({"role": "user", "content": user_msg})
    
    # State Machine
    reply = ""
    next_step = app.interview_step
    
    # Check current step and process ANSWER
    if app.interview_step == "name":
        # Save Name
        info = dict(app.candidate_info) if app.candidate_info else {}
        info["name"] = user_msg
        app.candidate_info = info
        
        reply = f"Nice to meet you, {user_msg}. Which college did you attend?"
        next_step = "college"
        
    elif app.interview_step == "college":
        info = dict(app.candidate_info)
        info["college"] = user_msg
        app.candidate_info = info
        
        reply = "Great. Where did you work previously? (If you are a fresher, please type 'none' or 'fresher')"
        next_step = "experience_check"
        
    elif app.interview_step == "experience_check":
        info = dict(app.candidate_info)
        is_fresher = user_msg.lower() in ["none", "fresher", "no", "na"]
        info["is_fresher"] = is_fresher
        
        if is_fresher:
            reply = "Understood. What is your CGPA?"
            next_step = "cgpa"
        else:
            info["previous_institution"] = user_msg
            reply = "Could you tell me a bit about your role there?"
            next_step = "role_details"
        app.candidate_info = info
            
    elif app.interview_step in ["cgpa", "role_details"]:
        info = dict(app.candidate_info)
        if app.interview_step == "cgpa":
            info["cgpa"] = user_msg
        else:
            info["role_details"] = user_msg
        app.candidate_info = info
        
        reply = "Thanks. What are your Top 3 technical skills?"
        next_step = "skills"
        
    elif app.interview_step == "skills":
        info = dict(app.candidate_info)
        info["skills"] = user_msg
        app.candidate_info = info
        
        # Start Technical Questions
        first_q = app.generated_questions[0] if app.generated_questions else "Tell me about yourself."
        reply = f"Thank you. Now let's move to some technical questions based on your resume. \n\n1. {first_q}"
        app.current_question_index = 0
        next_step = "technical_1"

    elif app.interview_step == "technical_1":
        # Save Answer 1
        current_history.append({"role": "assistant_q1", "question": app.generated_questions[0], "answer": user_msg})
        
        # Ask Q2
        second_q = app.generated_questions[1] if len(app.generated_questions) > 1 else "What are your strengths?"
        reply = f"2. {second_q}"
        app.current_question_index = 1
        next_step = "technical_2"
        
    elif app.interview_step == "technical_2":
        # Save Answer 2
        current_history.append({"role": "assistant_q2", "question": app.generated_questions[1], "answer": user_msg})

        # Ask Q3
        third_q = app.generated_questions[2] if len(app.generated_questions) > 2 else "Any questions for us?"
        reply = f"3. {third_q}"
        app.current_question_index = 2
        next_step = "technical_3"
        
    elif app.interview_step == "technical_3":
        # Save Answer 3
        current_history.append({"role": "assistant_q3", "question": app.generated_questions[2], "answer": user_msg})
        
        reply = "Thank you for completing the interview! We will review your answers and get back to you shortly."
        # Interview Completed
        app.status = "Interviewed"
        
        # Real ATS score is already saved at start_interview. 
        # We can optionally re-evaluate here if we wanted to score the *interview* answers, 
        # but for now, we keep the resume score.
        
    elif app.interview_step == "completed":
        reply = "The interview is already completed."
        next_step = "completed"

    # Update App State
    current_history.append({"role": "assistant", "content": reply})
    app.chat_history = current_history
    app.interview_step = next_step
    
    session.add(app)
    await session.commit()
    await session.refresh(app)
    
    return ChatResponse(
        reply=reply,
        is_completed=(next_step == "completed"),
        application_id=app.id
    )
