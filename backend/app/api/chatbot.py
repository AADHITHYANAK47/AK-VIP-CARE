from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.models.schemas import (
    ChatbotQueryRequest, ChatbotQueryResponse,
    ResumeAnalysisRequest, ResumeAnalysisResponse,
    MockInterviewTurnRequest, MockInterviewTurnResponse
)
from app.services.ai_copilot import (
    process_copilot_chat,
    analyze_resume_deep,
    evaluate_mock_interview_turn
)

router = APIRouter(prefix="/chatbot", tags=["AI Copilot & Chatbot"])

@router.post("/chat", response_model=ChatbotQueryResponse)
async def chat_with_copilot(payload: ChatbotQueryRequest, db: Session = Depends(get_db)):
    """
    Primary endpoint for the Quantum AI Career Copilot.
    Aware of user role, personal uploaded resume, and placement drives.
    """
    msgs = [{"role": m.role, "content": m.content} for m in payload.messages]
    
    result = await process_copilot_chat(
        messages=msgs,
        user_role=payload.user_role or "student",
        student_id=payload.student_id,
        drive_id=payload.drive_id,
        context_mode=payload.context_mode or "general",
        db_session=db
    )

    return ChatbotQueryResponse(
        reply=result["reply"],
        suggested_prompts=result.get("suggested_prompts", []),
        citations=result.get("citations", []),
        ats_score_insight=result.get("ats_score_insight")
    )

@router.post("/analyze-resume", response_model=ResumeAnalysisResponse)
async def analyze_resume_endpoint(payload: ResumeAnalysisRequest, db: Session = Depends(get_db)):
    """
    Deep ATS resume audit against specific placement drive requirements,
    extracting skills, detecting gaps, and generating STAR bullet point transformations.
    """
    res = await analyze_resume_deep(
        student_id=payload.student_id,
        resume_text=payload.resume_text,
        drive_id=payload.drive_id,
        db_session=db
    )
    return ResumeAnalysisResponse(**res)

@router.post("/mock-interview", response_model=MockInterviewTurnResponse)
async def mock_interview_endpoint(payload: MockInterviewTurnRequest, db: Session = Depends(get_db)):
    """
    Real-time interactive technical & HR interview turn evaluation, scoring
    technical accuracy, communication clarity, and providing coaching.
    """
    res = await evaluate_mock_interview_turn(
        question=payload.question,
        answer=payload.answer,
        role=payload.role or "software engineer",
        drive_id=payload.drive_id,
        student_id=payload.student_id,
        db_session=db
    )
    return MockInterviewTurnResponse(**res)

@router.get("/status")
def get_chatbot_status():
    """Returns active AI Copilot engines, model status, and capabilities."""
    active_engine = "Built-in Quantum Career Engine"
    if settings.GROQ_API_KEY:
        active_engine = "Groq Llama 3.3 70B Versatile"
    elif settings.GEMINI_API_KEY:
        active_engine = "Google Gemini 1.5 Flash"
    elif settings.OPENAI_API_KEY:
        active_engine = "OpenAI GPT-4o-mini"

    return {
        "is_online": True,
        "active_engine": active_engine,
        "has_external_llm": bool(settings.GROQ_API_KEY or settings.GEMINI_API_KEY or settings.OPENAI_API_KEY),
        "supported_features": [
            "Real Resume ATS Keyword & Bullet Point Audit",
            "Interactive Technical Mock Interview Questions & Grading",
            "Placement Drive Eligibility & Compensation (₹ LPA) Strategy",
            "US EEOC 4/5ths Rule & Statutory Bias Mitigation",
            "Explainable AI (XAI) Candidate Match Attribution"
        ]
    }

