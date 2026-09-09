import re
from typing import List, Dict, Any, Tuple
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.db_models import Student, PlacementDrive, ModelWeightHistory, Application
from app.models.schemas import XaiBreakdown, CandidateMatchResult

def get_active_model_weights(db: Session) -> Dict[str, float]:
    """Retrieve active weights from ModelWeightHistory or default values."""
    active = db.query(ModelWeightHistory).filter(ModelWeightHistory.is_active == True).first()
    if active:
        return {
            "skill": active.weight_skill,
            "cgpa": active.weight_cgpa,
            "project": active.weight_project,
            "backlog": active.weight_backlog_penalty
        }
    return {
        "skill": settings.DEFAULT_WEIGHT_SKILL,
        "cgpa": settings.DEFAULT_WEIGHT_CGPA,
        "project": settings.DEFAULT_WEIGHT_PROJECT,
        "backlog": settings.DEFAULT_WEIGHT_BACKLOG_PENALTY
    }

def calculate_skill_similarity(student_skills: List[str], drive_skills: List[str], drive_preferred: List[str]) -> Tuple[float, List[str], List[str]]:
    """Calculates normalized skill overlap and cosine similarity."""
    s_skills_lower = [s.strip().lower() for s in student_skills if s]
    d_skills_lower = [s.strip().lower() for s in drive_skills if s]
    p_skills_lower = [s.strip().lower() for s in drive_preferred if s]

    if not d_skills_lower and not p_skills_lower:
        return 1.0, student_skills, []

    matched = []
    missing = []

    for req in drive_skills:
        req_clean = req.strip().lower()
        if any(req_clean in s or s in req_clean for s in s_skills_lower):
            matched.append(req)
        else:
            missing.append(req)

    preferred_matched = [p for p in drive_preferred if any(p.lower() in s for s in s_skills_lower)]

    # TF-IDF cosine similarity as complementary continuous feature
    student_doc = " ".join(s_skills_lower)
    drive_doc = " ".join(d_skills_lower + p_skills_lower)

    tfidf_sim = 0.0
    if student_doc and drive_doc:
        try:
            vec = TfidfVectorizer().fit([student_doc, drive_doc])
            tfidf_mat = vec.transform([student_doc, drive_doc])
            sim = cosine_similarity(tfidf_mat[0:1], tfidf_mat[1:2])[0][0]
            tfidf_sim = float(sim)
        except Exception:
            tfidf_sim = 0.5

    # Discrete ratio
    req_ratio = len(matched) / max(len(drive_skills), 1)
    pref_ratio = (len(preferred_matched) / max(len(drive_preferred), 1)) if drive_preferred else 0.0

    # Blended skill similarity
    blended = 0.55 * req_ratio + 0.20 * pref_ratio + 0.25 * tfidf_sim
    blended = float(np.clip(blended, 0.0, 1.0))

    return blended, matched, missing

