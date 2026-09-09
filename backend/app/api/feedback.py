from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.db_models import InterviewOutcome, Application, ModelWeightHistory, Student, PlacementDrive
from app.models.schemas import OutcomeLogCreate, RetrainRequest, CycleAccuracyResponse
from app.services.feedback_loop import run_feedback_retraining_cycle, get_cycles_history, extract_features_from_outcome

router = APIRouter(prefix="/feedback", tags=["Self-Improving Feedback Loop"])

@router.get("/cycles", response_model=List[CycleAccuracyResponse])
def list_cycle_history(db: Session = Depends(get_db)):
    """Retrieves all feedback cycles showing true accuracy improvement over time."""
    cycles = get_cycles_history(db)
    return [
        CycleAccuracyResponse(
            cycle_number=c.cycle_number,
            weight_skill=c.weight_skill,
            weight_cgpa=c.weight_cgpa,
            weight_project=c.weight_project,
            weight_backlog_penalty=c.weight_backlog_penalty,
            accuracy=c.accuracy,
            precision=c.precision,
            f1_score=c.f1_score,
            sample_count=c.sample_count,
            is_active=c.is_active,
            notes=c.notes or ""
        )
        for c in cycles
    ]

@router.post("/outcome")
def log_interview_outcome(payload: OutcomeLogCreate, db: Session = Depends(get_db)):
    """Recruiter logs candidate interview result (SELECTED / REJECTED + reason)."""
    app_record = db.query(Application).filter(Application.id == payload.application_id).first()
    if not app_record:
        raise HTTPException(status_code=404, detail="Application not found")

    student = db.query(Student).filter(Student.id == app_record.student_id).first()
    drive = db.query(PlacementDrive).filter(PlacementDrive.id == app_record.drive_id).first()

    # Create or update outcome
    outcome = db.query(InterviewOutcome).filter(InterviewOutcome.application_id == payload.application_id).first()
    
    # Snapshot features for deterministic retraining
    features_snap = {
        "skill_match": round((app_record.match_explanation or {}).get("skill_match_percentage", 50.0) / 100.0, 3),
        "cgpa_norm": round(max(0.0, min(1.0, (student.cgpa - 5.0) / 5.0)), 3) if student else 0.5,
        "projects_norm": round(max(0.0, min(1.0, len(student.projects or []) / 3.0)), 3) if student else 0.5,
        "backlog_norm": round(max(0.0, min(1.0, (student.backlog_count if student else 0) / 3.0)), 3)
    }

    if outcome:
        outcome.result = payload.result.upper()
        outcome.failure_category = payload.failure_category or "NONE"
        outcome.feedback_notes = payload.feedback_notes or ""
        outcome.features_snapshot = features_snap
    else:
        outcome = InterviewOutcome(
            application_id=app_record.id,
            student_id=app_record.student_id,
            drive_id=app_record.drive_id,
            result=payload.result.upper(),
            failure_category=payload.failure_category or "NONE",
            feedback_notes=payload.feedback_notes or "",
            features_snapshot=features_snap
        )
        db.add(outcome)

    # Update application status
    app_record.status = "OFFERED" if payload.result.upper() == "SELECTED" else "REJECTED"
    db.commit()
    db.refresh(outcome)

    return {
        "message": f"Interview outcome '{payload.result.upper()}' logged successfully.",
        "outcome_id": outcome.id,
        "application_id": app_record.id
    }

@router.post("/retrain", response_model=CycleAccuracyResponse)
def trigger_retrain_cycle(payload: RetrainRequest = RetrainRequest(), db: Session = Depends(get_db)):
    """
    Genuinely fits Logistic Regression on all logged outcomes,
    recalculates model weights and computes real empirical accuracy.
    """
    cycle = run_feedback_retraining_cycle(db, notes=payload.notes or "Manual Retrain via Recruiter/TPO UI")
    return CycleAccuracyResponse(
        cycle_number=cycle.cycle_number,
        weight_skill=cycle.weight_skill,
        weight_cgpa=cycle.weight_cgpa,
        weight_project=cycle.weight_project,
        weight_backlog_penalty=cycle.weight_backlog_penalty,
        accuracy=cycle.accuracy,
        precision=cycle.precision,
        f1_score=cycle.f1_score,
        sample_count=cycle.sample_count,
        is_active=cycle.is_active,
        notes=cycle.notes or ""
    )

@router.get("/outcomes")
def list_outcomes(limit: int = 50, db: Session = Depends(get_db)):
    outcomes = db.query(InterviewOutcome).order_by(InterviewOutcome.id.desc()).limit(limit).all()
    results = []
    for o in outcomes:
        student = db.query(Student).filter(Student.id == o.student_id).first()
        drive = db.query(PlacementDrive).filter(PlacementDrive.id == o.drive_id).first()
        results.append({
            "outcome_id": o.id,
            "application_id": o.application_id,
            "student_name": student.name if student else "Unknown",
            "roll_number": student.roll_number if student else "Unknown",
            "company_name": drive.company_name if drive else "Unknown",
            "role": drive.title if drive else "Unknown",
            "result": o.result,
            "failure_category": o.failure_category,
            "feedback_notes": o.feedback_notes,
            "logged_at": o.logged_at
        })
    return results
