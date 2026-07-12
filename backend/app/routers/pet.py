from datetime import datetime

from fastapi import HTTPException, Depends, APIRouter
from .medical_record import MedicalRecordORM
from sqlalchemy.orm import Session
from typing import List
from app.models import (
    PetORM,
    UserORM,
    VaccinationORM,
)
from app.models.weight_record import WeightRecordORM
from app.schemas.pet import PetCreate, PetRead, PetUpdate
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/pets", tags=["pets"])


# Explicit OPTIONS handler for CORS preflight
@router.options("/")
def pets_options():
    return {"message": "OK"}


@router.get("/", response_model=List[PetRead])
def get_pets(
    db: Session = Depends(get_db), current_user: UserORM = Depends(get_current_user)
):
    """Get all pets for the authenticated user"""
    pets = db.query(PetORM).filter(PetORM.user_id == current_user.id).all()
    return [PetRead.model_validate(p) for p in pets]


@router.get("/{pet_id}/", response_model=PetRead)
def get_pet(
    pet_id: int,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Get a specific pet by ID"""
    db_pet = (
        db.query(PetORM)
        .filter(PetORM.id == pet_id, PetORM.user_id == current_user.id)
        .first()
    )
    if not db_pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    return PetRead.model_validate(db_pet)


@router.post("/", response_model=PetRead)
def create_pet(
    pet: PetCreate,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Create a new pet"""
    try:
        db_pet = PetORM(
            user_id=current_user.id,
            name=pet.name or "",
            breed_type=pet.breed_type or "other",
            breed=pet.breed or "",
            birth_date=pet.birth_date if pet.birth_date else None,
            age=pet.age,
            is_birthday_given=pet.is_birthday_given
            if pet.is_birthday_given is not None
            else False,
            weight_kg=pet.weight_kg,
            photo_uri=pet.photo_uri,
            health_issues=pet.health_issues or "",
            behavior_issues=pet.behavior_issues or "",
            # Additional fields
            gender=pet.gender or "unknown",
            weight_unit=pet.weight_unit or "kg",
            color=pet.color,
            microchip_number=pet.microchip_number,
            is_neutered=pet.is_neutered or False,
            is_vaccinated=pet.is_vaccinated or False,
            is_microchipped=pet.is_microchipped or False,
            notes=pet.notes,
            # GPS tracking
            last_known_latitude=pet.last_known_latitude,
            last_known_longitude=pet.last_known_longitude,
            last_location_update=pet.last_location_update
            if pet.last_location_update
            else None,
            is_tracking_enabled=pet.is_tracking_enabled or False,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error creating pet: {str(e)}")
    db.add(db_pet)
    db.commit()
    db.refresh(db_pet)
    return PetRead.model_validate(db_pet)


@router.put("/{pet_id}/", response_model=PetRead)
def update_pet(
    pet_id: int,
    pet: PetUpdate,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Update an existing pet"""
    db_pet = (
        db.query(PetORM)
        .filter(PetORM.id == pet_id, PetORM.user_id == current_user.id)
        .first()
    )
    if not db_pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    previous_weight = db_pet.weight_kg

    # Only touch fields the client actually sent - PetUpdate has everything
    # Optional so a partial PUT shouldn't be able to null out the rest of
    # the pet (matches how update_service_request / update_marketplace_post
    # already do this).
    update_data = pet.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_pet, field, value)

    new_weight = update_data.get("weight_kg", previous_weight)

    # Keep weight tracking history consistent when the pet profile weight changes.
    if "weight_kg" in update_data and new_weight is not None and new_weight != previous_weight:
        db.add(
            WeightRecordORM(
                pet_id=db_pet.id,
                weight=new_weight,
                weight_unit=update_data.get("weight_unit") or db_pet.weight_unit or "kg",
                date=datetime.utcnow(),
                notes="Auto-recorded from pet profile update",
                source="auto",
            )
        )

    db.commit()
    db.refresh(db_pet)

    return PetRead.model_validate(db_pet)


@router.delete("/{pet_id}/")
def delete_pet(
    pet_id: int,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Delete a pet"""
    db_pet = (
        db.query(PetORM)
        .filter(PetORM.id == pet_id, PetORM.user_id == current_user.id)
        .first()
    )
    if not db_pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    db.delete(db_pet)
    db.commit()
    return {"message": "Pet deleted successfully"}
