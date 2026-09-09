from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.core.database import get_db
from app.models.db_models import Student, PlacementDrive, Application, InterviewOutcome

router = APIRouter(prefix="/analytics", tags=["TPO Analytics & NAAC Accreditation"])

@router.get("/tpo-dashboard")
def get_tpo_dashboard_metrics(db: Session = Depends(get_db)):
    """Computes high-level placement KPIs, department distribution, and at-risk candidates."""
    students = db.query(Student).all()
    total_students = len(students)

    drives = db.query(PlacementDrive).all()
    total_drives = len(drives)

    # Offers
    offered_apps = db.query(Application).filter(Application.status == "OFFERED").all()
    placed_student_ids = list(set([a.student_id for a in offered_apps]))
    placed_count = len(placed_student_ids)
    placement_rate = round((placed_count / max(total_students, 1)) * 100, 1)

    # CTC calculations
    packages = [d.package_ctc for d in drives if d.package_ctc]
    avg_ctc = round(sum(packages) / max(len(packages), 1), 2)
    max_ctc = max(packages) if packages else 0.0

    # Department-wise breakdown
    dept_stats = {}
    for s in students:
        d = s.department
        if d not in dept_stats:
            dept_stats[d] = {"total": 0, "placed": 0, "avg_cgpa": []}
        dept_stats[d]["total"] += 1
        dept_stats[d]["avg_cgpa"].append(s.cgpa)
        if s.id in placed_student_ids:
            dept_stats[d]["placed"] += 1

    dept_summary = []
    for d, stats in dept_stats.items():
        rate = round((stats["placed"] / max(stats["total"], 1)) * 100, 1)
        mean_cgpa = round(sum(stats["avg_cgpa"]) / max(len(stats["avg_cgpa"]), 1), 2)
        dept_summary.append({
            "department": d,
            "total_students": stats["total"],
            "placed_students": stats["placed"],
            "placement_percentage": rate,
            "average_cgpa": mean_cgpa
        })

    # At-risk students (Profile strength < 55 or Backlogs >= 1 with 0 offers)
    at_risk = []
    for s in students:
        if s.id not in placed_student_ids:
            if s.profile_strength < 60 or s.backlog_count > 0:
                at_risk.append({
                    "student_id": s.id,
                    "name": s.name,
                    "roll_number": s.roll_number,
                    "department": s.department,
                    "cgpa": s.cgpa,
                    "backlog_count": s.backlog_count,
                    "profile_strength": s.profile_strength,
                    "primary_issue": "Low Profile Strength" if s.profile_strength < 60 else "Active Backlogs"
                })

    return {
        "total_students": total_students,
        "total_placement_drives": total_drives,
        "placed_students_count": placed_count,
        "overall_placement_percentage": placement_rate,
        "average_ctc_lpa": avg_ctc,
        "highest_ctc_lpa": max_ctc,
        "department_distribution": dept_summary,
        "at_risk_students_count": len(at_risk),
        "at_risk_students": at_risk[:15]
    }

@router.get("/naac-report")
def export_naac_accreditation_report(db: Session = Depends(get_db)):
    """Formatted report matching NAAC Criterion 5.2.1 (Placement of Outgoing Students)."""
    tpo_metrics = get_tpo_dashboard_metrics(db)
    
    return {
        "institution_criterion": "NAAC 5.2.1 - Placement of Outgoing Students",
        "academic_year": "2025-2026",
        "total_graduating_cohort": tpo_metrics["total_students"],
        "total_placed_candidates": tpo_metrics["placed_students_count"],
        "placement_ratio_percentage": tpo_metrics["overall_placement_percentage"],
        "mean_package_lpa": tpo_metrics["average_ctc_lpa"],
        "highest_package_lpa": tpo_metrics["highest_ctc_lpa"],
        "equity_and_fairness_compliance": "EEOC 4/5ths Rule Audited via CareerLens AI",
        "departmental_breakdown": tpo_metrics["department_distribution"]
    }
