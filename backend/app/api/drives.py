from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.db_models import PlacementDrive, Application
from app.models.schemas import DriveResponse, DriveCreate

router = APIRouter(prefix="/drives", tags=["Placement Drives"])

@router.get("", response_model=List[DriveResponse])
def list_drives(db: Session = Depends(get_db)):
    drives = db.query(PlacementDrive).order_by(PlacementDrive.id.desc()).all()
    results = []
    for d in drives:
        cnt = db.query(Application).filter(Application.drive_id == d.id).count()
        results.append(DriveResponse(
            id=d.id,
            company_name=d.company_name,
            title=d.title,
            role_description=d.role_description,
            package_ctc=d.package_ctc,
            min_cgpa=d.min_cgpa,
            max_backlogs=d.max_backlogs,
            eligible_departments=d.eligible_departments or [],
            required_skills=d.required_skills or [],
            preferred_skills=d.preferred_skills or [],
            drive_date=d.drive_date or "",
            status=d.status,
            total_applicants=cnt
        ))
    return results

@router.get("/{drive_id}", response_model=DriveResponse)
def get_drive(drive_id: int, db: Session = Depends(get_db)):
    d = db.query(PlacementDrive).filter(PlacementDrive.id == drive_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Drive not found")
    cnt = db.query(Application).filter(Application.drive_id == d.id).count()
    return DriveResponse(
        id=d.id,
        company_name=d.company_name,
        title=d.title,
        role_description=d.role_description,
        package_ctc=d.package_ctc,
        min_cgpa=d.min_cgpa,
        max_backlogs=d.max_backlogs,
        eligible_departments=d.eligible_departments or [],
        required_skills=d.required_skills or [],
        preferred_skills=d.preferred_skills or [],
        drive_date=d.drive_date or "",
        status=d.status,
        total_applicants=cnt
    )

@router.post("", response_model=DriveResponse)
def create_drive(data: DriveCreate, db: Session = Depends(get_db)):
    drive = PlacementDrive(
        company_name=data.company_name,
        title=data.title,
        role_description=data.role_description,
        package_ctc=data.package_ctc,
        min_cgpa=data.min_cgpa,
        max_backlogs=data.max_backlogs,
        eligible_departments=data.eligible_departments,
        required_skills=data.required_skills,
        preferred_skills=data.preferred_skills,
        drive_date=data.drive_date,
        status=data.status
    )
    db.add(drive)
    db.commit()
    db.refresh(drive)
    return DriveResponse(
        id=drive.id,
        company_name=drive.company_name,
        title=drive.title,
        role_description=drive.role_description,
        package_ctc=drive.package_ctc,
        min_cgpa=drive.min_cgpa,
        max_backlogs=drive.max_backlogs,
        eligible_departments=drive.eligible_departments or [],
        required_skills=drive.required_skills or [],
        preferred_skills=drive.preferred_skills or [],
        drive_date=drive.drive_date or "",
        status=drive.status,
        total_applicants=0
    )
