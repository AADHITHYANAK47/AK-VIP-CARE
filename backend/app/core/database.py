import os
import re
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings

def mask_database_url(url: str) -> str:
    """Masks sensitive password credentials from database URLs for safe display."""
    return re.sub(r":([^:@]+)@", ":****@", url)

def build_engine(database_url: str):
    """Builds an appropriate SQLAlchemy engine based on the connection scheme."""
    normalized_url = database_url
    if normalized_url.startswith("postgres://"):
        normalized_url = normalized_url.replace("postgres://", "postgresql://", 1)

    connect_args = {}
    engine_kwargs = {}

    if normalized_url.startswith("sqlite"):
        connect_args["check_same_thread"] = False
    else:
        # PostgreSQL, Supabase, MySQL pooling, keep-alive, and connection timeout
        connect_args["connect_timeout"] = 5
        engine_kwargs["pool_pre_ping"] = True
        engine_kwargs["pool_recycle"] = 3600

    return create_engine(
        normalized_url,
        connect_args=connect_args,
        **engine_kwargs
    )

def init_engine_with_fallback(primary_url: str):
    """Safely builds an engine, falling back to local SQLite if the remote DB cannot be reached."""
    try:
        eng = build_engine(primary_url)
        with eng.connect() as conn:
            conn.execute(text("SELECT 1"))
        return eng, primary_url
    except Exception as e:
        if not primary_url.startswith("sqlite"):
            fallback_url = "sqlite:///./careerlens.db"
            print(f"\n[WARNING] Could not connect to remote database ({mask_database_url(primary_url)}): {e}")
            print(f"[INFO] Automatically falling back to local SQLite ({fallback_url}) so CareerLens runs smoothly.\n")
            eng = build_engine(fallback_url)
            return eng, fallback_url
        raise e

engine, active_url = init_engine_with_fallback(settings.DATABASE_URL)
settings.DATABASE_URL = active_url
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_database_info() -> dict:
    """Returns metadata about the active database connection."""
    raw_url = settings.DATABASE_URL
    dialect = "sqlite"
    if "postgres" in raw_url:
        dialect = "postgresql"
    elif "mysql" in raw_url:
        dialect = "mysql"

    healthy = False
    error_msg = None
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            healthy = True
    except Exception as e:
        error_msg = str(e)

    return {
        "dialect": dialect,
        "is_custom_database": not raw_url.endswith("careerlens.db"),
        "masked_url": mask_database_url(raw_url),
        "is_healthy": healthy,
        "error": error_msg,
        "schema_status": "synced" if healthy else "error"
    }

def test_database_connection(candidate_url: str) -> dict:
    """Safely tests whether a candidate database URL can be connected to."""
    test_url = candidate_url.strip()
    if test_url.startswith("postgres://"):
        test_url = test_url.replace("postgres://", "postgresql://", 1)

    try:
        temp_engine = build_engine(test_url)
        with temp_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {
            "success": True,
            "message": "Connection established successfully!",
            "masked_url": mask_database_url(test_url)
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Connection failed: {str(e)}",
            "masked_url": mask_database_url(test_url)
        }

def reconnect_engine(new_database_url: str) -> dict:
    """
    Dynamically reconnects the global engine and SessionLocal to a new database URL,
    and initializes tables if needed.
    """
    global engine, SessionLocal
    normalized_url = new_database_url.strip()
    if normalized_url.startswith("postgres://"):
        normalized_url = normalized_url.replace("postgres://", "postgresql://", 1)

    try:
        new_engine = build_engine(normalized_url)
        with new_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        
        # Test passed; bind tables and swap active engine
        Base.metadata.create_all(bind=new_engine)
        engine = new_engine
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        settings.DATABASE_URL = normalized_url

        return {
            "success": True,
            "message": "Engine reconnected successfully and schema verified.",
            "masked_url": mask_database_url(normalized_url)
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Failed to switch database: {str(e)}",
            "masked_url": mask_database_url(normalized_url)
        }


