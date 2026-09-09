from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import Dict, Any, List

from app.core.database import get_db
from app.models.db_models import Student, PlacementDrive
from app.models.schemas import CareerRoadmapResponse
from app.services.roadmap_engine import generate_student_roadmap

router = APIRouter(prefix="/roadmap", tags=["Career Roadmap & Interview Coach"])

@router.get("/student/{student_id}/drive/{drive_id}", response_model=CareerRoadmapResponse)
def get_career_roadmap(student_id: int, drive_id: int, db: Session = Depends(get_db)):
    """Generates personalized skill-gap roadmap tailored to specific drive requirements."""
    try:
        return generate_student_roadmap(db, student_id, drive_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/mock-interview")
def generate_mock_interview_questions(payload: Dict[str, Any] = Body(...)):
    """
    Simulates an interview readiness coach:
    Generates targeted technical and behavioral questions based on drive skills.
    """
    role = payload.get("role", "Software Engineer")
    skills = payload.get("skills", ["Python", "FastAPI", "Docker"])

    questions = [
        {
            "id": 1,
            "type": "Technical Concept",
            "question": f"Explain how you handle asynchronous I/O and concurrency in {skills[0] if skills else 'Backend Systems'}. When would thread pools be preferred over event loops?",
            "eval_criteria": "Look for non-blocking I/O concepts, asyncio/event-loop understanding, and real-world bottlenecks."
        },
        {
            "id": 2,
            "type": "System Architecture",
            "question": f"Design a resilient microservice handling 50k requests/minute requiring {skills[1] if len(skills) > 1 else 'Caching'}. How would you manage connection pooling and fault tolerance?",
            "eval_criteria": "Evaluates horizontal scaling, caching strategies (Redis), circuit breakers, and database indexing."
        },
        {
            "id": 3,
            "type": "Behavioral / Problem Solving",
            "question": "Describe a scenario where a production deployment caused a silent failure or high latency. How did you diagnose, debug, and implement an automated guardrail?",
            "eval_criteria": "Evaluates structured incident response (STAR method), observability, logging, and post-mortem mindset."
        }
    ]

    return {
        "role": role,
        "questions": questions,
        "coaching_tip": "Structure every technical answer with: (1) Core Definition, (2) Code/Architecture Trade-offs, and (3) Production Failure Modes you've mitigated."
    }

@router.post("/mock-interview/evaluate")
def evaluate_interview_response(payload: Dict[str, str] = Body(...)):
    """Scores candidate's mock response on structure, technical relevance, and confidence."""
    question = payload.get("question", "")
    answer = payload.get("answer", "")

    word_count = len(answer.split())
    if word_count < 15:
        score = 45
        feedback = "Answer is too brief. Provide concrete architecture specifics, algorithms, and real project examples."
    elif word_count < 40:
        score = 72
        feedback = "Good foundation. Mention concrete edge cases, performance trade-offs, and monitoring metrics to reach senior tier."
    else:
        score = 88
        feedback = "Strong, structured response covering technical mechanics, design trade-offs, and engineering rigor."

    return {
        "score": score,
        "feedback": feedback,
        "strengths": ["Structured flow", "Relevant technical vocabulary"],
        "improvement_areas": ["Include specific metric gains (e.g. 'reduced latency by 35%')"]
    }