def evaluate_candidate_match(student: Student, drive: PlacementDrive, weights: Dict[str, float]) -> Tuple[float, XaiBreakdown, bool]:
    """Computes explainable match score with XAI attribution."""
    # 1. Skill Similarity
    req_skills = drive.required_skills or []
    pref_skills = drive.preferred_skills or []
    student_skills = student.skills or []
    
    skill_sim, matched, missing = calculate_skill_similarity(student_skills, req_skills, pref_skills)
    skill_pct = round(skill_sim * 100, 1)

    # 2. CGPA Score (normalized from 5.0 to 10.0 scale)
    cgpa_norm = np.clip((student.cgpa - 5.0) / 5.0, 0.0, 1.0)

    # 3. Project Score (scale 0 to 4+ projects)
    projects_cnt = len(student.projects or [])
    project_norm = np.clip(projects_cnt / 3.0, 0.0, 1.0)

    # 4. Backlog Penalty
    backlog_norm = np.clip(student.backlog_count / 3.0, 0.0, 1.0)

    # Weighted sum
    skill_contrib = weights["skill"] * skill_sim * 100
    cgpa_contrib = weights["cgpa"] * cgpa_norm * 100
    project_contrib = weights["project"] * project_norm * 100
    backlog_deduction = weights["backlog"] * backlog_norm * 100

    raw_score = skill_contrib + cgpa_contrib + project_contrib - backlog_deduction
    final_score = float(np.clip(raw_score, 5.0, 99.5))
    final_score = round(final_score, 1)

    # Eligibility evaluation
    reasons = []
    eligibility_remarks = []
    is_eligible = True

    # CGPA Check
    if student.cgpa < drive.min_cgpa:
        is_eligible = False
        eligibility_remarks.append(f"CGPA {student.cgpa:.1f} is below minimum requirement ({drive.min_cgpa:.1f})")
    else:
        eligibility_remarks.append(f"Meets CGPA threshold ({student.cgpa:.1f} >= {drive.min_cgpa:.1f})")

    # Backlog Check
    if student.backlog_count > drive.max_backlogs:
        is_eligible = False
        eligibility_remarks.append(f"Has {student.backlog_count} backlogs (Drive limit: {drive.max_backlogs})")
    else:
        eligibility_remarks.append(f"Within backlog limit ({student.backlog_count} <= {drive.max_backlogs})")

    # Department Check
    eligible_depts = [d.upper() for d in (drive.eligible_departments or [])]
    if eligible_depts and student.department.upper() not in eligible_depts:
        is_eligible = False
        eligibility_remarks.append(f"Department '{student.department}' not in eligible list ({', '.join(eligible_depts)})")
    else:
        eligibility_remarks.append(f"Department '{student.department}' is eligible")

    # XAI Explanatory Bullet Points
    if matched:
        reasons.append(f"Matched core skills: {', '.join(matched)} (+{skill_contrib:.1f} pts)")
    if missing:
        reasons.append(f"Missing required skills: {', '.join(missing)}")
    reasons.append(f"Academic CGPA {student.cgpa:.2f} contributed +{cgpa_contrib:.1f} pts")
    if projects_cnt > 0:
        reasons.append(f"{projects_cnt} validated projects added +{project_contrib:.1f} pts")
    if student.backlog_count > 0:
        reasons.append(f"Penalty for {student.backlog_count} active backlog: -{backlog_deduction:.1f} pts")

    xai = XaiBreakdown(
        skill_match_percentage=skill_pct,
        matched_skills=matched,
        missing_skills=missing,
        cgpa_contribution=round(skill_contrib, 1),
        project_contribution=round(project_contrib, 1),
        backlog_penalty_deduction=round(backlog_deduction, 1),
        reasons=reasons,
        is_eligible=is_eligible,
        eligibility_remarks=eligibility_remarks
    )

    return final_score, xai, is_eligible

def rank_candidates_for_drive(db: Session, drive_id: int) -> List[CandidateMatchResult]:
    """Ranks all registered students for a given drive with XAI breakdowns."""
    drive = db.query(PlacementDrive).filter(PlacementDrive.id == drive_id).first()
    if not drive:
        return []

    weights = get_active_model_weights(db)
    students = db.query(Student).all()

    results = []
    for s in students:
        score, xai, is_eligible = evaluate_candidate_match(s, drive, weights)
        results.append({
            "student": s,
            "score": score,
            "xai": xai,
            "is_eligible": is_eligible
        })

    # Sort primarily by eligibility (eligible first), then by match score descending
    results.sort(key=lambda item: (item["is_eligible"], item["score"]), reverse=True)

    ranked_results: List[CandidateMatchResult] = []
    for idx, r in enumerate(results, 1):
        s = r["student"]
        app = db.query(Application).filter(Application.student_id == s.id, Application.drive_id == drive_id).first()
        has_applied = app is not None
        form_details = app.match_explanation.get("student_details_form", {}) if (app and app.match_explanation) else None
        status = app.status if app else ("SHORTLISTED" if (r["is_eligible"] and idx <= 20) else ("ELIGIBLE" if r["is_eligible"] else "NOT_ELIGIBLE"))

        ranked_results.append(CandidateMatchResult(
            student_id=s.id,
            student_name=s.name,
            roll_number=s.roll_number,
            department=s.department,
            cgpa=s.cgpa,
            backlog_count=s.backlog_count,
            gender=s.gender,
            skills=s.skills or [],
            match_score=r["score"],
            rank=idx,
            is_eligible=r["is_eligible"],
            explanation=r["xai"],
            status=status,
            resume_file_data=s.resume_file_data,
            resume_file_name=s.resume_file_name,
            resume_file_type=s.resume_file_type,
            resume_uploaded_at=s.resume_uploaded_at,
            ats_score=s.ats_score,
            email=s.email,
            has_applied=has_applied,
            form_details=form_details
        ))

    return ranked_results
