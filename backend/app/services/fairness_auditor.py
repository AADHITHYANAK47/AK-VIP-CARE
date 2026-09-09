from typing import List, Dict, Any, Tuple
import numpy as np
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.db_models import Student, PlacementDrive, Application
from app.models.schemas import (
    FairnessAuditResponse,
    DisparityMetric,
    CounterfactualRequest,
    CounterfactualResponse
)
from app.services.matching_engine import rank_candidates_for_drive, evaluate_candidate_match, get_active_model_weights

def compute_group_disparities(groups: Dict[str, Dict[str, int]]) -> List[DisparityMetric]:
    """
    Applies the EEOC Four-Fifths (80%) Rule:
    Disparity Ratio = Group Rate / Reference Group Rate
    Flagged if Disparity Ratio < 0.80
    """
    rates = {}
    for g_name, counts in groups.items():
        total = counts["total"]
        shortlisted = counts["shortlisted"]
        rate = (shortlisted / total) if total > 0 else 0.0
        rates[g_name] = rate

    max_rate = max(rates.values()) if rates and max(rates.values()) > 0 else 1.0

    metrics = []
    for g_name, counts in groups.items():
        rate = rates[g_name]
        ratio = rate / max_rate if max_rate > 0 else 1.0
        ratio = float(np.clip(ratio, 0.0, 1.0)) if rate <= max_rate else 1.0
        violates = (ratio < settings.EEOC_FOUR_FIFTHS_THRESHOLD) and (counts["total"] >= 2)

        metrics.append(DisparityMetric(
            group_name=g_name,
            total_candidates=counts["total"],
            shortlisted_candidates=counts["shortlisted"],
            shortlisting_rate=round(rate * 100, 1),
            disparity_ratio=round(ratio, 2),
            violates_80_rule=violates
        ))
    return metrics

def audit_drive_fairness(db: Session, drive_id: int) -> FairnessAuditResponse:
    """Performs deep fairness and disparate-impact audit on placement drive outcomes."""
    drive = db.query(PlacementDrive).filter(PlacementDrive.id == drive_id).first()
    if not drive:
        raise ValueError("Drive not found")

    ranked = rank_candidates_for_drive(db, drive_id)
    total_apps = len(ranked)
    
    # Consider candidates shortlisted if status is SHORTLISTED or rank <= 20 and eligible
    shortlisted = [c for c in ranked if c.is_eligible and (c.status == "SHORTLISTED" or c.rank <= 20)]
    total_shortlisted = len(shortlisted)
    overall_rate = round((total_shortlisted / total_apps * 100), 1) if total_apps > 0 else 0.0

    # 1. Backlog Groups
    backlog_groups = {
        "0 Backlogs": {"total": 0, "shortlisted": 0},
        "1 Backlog": {"total": 0, "shortlisted": 0},
        "2+ Backlogs": {"total": 0, "shortlisted": 0}
    }
    for c in ranked:
        k = "0 Backlogs" if c.backlog_count == 0 else ("1 Backlog" if c.backlog_count == 1 else "2+ Backlogs")
        backlog_groups[k]["total"] += 1
        if c in shortlisted:
            backlog_groups[k]["shortlisted"] += 1

    backlog_metrics = compute_group_disparities(backlog_groups)

    # 2. Department Groups
    dept_groups = {}
    for c in ranked:
        dept = c.department
        if dept not in dept_groups:
            dept_groups[dept] = {"total": 0, "shortlisted": 0}
        dept_groups[dept]["total"] += 1
        if c in shortlisted:
            dept_groups[dept]["shortlisted"] += 1

    dept_metrics = compute_group_disparities(dept_groups)

    # 3. Gender Groups
    gender_groups = {}
    for c in ranked:
        g = c.gender
        if g not in gender_groups:
            gender_groups[g] = {"total": 0, "shortlisted": 0}
        gender_groups[g]["total"] += 1
        if c in shortlisted:
            gender_groups[g]["shortlisted"] += 1

    gender_metrics = compute_group_disparities(gender_groups)

    # Generate Alerts & Verdict
    alerts = []
    severe_count = 0

    for b in backlog_metrics:
        if b.violates_80_rule:
            severe_count += 1
            alerts.append(
                f"🚨 Backlog Disparity: '{b.group_name}' shortlisting rate is {b.shortlisting_rate}% (Disparity Ratio: {b.disparity_ratio} < 0.80). Violates EEOC 4/5ths Rule."
            )

    for d in dept_metrics:
        if d.violates_80_rule:
            severe_count += 1
            alerts.append(
                f"⚠️ Department Filter Bias: Department '{d.group_name}' selection rate is only {d.shortlisting_rate}% (Disparity Ratio: {d.disparity_ratio})."
            )

    for g in gender_metrics:
        if g.violates_80_rule:
            severe_count += 1
            alerts.append(
                f"⚠️ Gender Representation Disparity: Group '{g.group_name}' selection rate is {g.shortlisting_rate}% (Disparity Ratio: {g.disparity_ratio})."
            )

    if severe_count >= 2:
        verdict = "SEVERE_DISPARATE_IMPACT"
    elif severe_count == 1:
        verdict = "MODERATE_BIAS_DETECTED"
    else:
        verdict = "FAIR"
        alerts.append("✅ All demographic & academic cohorts meet EEOC Four-Fifths fairness standard (Disparity Ratio >= 0.80).")

    return FairnessAuditResponse(
        drive_id=drive.id,
        company_name=drive.company_name,
        drive_title=drive.title,
        total_applicants=total_apps,
        total_shortlisted=total_shortlisted,
        overall_shortlisting_rate=overall_rate,
        backlog_disparity=backlog_metrics,
        department_disparity=dept_metrics,
        gender_disparity=gender_metrics,
        disparity_alerts=alerts,
        auditor_verdict=verdict
    )

