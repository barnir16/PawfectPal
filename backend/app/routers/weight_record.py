import logging
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .pet import PetORM
from app.dependencies.auth import get_current_user
from app.dependencies.db import get_db
from app.models.user import UserORM
from app.models.weight_record import WeightRecordORM
from app.schemas.weight_record import (
    WeightRecordCreate,
    WeightRecordResponse,
    WeightRecordUpdate,
    WeightRecordWithPet,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/weight-records", tags=["Weight Records"])


@router.get("/", response_model=List[WeightRecordWithPet])
async def get_all_weight_records(
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
    limit: Optional[int] = 100,
    offset: Optional[int] = 0,
):
    """Get all weight records for the current user's pets."""
    try:
        user_pets = db.query(PetORM).filter(PetORM.user_id == current_user.id).all()
        pet_ids = [pet.id for pet in user_pets]

        if not pet_ids:
            return []

        weight_records = (
            db.query(WeightRecordORM)
            .filter(WeightRecordORM.pet_id.in_(pet_ids))
            .order_by(WeightRecordORM.date.desc())
            .limit(limit)
            .offset(offset)
            .all()
        )

        result = []
        for record in weight_records:
            pet = next((candidate for candidate in user_pets if candidate.id == record.pet_id), None)
            if pet:
                result.append(
                    WeightRecordWithPet(
                        id=record.id,
                        pet_id=record.pet_id,
                        weight=record.weight,
                        weight_unit=record.weight_unit,
                        date=record.date,
                        notes=record.notes,
                        source=record.source,
                        created_at=record.created_at,
                        updated_at=record.updated_at,
                        pet_name=pet.name,
                        pet_type=pet.breed_type,
                    )
                )

        return result
    except Exception:
        logger.exception("Failed to fetch weight records for user %s", current_user.id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch weight records",
        )


@router.get("/pet/{pet_id}/", response_model=List[WeightRecordResponse])
async def get_weight_records_by_pet(
    pet_id: int,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
    limit: Optional[int] = 100,
    offset: Optional[int] = 0,
):
    """Get weight records for a specific pet."""
    try:
        pet = (
            db.query(PetORM)
            .filter(PetORM.id == pet_id, PetORM.user_id == current_user.id)
            .first()
        )

        if not pet:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pet not found or access denied",
            )

        return (
            db.query(WeightRecordORM)
            .filter(WeightRecordORM.pet_id == pet_id)
            .order_by(WeightRecordORM.date.desc())
            .limit(limit)
            .offset(offset)
            .all()
        )
    except HTTPException:
        raise
    except Exception:
        logger.exception(
            "Failed to fetch weight records for pet %s and user %s",
            pet_id,
            current_user.id,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch weight records",
        )


@router.get("/pet/{pet_id}/range/", response_model=List[WeightRecordResponse])
async def get_weight_records_by_date_range(
    pet_id: int,
    start_date: datetime,
    end_date: datetime,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Get weight records for a specific pet within a date range."""
    try:
        pet = (
            db.query(PetORM)
            .filter(PetORM.id == pet_id, PetORM.user_id == current_user.id)
            .first()
        )

        if not pet:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pet not found or access denied",
            )

        return (
            db.query(WeightRecordORM)
            .filter(
                WeightRecordORM.pet_id == pet_id,
                WeightRecordORM.date >= start_date,
                WeightRecordORM.date <= end_date,
            )
            .order_by(WeightRecordORM.date.asc())
            .all()
        )
    except HTTPException:
        raise
    except Exception:
        logger.exception(
            "Failed to fetch weight records by range for pet %s and user %s",
            pet_id,
            current_user.id,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch weight records",
        )


@router.post(
    "/", response_model=WeightRecordResponse, status_code=status.HTTP_201_CREATED
)
async def create_weight_record(
    weight_record: WeightRecordCreate,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Create a new weight record."""
    try:
        pet = (
            db.query(PetORM)
            .filter(
                PetORM.id == weight_record.pet_id,
                PetORM.user_id == current_user.id,
            )
            .first()
        )

        if not pet:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pet not found or access denied",
            )

        db_weight_record = WeightRecordORM(
            pet_id=weight_record.pet_id,
            weight=weight_record.weight,
            weight_unit=weight_record.weight_unit,
            date=weight_record.date,
            notes=weight_record.notes,
            source=weight_record.source,
        )

        db.add(db_weight_record)
        db.commit()
        db.refresh(db_weight_record)
        return db_weight_record
    except HTTPException:
        raise
    except Exception:
        db.rollback()
        logger.exception(
            "Failed to create weight record for pet %s and user %s",
            weight_record.pet_id,
            current_user.id,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create weight record",
        )


@router.put("/{record_id}/", response_model=WeightRecordResponse)
async def update_weight_record(
    record_id: int,
    weight_record_update: WeightRecordUpdate,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Update an existing weight record."""
    try:
        db_weight_record = (
            db.query(WeightRecordORM).filter(WeightRecordORM.id == record_id).first()
        )

        if not db_weight_record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Weight record not found",
            )

        pet = (
            db.query(PetORM)
            .filter(
                PetORM.id == db_weight_record.pet_id,
                PetORM.user_id == current_user.id,
            )
            .first()
        )

        if not pet:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this weight record",
            )

        update_data = weight_record_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
          setattr(db_weight_record, field, value)

        db_weight_record.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_weight_record)
        return db_weight_record
    except HTTPException:
        raise
    except Exception:
        db.rollback()
        logger.exception(
            "Failed to update weight record %s for user %s",
            record_id,
            current_user.id,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update weight record",
        )


@router.delete("/{record_id}/", status_code=status.HTTP_204_NO_CONTENT)
async def delete_weight_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Delete a weight record."""
    try:
        db_weight_record = (
            db.query(WeightRecordORM).filter(WeightRecordORM.id == record_id).first()
        )

        if not db_weight_record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Weight record not found",
            )

        pet = (
            db.query(PetORM)
            .filter(
                PetORM.id == db_weight_record.pet_id,
                PetORM.user_id == current_user.id,
            )
            .first()
        )

        if not pet:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this weight record",
            )

        db.delete(db_weight_record)
        db.commit()
        return None
    except HTTPException:
        raise
    except Exception:
        db.rollback()
        logger.exception(
            "Failed to delete weight record %s for user %s",
            record_id,
            current_user.id,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete weight record",
        )
