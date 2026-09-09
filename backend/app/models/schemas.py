import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

# User & Auth
class UserBase(BaseModel):
    email: str
    name: str
    role: str

class UserCreate(UserBase):
    pass

class LoginRequest(BaseModel):
    email: str
    password: Optional[str] = "password123"
    role: Optional[str] = "student"  # 'student', 'recruiter', 'tpo', 'employee', 'manager'

class SendOtpRequest(BaseModel):
    email: str
    role: str = "student"
    name: Optional[str] = None
    type: Optional[str] = "login"  # 'signup' or 'login'

class VerifyOtpRequest(BaseModel):
    email: str
    otp: str
    role: str = "student"
    name: Optional[str] = None

class OtpResponse(BaseModel):
    success: bool
    message: str
    email: str
    smtp_delivery: bool = False
    smtp_detail: Optional[str] = None
    dev_otp: Optional[str] = None  # Provided for seamless test evaluation

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: Optional[str] = "password123"
    role: str  # 'student', 'recruiter', 'tpo', 'employee', 'manager'
    organization: Optional[str] = ""
    department: Optional[str] = "CSE"
    roll_number: Optional[str] = ""

class RegisterWithOtpRequest(BaseModel):
    email: str
    otp: str
    name: str
    password: str
    role: str = "student"
    department: Optional[str] = "Computer Science (CSE)"
    roll_number: Optional[str] = ""
    organization: Optional[str] = ""

class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    name: str
    email: str
    role: str
    organization: Optional[str] = ""
    student_id: Optional[int] = None

class UserResponse(UserBase):
    id: int
    class Config:
        from_attributes = True

# Student
class StudentBase(BaseModel):
    roll_number: str
    name: str
    email: str
    department: str
    cgpa: float
    backlog_count: int = 0
    gender: str
    skills: List[str] = []
    projects: List[Dict[str, Any]] = []
    certifications: List[str] = []
    resume_text: Optional[str] = ""
    resume_file_data: Optional[str] = None
    resume_file_name: Optional[str] = None
    resume_file_type: Optional[str] = None
    resume_uploaded_at: Optional[Any] = None
    ats_score: Optional[int] = 0
    ats_breakdown: Optional[Dict[str, Any]] = None

class StudentCreate(StudentBase):
    pass

class StudentUpdate(BaseModel):
    name: Optional[str] = None
    department: Optional[str] = None
    cgpa: Optional[float] = None
    backlog_count: Optional[int] = None
    skills: Optional[List[str]] = None
    projects: Optional[List[Dict[str, Any]]] = None
    certifications: Optional[List[str]] = None
    resume_text: Optional[str] = None
    resume_file_data: Optional[str] = None
    resume_file_name: Optional[str] = None
    resume_file_type: Optional[str] = None
    ats_score: Optional[int] = None
    ats_breakdown: Optional[Dict[str, Any]] = None

class StudentResponse(StudentBase):
    id: int
    profile_strength: int
    class Config:
        from_attributes = True

# Resume Upload
class ResumeUploadRequest(BaseModel):
    file_name: str
    file_data: str  # Base64 data URL
    file_type: str = "application/pdf"

class ResumeUploadResponse(BaseModel):
    success: bool
    message: str
    file_name: str
    ats_score: int
    ats_breakdown: Dict[str, Any]
    extracted_skills: List[str]
    profile_strength: int
    student: StudentResponse

# Database & System Configuration
class DatabaseInfoResponse(BaseModel):
    dialect: str
    is_custom_database: bool
    masked_url: str
    is_healthy: bool
    error: Optional[str] = None
    schema_status: str

class DatabaseTestRequest(BaseModel):
    database_url: str

class DatabaseTestResponse(BaseModel):
    success: bool
    message: str
    masked_url: str

# AI Chatbot & Copilot
class ChatbotMessage(BaseModel):
    role: str  # 'user', 'assistant', 'system'
    content: str

class ChatbotQueryRequest(BaseModel):
    messages: List[ChatbotMessage]
    user_role: Optional[str] = "student"
    student_id: Optional[int] = None
    drive_id: Optional[int] = None
    context_mode: Optional[str] = "general"

class ChatbotQueryResponse(BaseModel):
    reply: str
    suggested_prompts: List[str] = []
    citations: List[str] = []
    ats_score_insight: Optional[Dict[str, Any]] = None

class ResumeAnalysisRequest(BaseModel):
    student_id: Optional[int] = None
    resume_text: Optional[str] = None
    drive_id: Optional[int] = None

class ResumeAnalysisResponse(BaseModel):
    ats_score: int
    grade: str
    extracted_skills: List[str]
    missing_skills: List[str]
    breakdown: Dict[str, Any]
    star_bullet_rewrites: List[Dict[str, str]]
    recommendations: List[str]
    raw_analysis: str

class MockInterviewTurnRequest(BaseModel):
    question: str
    answer: str
    role: Optional[str] = "software engineer"
    drive_id: Optional[int] = None
    student_id: Optional[int] = None

