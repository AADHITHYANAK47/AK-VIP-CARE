from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db, get_database_info, test_database_connection, reconnect_engine, engine, Base
from app.models.schemas import DatabaseInfoResponse, DatabaseTestRequest, DatabaseTestResponse

router = APIRouter(prefix="/system", tags=["System & Database"])

@router.get("/database-status", response_model=DatabaseInfoResponse)
def get_db_status():
    """Returns the current database engine status, dialect, and health."""
    return get_database_info()

@router.post("/test-db-connection", response_model=DatabaseTestResponse)
def test_db_connection_endpoint(payload: DatabaseTestRequest):
    """
    Tests whether the user's custom database URL (PostgreSQL, Supabase, MySQL, SQLite)
    is reachable and valid.
    """
    if not payload.database_url or not payload.database_url.strip():
        raise HTTPException(status_code=400, detail="Database URL cannot be empty.")
    
    result = test_database_connection(payload.database_url.strip())
    return DatabaseTestResponse(
        success=result["success"],
        message=result["message"],
        masked_url=result["masked_url"]
    )

@router.post("/reconnect-database", response_model=DatabaseTestResponse)
def reconnect_database_endpoint(payload: DatabaseTestRequest):
    """
    Switches active database engine dynamically and synchronizes schema.
    """
    if not payload.database_url or not payload.database_url.strip():
        raise HTTPException(status_code=400, detail="Database URL cannot be empty.")

    result = reconnect_engine(payload.database_url.strip())
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])

    return DatabaseTestResponse(
        success=result["success"],
        message=result["message"],
        masked_url=result["masked_url"]
    )

@router.post("/init-tables")
def init_tables_endpoint():
    """Initializes tables on the active database engine."""
    try:
        Base.metadata.create_all(bind=engine)
        return {"success": True, "message": "Database tables verified/created successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to initialize tables: {str(e)}")

