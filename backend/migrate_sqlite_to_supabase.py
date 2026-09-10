"""
Migrates all tables and records from local SQLite (careerlens.db)
directly to production Supabase PostgreSQL.
Includes primary key sequence resets and idempotency checks.
"""
import sys
import os
import json
import sqlite3
import datetime
from sqlalchemy import text
from sqlalchemy.orm import Session

# Ensure UTF-8 output on Windows
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", line_buffering=True)
if sys.stderr and hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", line_buffering=True)

from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
import app.models.db_models as models

SQLITE_PATH = os.path.join(os.path.dirname(__file__), "careerlens.db")
if not os.path.exists(SQLITE_PATH):
    # Try root folder
    SQLITE_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "careerlens.db")

def parse_json(val):
    if val is None:
        return None
    if isinstance(val, (dict, list)):
        return val
    try:
        return json.loads(val)
    except Exception:
        return val

def parse_datetime(val):
    if not val:
        return None
    if isinstance(val, datetime.datetime):
        return val
    try:
        # SQLite often formats as 'YYYY-MM-DD HH:MM:SS.ffffff' or with T
        cleaned = val.replace("T", " ")
        if "." in cleaned:
            return datetime.datetime.strptime(cleaned[:26], "%Y-%m-%d %H:%M:%S.%f")
        return datetime.datetime.strptime(cleaned[:19], "%Y-%m-%d %H:%M:%S")
    except Exception:
        return None