class MockInterviewTurnResponse(BaseModel):
    score: int  # 0 to 100
    technical_accuracy: str
    communication_clarity: str
    star_format_detected: bool
    feedback: str
    improved_sample_answer: str
    next_question: str

# Drive
class DriveBase(BaseModel):
    company_name: str
    title: str
    role_description: str
    package_ctc: float
    min_cgpa: float = 6.0
    max_backlogs: int = 0
    eligible_departments: List[str] = []
    required_skills: List[str] = []
    preferred_skills: List[str] = []
    drive_date: str = ""
    status: str = "OPEN"

class DriveCreate(DriveBase):
    pass

class DriveResponse(DriveBase):
    id: int
    total_applicants: Optional[int] = 0
    class Config:
        from_attributes = True

# Matching & Explainability
class XaiBreakdown(BaseModel):
    skill_match_percentage: float
    matched_skills: List[str]
    missing_skills: List[str]
    cgpa_contribution: float
    project_contribution: float
    backlog_penalty_deduction: float
    reasons: List[str]
    is_eligible: bool
    eligibility_remarks: List[str]

class CandidateMatchResult(BaseModel):
    student_id: int
    student_name: str
    roll_number: str
    department: str
    cgpa: float
    backlog_count: int
    gender: str
    skills: List[str]
    match_score: float
    rank: int
    is_eligible: bool
    explanation: XaiBreakdown
    status: str = "APPLIED"
    resume_file_data: Optional[str] = None
    resume_file_name: Optional[str] = None
    resume_file_type: Optional[str] = None
    resume_uploaded_at: Optional[datetime.datetime] = None
    ats_score: Optional[int] = None
    email: Optional[str] = None
    has_applied: bool = False
    form_details: Optional[Dict[str, Any]] = None


# Interview Outcome & Feedback
class OutcomeLogCreate(BaseModel):
    application_id: int
    result: str  # 'SELECTED', 'REJECTED'
    failure_category: Optional[str] = "NONE"
    feedback_notes: Optional[str] = ""

class RetrainRequest(BaseModel):
    learning_rate: Optional[float] = 0.05
    notes: Optional[str] = "Triggered via UI"

class CycleAccuracyResponse(BaseModel):
    cycle_number: int
    weight_skill: float
    weight_cgpa: float
    weight_project: float
    weight_backlog_penalty: float
    accuracy: float
    precision: float
    f1_score: float
    sample_count: int
    is_active: bool
    notes: str

# Fairness Audit
class DisparityMetric(BaseModel):
    group_name: str
    total_candidates: int
    shortlisted_candidates: int
    shortlisting_rate: float
    disparity_ratio: float
    violates_80_rule: bool

class FairnessAuditResponse(BaseModel):
    drive_id: int
    company_name: str
    drive_title: str
    total_applicants: int
    total_shortlisted: int
    overall_shortlisting_rate: float
    backlog_disparity: List[DisparityMetric]
    department_disparity: List[DisparityMetric]
    gender_disparity: List[DisparityMetric]
    disparity_alerts: List[str]
    auditor_verdict: str  # 'FAIR', 'MODERATE_BIAS_DETECTED', 'SEVERE_DISPARATE_IMPACT'

class CounterfactualRequest(BaseModel):
    student_id: int
    drive_id: int
    hypothetical_department: Optional[str] = None
    hypothetical_backlogs: Optional[int] = None

class CounterfactualResponse(BaseModel):
    student_id: int
    student_name: str
    original_department: str
    original_backlogs: int
    original_score: float
    original_rank: int
    original_shortlisted: bool
    
    hypothetical_department: str
    hypothetical_backlogs: int
    hypothetical_score: float
    hypothetical_rank: int
    hypothetical_shortlisted: bool
    
    rank_delta: int
    score_delta: float
    bias_detected_message: str

# Roadmap
class LearningResource(BaseModel):
    title: str
    url: str
    platform: str
    type: str  # 'Course', 'Documentation', 'Project', 'Practice'

class RoadmapMilestone(BaseModel):
    skill: str
    priority: str  # 'High', 'Medium', 'Recommended'
    estimated_hours: int
    resources: List[LearningResource]
    suggested_project: str

class CareerRoadmapResponse(BaseModel):
    student_name: str
    target_role: str
    target_company: str
    current_match_score: float
    projected_match_score: float
    missing_critical_skills: List[str]
    learning_path: List[RoadmapMilestone]
    readiness_summary: str

# Email & SMTP System Configuration
class EmailConfigResponse(BaseModel):
    smtp_server: str
    smtp_port: int
    smtp_username: str
    smtp_from: str
    smtp_use_tls: bool
    is_configured: bool
    masked_password: Optional[str] = None

class EmailConfigSaveRequest(BaseModel):
    smtp_server: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_username: str
    smtp_password: str
    smtp_from: Optional[str] = None
    smtp_use_tls: bool = True

class EmailTestRequest(BaseModel):
    to_email: str
    smtp_server: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_from: Optional[str] = None
    smtp_use_tls: Optional[bool] = None

class EmailTestResponse(BaseModel):
    success: bool
    message: str
    detail: Optional[str] = None
