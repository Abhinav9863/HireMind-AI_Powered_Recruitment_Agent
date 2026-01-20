from fastapi import APIRouter, HTTPException, Depends
from schemas import ChatRequest, ChatResponse
import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate

load_dotenv()

router = APIRouter(
    prefix="/interview",
    tags=["interview"]
)

# Initialize Groq Client
# Note: We initialize this outside the endpoint to avoid creating it on every request,
# but ideally we should use functools.lru_cache or a dependency injection pattern for better scaling.
api_key = os.getenv("GROQ_API_KEY")

if not api_key:
    # Fallback/Empty chat implementation if no key
    print("WARNING: GROQ_API_KEY not found in env.")

@router.post("/chat", response_model=ChatResponse)
async def chat_interaction(request: ChatRequest):
    if not api_key:
        return {"reply": "I am currently offline (Missing API Key). Please check backend configuration."}

    try:
        # Simple Logic for now:
        # 1. We receive a message and context (optional job title).
        # 2. We send it to Groq.
        
        llm = ChatGroq(temperature=0, groq_api_key=api_key, model_name="llama-3.3-70b-versatile")
        
        system_prompt = "You are an AI Job Interviewer. The candidate is applying for the role of {role}. Conduct a professional but friendly technical interview. Keep your responses concise (under 3 sentences) to keep the conversation flowing."
        
        if not request.context:
            request.context = "General Software Engineering"

        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("human", "{input}")
        ])

        chain = prompt | llm
        
        response = chain.invoke({
            "role": request.context,
            "input": request.message
        })

        return {"reply": response.content}

    except Exception as e:
        print(f"AI Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
