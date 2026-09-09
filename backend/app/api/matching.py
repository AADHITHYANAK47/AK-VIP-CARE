from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.db_models import Student, PlacementDrive
from app.models.schemas import CandidateMatchResult
from app.services.matching_engine import rank_candidates_for_drive, evaluate_candidate_match, get_active_model_weights

router = APIRouter(prefix="/matching", tags=["AI Matching & Explainability"])

@router.get("/rank/{drive_id}", response_model=List[CandidateMatchResult])
def get_ranked_candidates(drive_id: int, db: Session = Depends(get_db)):
    """Returns ranked candidate list for recruiters with full XAI explainability."""
    drive = db.query(PlacementDrive).filter(PlacementDrive.id == drive_id).first()
    if not drive:
        raise HTTPException(status_code=404, detail="Drive not found")
    return rank_candidates_for_drive(db, drive_id)

@router.get("/student/{student_id}/drive/{drive_id}")
def get_single_match(student_id: int, drive_id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    drive = db.query(PlacementDrive).filter(PlacementDrive.id == drive_id).first()
    if not student or not drive:
        raise HTTPException(status_code=404, detail="Student or Drive not found")

    weights = get_active_model_weights(db)
    score, xai, is_eligible = evaluate_candidate_match(student, drive, weights)
    return {
        "student_id": student.id,
        "student_name": student.name,
        "drive_id": drive.id,
        "company_name": drive.company_name,
        "role": drive.title,
        "match_score": score,
        "is_eligible": is_eligible,
        "explanation": xai
    }

@router.get("/student/{student_id}/recommendations")
def get_student_recommendations(student_id: int, db: Session = Depends(get_db)):
    """Evaluates all open placement drives for this student, sorted by match score."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    drives = db.query(PlacementDrive).filter(PlacementDrive.status != "COMPLETED").all()
    weights = get_active_model_weights(db)

    results = []
    for d in drives:
        score, xai, is_eligible = evaluate_candidate_match(student, d, weights)
        results.append({
            "drive_id": d.id,
            "company_name": d.company_name,
            "title": d.title,
            "package_ctc": d.package_ctc,
            "drive_date": d.drive_date,
            "match_score": score,
            "is_eligible": is_eligible,
            "explanation": xai
        })

    # Sort eligible first, then match score
    results.sort(key=lambda x: (x["is_eligible"], x["match_score"]), reverse=True)
    return results
