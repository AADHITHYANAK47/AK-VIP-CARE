from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.db_models import PlacementDrive
from app.models.schemas import FairnessAuditResponse, CounterfactualRequest, CounterfactualResponse
from app.services.fairness_auditor import audit_drive_fairness, run_counterfactual_simulation

router = APIRouter(prefix="/fairness", tags=["Fairness & Bias Auditing"])

@router.get("/audit/{drive_id}", response_model=FairnessAuditResponse)
def get_drive_audit(drive_id: int, db: Session = Depends(get_db)):
    """Audits placement drive using EEOC 80% Four-Fifths rule across cohorts."""
    try:
        return audit_drive_fairness(db, drive_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/counterfactual", response_model=CounterfactualResponse)
def test_counterfactual_fairness(payload: CounterfactualRequest, db: Session = Depends(get_db)):
    """Simulates: 'If this student's department or backlog status were different, would their rank change?'"""
    try:
        return run_counterfactual_simulation(db, payload)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/summary")
def get_overall_fairness_summary(db: Session = Depends(get_db)):
    """Returns college-wide overview of audits conducted across all placement drives."""
    drives = db.query(PlacementDrive).all()
    reports = []
    severe_alerts = 0
    total_audited = 0

    for d in drives:
        try:
            audit = audit_drive_fairness(db, d.id)
            total_audited += 1
            if audit.auditor_verdict != "FAIR":
                severe_alerts += 1
            reports.append({
                "drive_id": d.id,
                "company_name": d.company_name,
                "title": d.title,
                "verdict": audit.auditor_verdict,
                "overall_rate": audit.overall_shortlisting_rate,
                "alert_count": len([a for a in audit.disparity_alerts if "🚨" in a or "⚠️" in a])
            })
        except Exception:
            continue

    return {
        "total_drives_audited": total_audited,
        "drives_with_disparity_warnings": severe_alerts,
        "college_equity_index": round(max(0.4, (total_audited - severe_alerts) / max(total_audited, 1)), 2),
        "drive_reports": reports
    }