def migrate():
    print("=" * 60)
    print("🚀 CareerLens AI: SQLite -> Supabase Migration")
    print("=" * 60)
    print(f"[*] SQLite source: {SQLITE_PATH}")
    print(f"[*] Target Supabase Database: {settings.DATABASE_URL.split('@')[-1] if '@' in settings.DATABASE_URL else settings.DATABASE_URL}")

    if not os.path.exists(SQLITE_PATH):
        print(f"[!] Source SQLite database not found at {SQLITE_PATH}")
        return

    # 1. Create tables in Supabase
    print("\n[*] Step 1: Creating database schema in Supabase...")
    Base.metadata.create_all(bind=engine)
    print("    Schema verified / created successfully.")

    # 2. Connect to SQLite
    print("\n[*] Step 2: Reading data from SQLite...")
    sq_conn = sqlite3.connect(SQLITE_PATH)
    sq_conn.row_factory = sqlite3.Row
    sq_cur = sq_conn.cursor()

    pg_db: Session = SessionLocal()

    try:
        # ----------------------------------------------------
        # Users
        # ----------------------------------------------------
        sq_cur.execute("SELECT * FROM users")
        user_rows = sq_cur.fetchall()
        print(f"[*] Migrating {len(user_rows)} users...")
        for r in user_rows:
            existing = pg_db.query(models.User).filter_by(id=r["id"]).first()
            if not existing:
                existing_email = pg_db.query(models.User).filter_by(email=r["email"]).first()
                if not existing_email:
                    u = models.User(
                        id=r["id"],
                        email=r["email"],
                        name=r["name"],
                        role=r["role"],
                        is_verified=bool(r["is_verified"]),
                        last_login=parse_datetime(r["last_login"]),
                        password_hash=r["password_hash"],
                        created_at=parse_datetime(r["created_at"]) or datetime.datetime.utcnow()
                    )
                    pg_db.add(u)
        pg_db.commit()
        print(f"    Users migrated successfully.")

        # ----------------------------------------------------
        # Placement Drives
        # ----------------------------------------------------
        sq_cur.execute("SELECT * FROM placement_drives")
        drive_rows = sq_cur.fetchall()
        print(f"[*] Migrating {len(drive_rows)} placement drives...")
        for r in drive_rows:
            existing = pg_db.query(models.PlacementDrive).filter_by(id=r["id"]).first()
            if not existing:
                d = models.PlacementDrive(
                    id=r["id"],
                    company_name=r["company_name"],
                    title=r["title"],
                    role_description=r["role_description"],
                    package_ctc=float(r["package_ctc"]),
                    min_cgpa=float(r["min_cgpa"]) if r["min_cgpa"] is not None else 6.0,
                    max_backlogs=int(r["max_backlogs"]) if r["max_backlogs"] is not None else 0,
                    eligible_departments=parse_json(r["eligible_departments"]) or [],
                    required_skills=parse_json(r["required_skills"]) or [],
                    preferred_skills=parse_json(r["preferred_skills"]) or [],
                    drive_date=r["drive_date"] or "",
                    status=r["status"] or "OPEN",
                    created_at=parse_datetime(r["created_at"]) or datetime.datetime.utcnow()
                )
                pg_db.add(d)
        pg_db.commit()
        print(f"    Placement drives migrated successfully.")

        # ----------------------------------------------------
        # Students
        # ----------------------------------------------------
        sq_cur.execute("SELECT * FROM students")
        student_rows = sq_cur.fetchall()
        print(f"[*] Migrating {len(student_rows)} students...")
        for r in student_rows:
            existing = pg_db.query(models.Student).filter_by(id=r["id"]).first()
            if not existing:
                s = models.Student(
                    id=r["id"],
                    user_id=r["user_id"],
                    roll_number=r["roll_number"],
                    name=r["name"],
                    email=r["email"],
                    department=r["department"],
                    cgpa=float(r["cgpa"]),
                    backlog_count=int(r["backlog_count"]) if r["backlog_count"] is not None else 0,
                    gender=r["gender"],
                    skills=parse_json(r["skills"]) or [],
                    projects=parse_json(r["projects"]) or [],
                    certifications=parse_json(r["certifications"]) or [],
                    resume_text=r["resume_text"] or "",
                    profile_strength=int(r["profile_strength"]) if r["profile_strength"] is not None else 50,
                    resume_file_data=r["resume_file_data"],
                    resume_file_name=r["resume_file_name"],
                    resume_file_type=r["resume_file_type"],
                    resume_uploaded_at=parse_datetime(r["resume_uploaded_at"]),
                    ats_score=int(r["ats_score"]) if r["ats_score"] is not None else 0,
                    ats_breakdown=parse_json(r["ats_breakdown"]) or {},
                    created_at=parse_datetime(r["created_at"]) or datetime.datetime.utcnow()
                )
                pg_db.add(s)
        pg_db.commit()
        print(f"    Students migrated successfully.")

        # ----------------------------------------------------
        # Applications
        # ----------------------------------------------------
        sq_cur.execute("SELECT * FROM applications")
        app_rows = sq_cur.fetchall()
        print(f"[*] Migrating {len(app_rows)} applications...")
        for r in app_rows:
            existing = pg_db.query(models.Application).filter_by(id=r["id"]).first()
            if not existing:
                a = models.Application(
                    id=r["id"],
                    student_id=r["student_id"],
                    drive_id=r["drive_id"],
                    match_score=float(r["match_score"]) if r["match_score"] is not None else 0.0,
                    match_explanation=parse_json(r["match_explanation"]) or {},
                    status=r["status"] or "APPLIED",
                    applied_at=parse_datetime(r["applied_at"]) or datetime.datetime.utcnow()
                )
                pg_db.add(a)
        pg_db.commit()
        print(f"    Applications migrated successfully.")

        # ----------------------------------------------------
        # Interview Outcomes
        # ----------------------------------------------------
        sq_cur.execute("SELECT * FROM interview_outcomes")
        outcome_rows = sq_cur.fetchall()
        print(f"[*] Migrating {len(outcome_rows)} interview outcomes...")
        for r in outcome_rows:
            existing = pg_db.query(models.InterviewOutcome).filter_by(id=r["id"]).first()
            if not existing:
                o = models.InterviewOutcome(
                    id=r["id"],
                    application_id=r["application_id"],
                    student_id=r["student_id"],
                    drive_id=r["drive_id"],
                    result=r["result"],
                    failure_category=r["failure_category"] or "NONE",
                    feedback_notes=r["feedback_notes"] or "",
                    features_snapshot=parse_json(r["features_snapshot"]) or {},
                    logged_at=parse_datetime(r["logged_at"]) or datetime.datetime.utcnow()
                )
                pg_db.add(o)
        pg_db.commit()
        print(f"    Interview outcomes migrated successfully.")

        # ----------------------------------------------------
        # Model Weight History
        # ----------------------------------------------------
        sq_cur.execute("SELECT * FROM model_weight_history")
        weight_rows = sq_cur.fetchall()
        print(f"[*] Migrating {len(weight_rows)} model weight history records...")
        for r in weight_rows:
            existing = pg_db.query(models.ModelWeightHistory).filter_by(id=r["id"]).first()
            if not existing:
                w = models.ModelWeightHistory(
                    id=r["id"],
                    cycle_number=r["cycle_number"],
                    weight_skill=float(r["weight_skill"]),
                    weight_cgpa=float(r["weight_cgpa"]),
                    weight_project=float(r["weight_project"]),
                    weight_backlog_penalty=float(r["weight_backlog_penalty"]),
                    intercept=float(r["intercept"]) if r["intercept"] is not None else 0.0,
                    accuracy=float(r["accuracy"]),
                    precision=float(r["precision"]) if r["precision"] is not None else 0.0,
                    f1_score=float(r["f1_score"]) if r["f1_score"] is not None else 0.0,
                    sample_count=int(r["sample_count"]) if r["sample_count"] is not None else 0,
                    is_active=bool(r["is_active"]),
                    notes=r["notes"] or "",
                    created_at=parse_datetime(r["created_at"]) or datetime.datetime.utcnow()
                )
                pg_db.add(w)
        pg_db.commit()
        print(f"    Model weight history migrated successfully.")

        # ----------------------------------------------------
        # Fairness Audit Logs
        # ----------------------------------------------------
        sq_cur.execute("SELECT * FROM fairness_audit_logs")
        audit_rows = sq_cur.fetchall()
        if audit_rows:
            print(f"[*] Migrating {len(audit_rows)} fairness audit logs...")
            for r in audit_rows:
                existing = pg_db.query(models.FairnessAuditLog).filter_by(id=r["id"]).first()
                if not existing:
                    f = models.FairnessAuditLog(
                        id=r["id"],
                        drive_id=r["drive_id"],
                        total_applicants=r["total_applicants"],
                        total_shortlisted=r["total_shortlisted"],
                        disparity_backlog=float(r["disparity_backlog"]),
                        disparity_department=parse_json(r["disparity_department"]) or {},
                        disparity_gender=float(r["disparity_gender"]),
                        violations=parse_json(r["violations"]) or [],
                        generated_at=parse_datetime(r["generated_at"]) or datetime.datetime.utcnow()
                    )
                    pg_db.add(f)
            pg_db.commit()
            print(f"    Fairness audit logs migrated.")

        # ----------------------------------------------------
        # Step 3: Reset Postgres Sequences
        # ----------------------------------------------------
        print("\n[*] Step 3: Synchronizing PostgreSQL auto-increment sequences...")
        tables_to_sync = [
            "users",
            "placement_drives",
            "students",
            "applications",
            "interview_outcomes",
            "model_weight_history",
            "fairness_audit_logs"
        ]
        with engine.begin() as conn:
            for tbl in tables_to_sync:
                try:
                    res = conn.execute(text(f"""
                        SELECT setval(
                            pg_get_serial_sequence('{tbl}', 'id'),
                            COALESCE((SELECT MAX(id) FROM {tbl}), 1)
                        );
                    """))
                    print(f"    Sequence for '{tbl}' synced.")
                except Exception as seq_err:
                    print(f"    Notice on sequence for '{tbl}': {seq_err}")

        # Verification counts
        print("\n" + "=" * 60)
        print("✅ MIGRATION SUMMARY & VERIFICATION (SUPABASE POSTGRESQL)")
        print("=" * 60)
        for model_cls in [
            models.User,
            models.PlacementDrive,
            models.Student,
            models.Application,
            models.InterviewOutcome,
            models.ModelWeightHistory,
            models.FairnessAuditLog
        ]:
            count = pg_db.query(model_cls).count()
            print(f"  • {model_cls.__tablename__:<25}: {count} records in Supabase")

        print("\n🎉 Migration completed successfully! Data is now live in Supabase.")

    except Exception as e:
        pg_db.rollback()
        print(f"\n[ERROR] Migration failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        sq_conn.close()
        pg_db.close()

if __name__ == "__main__":
    migrate()
