import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship

from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, nullable=False)  # 'student', 'recruiter', 'tpo', 'employee', 'manager', 'cpo'
    is_verified = Column(Boolean, default=False)
    last_login = Column(DateTime, nullable=True)
    password_hash = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    roll_number = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    department = Column(String, index=True, nullable=False)  # 'CSE', 'ECE', 'MECH', 'CIVIL', 'IT'
    cgpa = Column(Float, nullable=False)
    backlog_count = Column(Integer, default=0)
    gender = Column(String, nullable=False)  # 'Male', 'Female', 'Non-Binary'
    skills = Column(JSON, default=list)  # ["Python", "React", "Docker"]
    projects = Column(JSON, default=list)  # [{"title": "...", "tech": [...]}]
    certifications = Column(JSON, default=list)
    resume_text = Column(Text, default="")
    profile_strength = Column(Integer, default=50)  # 0 to 100
    
    # Real Persistent Resume Upload Fields (PDF / Images / Text)
    resume_file_data = Column(Text, nullable=True)  # Base64 data URL
    resume_file_name = Column(String, nullable=True)
    resume_file_type = Column(String, nullable=True)
    resume_uploaded_at = Column(DateTime, nullable=True)
    ats_score = Column(Integer, default=0)
    ats_breakdown = Column(JSON, default=dict)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    applications = relationship("Application", back_populates="student")

class PlacementDrive(Base):
    __tablename__ = "placement_drives"

    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String, nullable=False)
    title = Column(String, nullable=False)
    role_description = Column(Text, default="")
    package_ctc = Column(Float, nullable=False)  # in LPA (Lakhs per Annum)
    min_cgpa = Column(Float, default=6.0)
    max_backlogs = Column(Integer, default=0)
    eligible_departments = Column(JSON, default=list)  # ["CSE", "IT"]
    required_skills = Column(JSON, default=list)  # ["Python", "FastAPI"]
    preferred_skills = Column(JSON, default=list)
    drive_date = Column(String, default="")
    status = Column(String, default="OPEN")  # 'OPEN', 'SHORTLISTED', 'COMPLETED'
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    applications = relationship("Application", back_populates="drive")

class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    drive_id = Column(Integer, ForeignKey("placement_drives.id"), nullable=False)
    match_score = Column(Float, default=0.0)  # 0 to 100
    match_explanation = Column(JSON, default=dict)
    status = Column(String, default="APPLIED")  # 'APPLIED', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'OFFERED', 'REJECTED'
    applied_at = Column(DateTime, default=datetime.datetime.utcnow)

    student = relationship("Student", back_populates="applications")
    drive = relationship("PlacementDrive", back_populates="applications")
    interview_outcome = relationship("InterviewOutcome", back_populates="application", uselist=False)

class InterviewOutcome(Base):
    __tablename__ = "interview_outcomes"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    drive_id = Column(Integer, ForeignKey("placement_drives.id"), nullable=False)
    result = Column(String, nullable=False)  # 'SELECTED', 'REJECTED'
    failure_category = Column(String, default="NONE")  # 'TECHNICAL', 'COMMUNICATION', 'CULTURAL_FIT', 'SKILL_GAP', 'NONE'
    feedback_notes = Column(Text, default="")
    features_snapshot = Column(JSON, default=dict)  # {"skill_match": 0.85, "cgpa_norm": 0.82, "projects_count": 3, "backlogs": 1}
    logged_at = Column(DateTime, default=datetime.datetime.utcnow)

    application = relationship("Application", back_populates="interview_outcome")

class ModelWeightHistory(Base):
    __tablename__ = "model_weight_history"

    id = Column(Integer, primary_key=True, index=True)
    cycle_number = Column(Integer, nullable=False, unique=True)
    weight_skill = Column(Float, nullable=False)
    weight_cgpa = Column(Float, nullable=False)
    weight_project = Column(Float, nullable=False)
    weight_backlog_penalty = Column(Float, nullable=False)
    intercept = Column(Float, default=0.0)
    accuracy = Column(Float, nullable=False)
    precision = Column(Float, default=0.0)
    f1_score = Column(Float, default=0.0)
    sample_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=False)
    notes = Column(String, default="")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class FairnessAuditLog(Base):
    __tablename__ = "fairness_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    drive_id = Column(Integer, ForeignKey("placement_drives.id"), nullable=False)
    total_applicants = Column(Integer, default=0)
    total_shortlisted = Column(Integer, default=0)
    disparity_backlog = Column(Float, default=1.0)
    disparity_department = Column(JSON, default=dict)
    disparity_gender = Column(Float, default=1.0)
    violations = Column(JSON, default=list)
    generated_at = Column(DateTime, default=datetime.datetime.utcnow)
