import datetime
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional

from app.core.database import get_db
from app.models.db_models import Student, PlacementDrive, Application
from app.models.schemas import StudentResponse, StudentCreate, StudentUpdate, ResumeUploadRequest, ResumeUploadResponse
from app.services.resume_parser import parse_resume_content, extract_text_from_data_url
from app.services.matching_engine import evaluate_candidate_match, get_active_model_weights

router = APIRouter(prefix="/students", tags=["Students"])

@router.get("", response_model=List[StudentResponse])
def list_students(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(Student).offset(skip).limit(limit).all()

@router.get("/{student_id}", response_model=StudentResponse)
def get_student(student_id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student

@router.post("", response_model=StudentResponse)
def create_student(data: StudentCreate, db: Session = Depends(get_db)):
    parsed = parse_resume_content(data.resume_text or "")
    student = Student(
        roll_number=data.roll_number,
        name=data.name,
        email=data.email,
        department=data.department,
        cgpa=data.cgpa,
        backlog_count=data.backlog_count,
        gender=data.gender,
        skills=data.skills or parsed["skills"],
        projects=data.projects or parsed["projects"],
        certifications=data.certifications or parsed["certifications"],
        resume_text=data.resume_text or "",
        profile_strength=parsed["profile_strength"],
        ats_score=parsed.get("ats_score", 0),
        ats_breakdown=parsed.get("ats_breakdown", {})
    )
    db.add(student)
    db.commit()
    db.refresh(student)
    return student

@router.put("/{student_id}", response_model=StudentResponse)
def update_student(student_id: int, data: StudentUpdate, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    if data.name is not None: student.name = data.name
    if data.department is not None: student.department = data.department
    if data.cgpa is not None: student.cgpa = data.cgpa
    if data.backlog_count is not None: student.backlog_count = data.backlog_count
    if data.skills is not None: student.skills = data.skills
    if data.projects is not None: student.projects = data.projects
    if data.certifications is not None: student.certifications = data.certifications
    if data.resume_file_data is not None: student.resume_file_data = data.resume_file_data
    if data.resume_file_name is not None: student.resume_file_name = data.resume_file_name
    if data.resume_file_type is not None: student.resume_file_type = data.resume_file_type
    if data.ats_score is not None: student.ats_score = data.ats_score
    if data.ats_breakdown is not None: student.ats_breakdown = data.ats_breakdown
    if data.resume_text is not None:
        student.resume_text = data.resume_text
        parsed = parse_resume_content(data.resume_text)
        student.profile_strength = parsed["profile_strength"]
        student.ats_score = parsed["ats_score"]
        student.ats_breakdown = parsed["ats_breakdown"]

    db.commit()
    db.refresh(student)
    return student

@router.post("/{student_id}/resume/upload", response_model=ResumeUploadResponse)
def upload_student_resume(student_id: int, payload: ResumeUploadRequest, db: Session = Depends(get_db)):
    """
    Permanently uploads and saves the student's real PDF or image resume to the database.
    Extracts text, parses skills and projects, computes ATS score, and updates match scores.
    """
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    extracted_text, mime_type = extract_text_from_data_url(payload.file_data)
    
    # If text was extracted from PDF or plain text, parse it with NLP engine
    text_to_parse = extracted_text if extracted_text.strip() else student.resume_text
    parsed = parse_resume_content(text_to_parse or f"{student.name} {payload.file_name}")

    # Combine extracted skills with existing
    merged_skills = list(dict.fromkeys(student.skills + parsed["skills"]))

    # Update student record permanently in DB
    student.resume_file_data = payload.file_data
    student.resume_file_name = payload.file_name
    student.resume_file_type = payload.file_type or mime_type
    student.resume_uploaded_at = datetime.datetime.utcnow()
    student.resume_text = text_to_parse or student.resume_text
    student.skills = merged_skills
    if parsed["projects"] and len(parsed["projects"]) > 0:
        student.projects = parsed["projects"]
    if parsed["certifications"] and len(parsed["certifications"]) > 0:
        student.certifications = list(dict.fromkeys(student.certifications + parsed["certifications"]))
    student.ats_score = parsed["ats_score"]
    student.ats_breakdown = parsed["ats_breakdown"]
    student.profile_strength = parsed["profile_strength"]

    # Re-evaluate all applications for this student with active weights
    weights = get_active_model_weights(db)
    apps = db.query(Application).filter(Application.student_id == student_id).all()
    for app in apps:
        drive = db.query(PlacementDrive).filter(PlacementDrive.id == app.drive_id).first()
        if drive:
            score, xai, is_eligible = evaluate_candidate_match(student, drive, weights)
            app.match_score = score
            app.match_explanation = xai.model_dump()

    db.commit()
    db.refresh(student)

    return ResumeUploadResponse(
        success=True,
        message=f"Resume '{payload.file_name}' permanently stored in database. ATS Score: {student.ats_score}%",
        file_name=payload.file_name,
        ats_score=student.ats_score,
        ats_breakdown=student.ats_breakdown,
        extracted_skills=parsed["skills"],
        profile_strength=student.profile_strength,
        student=StudentResponse.model_validate(student)
    )

@router.get("/{student_id}/resume")
def get_student_resume(student_id: int, db: Session = Depends(get_db)):
    """Retrieves student's active resume file metadata and data URL."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    return {
        "student_id": student.id,
        "name": student.name,
        "has_uploaded_resume": bool(student.resume_file_data),
        "file_name": student.resume_file_name,
        "file_type": student.resume_file_type,
        "uploaded_at": student.resume_uploaded_at,
        "file_data": student.resume_file_data,
        "ats_score": student.ats_score if student.ats_score is not None else 0,
        "ats_breakdown": student.ats_breakdown or {},
        "skills": student.skills
    }

@router.delete("/{student_id}/resume")
def delete_student_resume(student_id: int, db: Session = Depends(get_db)):
    """Removes student's uploaded custom resume file from the database."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    student.resume_file_data = None
    student.resume_file_name = None
    student.resume_file_type = None
    student.resume_uploaded_at = None
    student.ats_score = 0
    student.ats_breakdown = {}
    db.commit()
    return {"success": True, "message": "Resume document removed from database."}

@router.post("/parse-resume")
def parse_resume_endpoint(payload: Dict[str, str] = Body(...)):
    """Receives resume text, extracts skills/projects/CGPA, and computes profile strength."""
    text = payload.get("text", "")
    return parse_resume_content(text)

@router.post("/{student_id}/apply/{drive_id}")
def apply_to_drive(
    student_id: int, 
    drive_id: int, 
    payload: Optional[Dict[str, Any]] = Body(None),
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(Student.id == student_id).first()
    drive = db.query(PlacementDrive).filter(PlacementDrive.id == drive_id).first()
    if not student or not drive:
        raise HTTPException(status_code=404, detail="Student or Drive not found")

    existing = db.query(Application).filter(
        Application.student_id == student_id,
        Application.drive_id == drive_id
    ).first()

    weights = get_active_model_weights(db)
    score, xai, is_eligible = evaluate_candidate_match(student, drive, weights)

    xai_data = xai.model_dump()
    if payload:
        xai_data["student_details_form"] = payload

    if existing:
        existing.match_score = score
        existing.match_explanation = xai_data
        db.commit()
        return {
            "message": "Application already submitted; details and scores updated", 
            "application_id": existing.id, 
            "match_score": score, 
            "is_eligible": is_eligible,
            "form_details": payload or {}
        }

    app_record = Application(
        student_id=student_id,
        drive_id=drive_id,
        match_score=score,
        match_explanation=xai_data,
        status="SHORTLISTED" if is_eligible and score >= 75.0 else ("APPLIED" if is_eligible else "NOT_ELIGIBLE")
    )
    db.add(app_record)
    db.commit()
    db.refresh(app_record)
    return {
        "message": f"Successfully registered and applied for {drive.company_name}!", 
        "application_id": app_record.id, 
        "match_score": score, 
        "is_eligible": is_eligible,
        "form_details": payload or {}
    }

@router.get("/{student_id}/applications")
def get_student_applications(student_id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    apps = db.query(Application).filter(Application.student_id == student_id).all()
    results = []
    for a in apps:
        drive = db.query(PlacementDrive).filter(PlacementDrive.id == a.drive_id).first()
        results.append({
            "application_id": a.id,
            "drive_id": a.drive_id,
            "company_name": drive.company_name if drive else "Unknown",
            "role": drive.title if drive else "Unknown",
            "package_ctc": drive.package_ctc if drive else 0.0,
            "match_score": a.match_score,
            "status": a.status,
            "match_explanation": a.match_explanation,
            "form_details": a.match_explanation.get("student_details_form", {}) if a.match_explanation else {},
            "applied_at": a.applied_at
        })
    return results
