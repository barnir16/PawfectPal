from fastapi import HTTPException, Depends, APIRouter, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.models import (
    MedicalRecordORM,
    PetORM,
    UserORM,
)
from app.schemas.medical_record import (
    MedicalRecordCreate,
    MedicalRecordRead,
    MedicalRecordUpdate,
    MedicalRecordListResponse,
    MedicalRecordSummary,
)
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from datetime import date

router = APIRouter(prefix="/medical-records", tags=["medical-records"])


@router.get("/pet/{pet_id}/", response_model=MedicalRecordListResponse)
def get_pet_medical_records(
    pet_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    record_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Get medical records for a specific pet"""
    # Verify pet ownership
    pet = (
        db.query(PetORM)
        .filter(PetORM.id == pet_id, PetORM.user_id == current_user.id)
        .first()
    )
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    # Build query
    query = db.query(MedicalRecordORM).filter(MedicalRecordORM.pet_id == pet_id)

    if record_type:
        query = query.filter(MedicalRecordORM.record_type == record_type)

    # Get total count
    total = query.count()

    # Apply pagination
    offset = (page - 1) * page_size
    records = (
        query.order_by(MedicalRecordORM.date.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )

    return MedicalRecordListResponse(
        records=[MedicalRecordRead.model_validate(r) for r in records],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("/pet/{pet_id}/", response_model=MedicalRecordRead)
def create_medical_record(
    pet_id: int,
    record: MedicalRecordCreate,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Create a new medical record for a pet"""
    # Verify pet ownership
    pet = (
        db.query(PetORM)
        .filter(PetORM.id == pet_id, PetORM.user_id == current_user.id)
        .first()
    )
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    db_record = MedicalRecordORM(
        pet_id=pet_id,
        record_type=record.record_type,
        title=record.title,
        description=record.description,
        date=record.date,
        veterinarian=record.veterinarian,
        clinic=record.clinic,
        follow_up_date=record.follow_up_date,
        attachments=record.attachments,
        notes=record.notes,
        is_completed=record.is_completed,
    )
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return MedicalRecordRead.model_validate(db_record)


@router.put("/{record_id}/", response_model=MedicalRecordRead)
def update_medical_record(
    record_id: int,
    record: MedicalRecordUpdate,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Update an existing medical record"""
    # Verify record exists and user owns the pet
    db_record = (
        db.query(MedicalRecordORM)
        .join(PetORM)
        .filter(MedicalRecordORM.id == record_id, PetORM.user_id == current_user.id)
        .first()
    )

    if not db_record:
        raise HTTPException(status_code=404, detail="Medical record not found")

    # Update fields
    db_record.record_type = record.record_type
    db_record.title = record.title
    db_record.description = record.description
    db_record.date = record.date
    db_record.veterinarian = record.veterinarian
    db_record.clinic = record.clinic
    db_record.follow_up_date = record.follow_up_date
    db_record.attachments = record.attachments
    db_record.notes = record.notes
    db_record.is_completed = record.is_completed

    db.commit()
    db.refresh(db_record)
    return MedicalRecordRead.model_validate(db_record)


@router.delete("/{record_id}/")
def delete_medical_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Delete a medical record"""
    # Verify record exists and user owns the pet
    db_record = (
        db.query(MedicalRecordORM)
        .join(PetORM)
        .filter(MedicalRecordORM.id == record_id, PetORM.user_id == current_user.id)
        .first()
    )

    if not db_record:
        raise HTTPException(status_code=404, detail="Medical record not found")

    db.delete(db_record)
    db.commit()
    return {"message": "Medical record deleted successfully"}


@router.get("/pet/{pet_id}/summary/", response_model=MedicalRecordSummary)
def get_pet_medical_summary(
    pet_id: int,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Get medical record summary for a pet"""
    # Verify pet ownership
    pet = (
        db.query(PetORM)
        .filter(PetORM.id == pet_id, PetORM.user_id == current_user.id)
        .first()
    )
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    records = db.query(MedicalRecordORM).filter(MedicalRecordORM.pet_id == pet_id).all()

    # Calculate summary statistics
    total_records = len(records)
    vaccination_count = len([r for r in records if r.record_type == "vaccination"])
    surgery_count = len([r for r in records if r.record_type == "surgery"])

    # Find most recent checkup
    checkups = [r for r in records if r.record_type == "checkup"]
    recent_checkup = max([r.date for r in checkups]) if checkups else None

    # Find next follow-up
    future_followups = [
        r.follow_up_date
        for r in records
        if r.follow_up_date and r.follow_up_date > date.today()
    ]
    next_followup = min(future_followups) if future_followups else None

    return MedicalRecordSummary(
        pet_id=pet_id,
        total_records=total_records,
        recent_checkup=recent_checkup,
        next_followup=next_followup,
        vaccination_count=vaccination_count,
        surgery_count=surgery_count,
    )
