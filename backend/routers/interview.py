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
    ats_score: Optional[int] = None  # Add ATS score to response

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

import traceback

@router.post("/start", response_model=ChatResponse)
async def start_interview(
    job_id: int = Form(...),
    experience_years: int = Form(0),  # Candidate's years of experience
    resume: Optional[UploadFile] = File(None),
    use_profile_resume: bool = Form(False),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    try:
        if current_user.role != UserRole.STUDENT:
            raise HTTPException(status_code=403, detail="Only students can apply")

        # 1. Read PDF
        resume_text = ""
        file_location = ""
        
        if resume:
            # Case A: Uploading new resume
            # ✅ SECURITY FIX: Validate file size (10MB max)
            MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
            content = await resume.read()
            if len(content) > MAX_FILE_SIZE:
                raise HTTPException(status_code=400, detail="Resume too large. Maximum size is 10MB")
            
            resume_text = extract_text_from_pdf(content)
            
            # ✅ SECURITY FIX: Validate file type
            allowed_extensions = {'.pdf'}
            filename = resume.filename.lower()
            if not any(filename.endswith(ext) for ext in allowed_extensions):
                raise HTTPException(status_code=400, detail="Only PDF files are allowed for resumes")
            
            # ✅ SECURITY FIX: Use basename to prevent path traversal
            import time
            safe_filename = os.path.basename(resume.filename)
            safe_filename = "".join([c for c in safe_filename if c.isalnum() or c in "._-"]).strip()
            
            if not safe_filename:
                safe_filename = "resume.pdf"
            
            # Add timestamp to prevent overwrites
            timestamp = int(time.time())
            safe_filename = f"resume_{current_user.id}_{job_id}_{timestamp}_{safe_filename}"
            
            file_location = f"uploads/{safe_filename}"
            with open(file_location, "wb") as f:
                f.write(content)
                
        elif use_profile_resume and current_user.resume_path:
            # Case B: Using Profile Resume
            print(f"DEBUG: Checking profile resume path: {current_user.resume_path}")
            if not os.path.exists(current_user.resume_path):
                 print(f"DEBUG: File not found at {current_user.resume_path} (CWD: {os.getcwd()})")
                 raise HTTPException(status_code=404, detail=f"Profile resume file not found on server at {current_user.resume_path}")
                 
            # Read from existing file
            with open(current_user.resume_path, "rb") as f:
                content = f.read()
            resume_text = extract_text_from_pdf(content)
            file_location = current_user.resume_path
            
        else:
            raise HTTPException(status_code=400, detail="Please upload a resume or use your profile resume.")

        # Validate resume text was extracted
        if not resume_text or len(resume_text) < 50:
            raise HTTPException(
                status_code=400,
                detail="Could not extract text from PDF. Please ensure the PDF is readable and not scanned/image-based."
            )
        
        # 📝 Log resume details for debugging
        print(f"\n{'='*60}")
        print(f"📄 Resume Upload - Job #{job_id}")
        print(f"📏 Text Length: {len(resume_text)} characters")
        print(f"📝 Preview: {resume_text[:200]}...")
        print(f"{'='*60}\n")
        
        # ✅ Validate it's actually a resume (not a ticket/receipt/invoice)
        from utils import validate_document_is_resume
        is_valid, validation_error = validate_document_is_resume(resume_text)
        
        if not is_valid:
            print(f"❌ Document Validation Failed: {validation_error}")
            raise HTTPException(
                status_code=400,
                detail=validation_error
            )
        
        print(f"✅ Document validated as resume")
        
        # 2. Get Job Details (for context)
        result = await session.execute(select(Job).where(Job.id == job_id))
        job = result.scalars().first()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        # 🎓 EXPERIENCE REQUIREMENT CHECK
        if job.experience_required > 0:
            from utils import extract_years_of_experience
            candidate_experience = extract_years_of_experience(resume_text)
            
            print(f"📊 Experience Check - Required: {job.experience_required} years, Candidate: {candidate_experience} years")
            
            if candidate_experience < job.experience_required:
                rejection_message = (
                    f"❌ Sorry, this position requires {job.experience_required} year(s) of experience. "
                    f"Your resume shows {candidate_experience} year(s) of experience. "
                    f"Please apply to positions matching your experience level."
                )
                print(f"❌ Application rejected: Insufficient experience")
                raise HTTPException(status_code=400, detail=rejection_message)
            
            print(f"✅ Experience requirement met!")

        # 3. Analyze Resume (ATS) & Generate Questions
        print(f"🔍 Starting ATS analysis for: {job.title}")
        print(f"🏢 Company: {job.company}")

        # Pass both job title and description for accurate ATS analysis
        ats_result = analyze_resume_with_llm(resume_text, job.title, job.description)
        
        ats_score = ats_result.get("score", 0)
        print(f"📊 ATS Score: {ats_score}%")
        print(f"💡 Feedback: {ats_result.get('feedback', 'N/A')[:150]}...")
        
        questions = generate_technical_questions(resume_text, job.title)

        new_app = Application(
            job_id=job_id,
            student_id=current_user.id,
            resume_path=file_location,
            resume_text=resume_text,
            generated_questions=questions,
            interview_step="name", # First step
            status="Applied",
            candidate_info={},
            chat_history=[],
            ats_score=ats_result.get("score", 0),
            ats_feedback=ats_result.get("feedback", "Pending analysis."),
            ats_report=ats_result,
            experience_years=experience_years  # Store candidate's experience
        )
        
        session.add(new_app)
        await session.commit()
        await session.refresh(new_app)

        return ChatResponse(
            reply="Hello! I've received your resume. To start the interview, may I please have your full name?",
            application_id=new_app.id,
            ats_score=new_app.ats_score  # Include ATS score in response
        )
    
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"❌ CRITICAL ERROR in start_interview: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"Processing Error: {str(e)}")

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
    
    # Auto-update status to "Interviewing" if it's currently "Applied"
    if app.status == "Applied":
        app.status = "Interviewing"
    
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
        
        reply = "Thank you for answering the technical questions. Do you have any questions related to the company or our policies? (Type 'no' or 'done' to finish)"
        next_step = "company_qna"
        
    elif app.interview_step == "company_qna":
        # Check if user wants to finish
        if user_msg.lower().strip() in ["no", "no questions", "done", "finish", "none", "na"]:
             reply = "Thank you for completing the interview! We will review your answers and get back to you shortly."
             app.status = "Review"
             next_step = "completed"
        else:
             # Answer question using Policy RAG
             try:
                 # Fetch Job to get policy path
                 job_result = await session.execute(select(Job).where(Job.id == app.job_id))
                 job = job_result.scalars().first()
                 
                 policy_path = job.policy_path if job and job.policy_path else "uploads/SayOne_Technologies_Company_Details_and_Policies.pdf"
                 
                 if policy_path and os.path.exists(policy_path):
                     with open(policy_path, "rb") as f:
                         policy_content = f.read()
                     policy_text = extract_text_from_pdf(policy_content)
                 else:
                     policy_text = "Policy document not available."

                 # RAG Prompt
                 prompt = f"""
                 You are a helpful HR assistant for {job.company if job else "the company"}.
                 Answer the candidate's question based ONLY on the provided company policy text below.
                 If the answer is not in the text, say "I don't have that information handy, but I can have HR follow up with you."
                 
                 Company Policy:
                 {policy_text[:10000]}
                 
                 Candidate Question: {user_msg}
                 
                 Answer concisely and professionally.
                 """
                 
                 completion = client.chat.completions.create(
                    messages=[
                        {"role": "system", "content": "You are a helpful HR assistant."},
                        {"role": "user", "content": prompt}
                    ],
                    model="llama-3.3-70b-versatile",
                    temperature=0.3,
                 )
                 answer = completion.choices[0].message.content
                 reply = f"{answer}\n\nDo you have any other questions? (Type 'no' to finish)"
                 next_step = "company_qna" # Loop
                 
             except Exception as e:
                 print(f"RAG Error: {e}")
                 reply = "I'm having trouble accessing the company policies right now. Do you have any other questions?"
                 next_step = "company_qna"

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

class InterviewSummaryResponse(BaseModel):
    strengths: List[str]
    weaknesses: List[str]
    project_understanding_score: int # 0-100
    hiring_recommendation: str # "Strong Hire", "Hire", "Leaning No", "Reject"
    summary_text: str

@router.post("/summarize/{application_id}", response_model=InterviewSummaryResponse)
async def summarize_interview(
    application_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    if current_user.role != UserRole.HR:
        raise HTTPException(status_code=403, detail="Only HR can view summaries")

    # Fetch Application
    result = await session.execute(select(Application).where(Application.id == application_id))
    app = result.scalars().first()
    
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    if not app.chat_history:
        return InterviewSummaryResponse(
            strengths=[],
            weaknesses=[],
            project_understanding_score=0,
            hiring_recommendation="N/A",
            summary_text="No interview transcript available to analyze."
        )

    # Format Transcript
    transcript_text = ""
    for msg in app.chat_history:
        role = msg.get("role", "unknown")
        content = msg.get("content") or msg.get("answer") or msg.get("reply") or ""
        question = msg.get("question")
        
        if role == "user":
            transcript_text += f"Candidate: {content}\n"
        elif "assistant" in role:
            if question:
                 transcript_text += f"Interviewer: {question}\n"
                 transcript_text += f"Candidate Answer: {content}\n" # Stored answer
            else:
                 transcript_text += f"Interviewer: {content}\n"
    
    # LLM Analysis
    prompt = f"""
    You are an expert Technical Recruiter and Engineering Manager.
    Analyze the following interview transcript for a Software Engineering role.
    
    Transcript:
    {transcript_text[:12000]}
    
    Task:
    1. Evaluate the candidate's technical depth based on their answers.
    2. Assess their understanding of their own projects (if asked).
    3. Identify key strengths and weaknesses shown in the CONVERSATION (not just resume).
    4. Provide a hiring recommendation details.
    
    Output strictly valid JSON:
    {{
        "strengths": ["List of observed strengths"],
        "weaknesses": ["List of observed weaknesses or vague answers"],
        "project_understanding_score": <int 0-100>,
        "hiring_recommendation": "Strong Hire" | "Hire" | "Leaning No" | "Reject",
        "summary_text": "A brief 2-3 sentence executive summary of the interview performance."
    }}
    """
    
    try:
        completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a helpful assistant that outputs raw JSON data without markdown formatting."},
                {"role": "user", "content": prompt}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.3,
        )
        content = completion.choices[0].message.content
        
        # Cleanup
        clean_content = content.replace("```json", "").replace("```", "").strip()
        start = clean_content.find('{')
        end = clean_content.rfind('}') + 1
        if start != -1 and end != -1:
            json_str = clean_content[start:end]
            data = json.loads(json_str)
            return InterviewSummaryResponse(**data)
            
        raise ValueError("Could not parse LLM JSON")
        
    except Exception as e:
        print(f"Summary Generation Error: {e}")
        return InterviewSummaryResponse(
            strengths=[],
            weaknesses=["Error generating summary"],
            project_understanding_score=0,
            hiring_recommendation="Error",
            summary_text=f"Failed to generate summary: {str(e)}"
        )

class ViolationRequest(BaseModel):
    application_id: int

@router.post("/log_violation")
async def log_violation(
    request: ViolationRequest,
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

    # Append System Warning to History
    current_history = list(app.chat_history) if app.chat_history else []
    
    # Append System Warning to History
    current_history = list(app.chat_history) if app.chat_history else []
    
    # Check if the last message was already a violation to prevent flooding
    # Using optimistic check on last message
    if current_history and current_history[-1].get("role") == "system_alert":
        # Even if we don't duplicate the log, we check the count
        violation_count = sum(1 for msg in current_history if msg.get("role") == "system_alert")
        return {"message": "Violation logged", "count": violation_count, "terminated": violation_count >= 3}
        
    timestamp = datetime.utcnow().strftime("%H:%M:%S")
    current_history.append({
        "role": "system_alert", 
        "content": f"⚠️ [PROCTORING ALERT] Candidate switched tabs or moved focus away at {timestamp} UTC."
    })
    
    # COUNT VIOLATIONS
    violation_count = 0
    for msg in current_history:
        if msg.get("role") == "system_alert":
            violation_count += 1
            
    print(f"[DEBUG] App {request.application_id} Violation Count: {violation_count}")
    
    # 3-Strike Rule
    is_terminated = False
    if violation_count >= 3:
        is_terminated = True
        app.status = "Rejected"
        current_history.append({
            "role": "system_alert",
            "content": "🚫 [DISQUALIFIED] Interview terminated due to multiple proctoring violations."
        })
    
    app.chat_history = current_history
    session.add(app)
    await session.commit()
    
    return {
        "message": "Violation logged", 
        "count": violation_count, 
        "terminated": is_terminated
    }