def run_counterfactual_simulation(db: Session, req: CounterfactualRequest) -> CounterfactualResponse:
    """
    Evaluates counterfactual fairness by simulating:
    'If this student's department or backlog count were different, how would their score and rank change?'
    """
    student = db.query(Student).filter(Student.id == req.student_id).first()
    drive = db.query(PlacementDrive).filter(PlacementDrive.id == req.drive_id).first()

    if not student or not drive:
        raise ValueError("Student or Drive not found")

    weights = get_active_model_weights(db)
    ranked_baseline = rank_candidates_for_drive(db, drive.id)

    # Find original position
    orig_match = next((item for item in ranked_baseline if item.student_id == student.id), None)
    orig_rank = orig_match.rank if orig_match else 999
    orig_score = orig_match.match_score if orig_match else 0.0
    orig_shortlisted = (orig_match.status == "SHORTLISTED" or (orig_match.is_eligible and orig_rank <= 20)) if orig_match else False

    # Create hypothetical student clone
    hypo_dept = req.hypothetical_department or student.department
    hypo_backlogs = req.hypothetical_backlogs if req.hypothetical_backlogs is not None else student.backlog_count

    # Re-evaluate all candidates with this student altered
    hypo_score, hypo_xai, hypo_eligible = evaluate_candidate_match(
        student=type("HypoStudent", (), {
            "name": student.name,
            "department": hypo_dept,
            "cgpa": student.cgpa,
            "backlog_count": hypo_backlogs,
            "gender": student.gender,
            "skills": student.skills,
            "projects": student.projects
        })(),
        drive=drive,
        weights=weights
    )

    # Compute counterfactual rank among peers
    other_scores = [c.match_score for c in ranked_baseline if c.student_id != student.id]
    all_scores = sorted(other_scores + [hypo_score], reverse=True)
    hypo_rank = all_scores.index(hypo_score) + 1
    hypo_shortlisted = hypo_eligible and (hypo_rank <= 20)

    rank_delta = orig_rank - hypo_rank  # Positive means rank improved
    score_delta = round(hypo_score - orig_score, 1)

    # Human-readable bias diagnosis
    if rank_delta > 10 and not orig_shortlisted and hypo_shortlisted:
        msg = f"Significant Disparity Detected: Altering status (backlogs {student.backlog_count}->{hypo_backlogs}, dept {student.department}->{hypo_dept}) jumps candidate rank by +{rank_delta} positions (Rank #{orig_rank} -> #{hypo_rank}), reversing rejection to shortlist despite identical skill set."
    elif abs(rank_delta) <= 2:
        msg = "Counterfactual Invariant: Candidate score and rank remain statistically stable under demographic/backlog perturbation. Decision is driven purely by skill competency."
    else:
        msg = f"Moderate Sensitivity: Rank shifted by {rank_delta:+d} positions with a score change of {score_delta:+0.1f} points."

    return CounterfactualResponse(
        student_id=student.id,
        student_name=student.name,
        original_department=student.department,
        original_backlogs=student.backlog_count,
        original_score=orig_score,
        original_rank=orig_rank,
        original_shortlisted=orig_shortlisted,
        hypothetical_department=hypo_dept,
        hypothetical_backlogs=hypo_backlogs,
        hypothetical_score=hypo_score,
        hypothetical_rank=hypo_rank,
        hypothetical_shortlisted=hypo_shortlisted,
        rank_delta=rank_delta,
        score_delta=score_delta,
        bias_detected_message=msg
    )
