from fastapi import HTTPException, Depends, APIRouter
from sqlalchemy.orm import Session
from typing import List
from models import (
    PetORM,
    UserORM,
)
from schemas.pet import PetCreate, PetRead, PetUpdate
from dependencies.db import get_db
from dependencies.auth import get_current_user

router = APIRouter(prefix="/pets", tags=["pets"])


@router.get("/", response_model=List[PetRead])
def get_pets(
    db: Session = Depends(get_db), current_user: UserORM = Depends(get_current_user)
):
    """Get all pets for the authenticated user"""
    pets = db.query(PetORM).filter(PetORM.user_id == current_user.id).all()
    return [PetRead.model_validate(p) for p in pets]


@router.post("/", response_model=PetRead)
def create_pet(
    pet: PetCreate,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Create a new pet"""
    db_pet = PetORM(
        user_id=current_user.id,
        name=pet.name,
        breed_type=pet.breed_type,
        breed=pet.breed,
        birth_date=pet.birth_date if pet.birth_date else None,
        age=pet.age,
        is_birthday_given=int(pet.is_birthday_given),
        weight_kg=pet.weight_kg,
        photo_uri=pet.photo_uri,
        health_issues=pet.health_issues,
        behavior_issues=pet.behavior_issues,
        last_known_latitude=pet.last_known_latitude,
        last_known_longitude=pet.last_known_longitude,
        last_location_update=pet.last_location_update
        if pet.last_location_update
        else None,
        is_tracking_enabled=pet.is_tracking_enabled,
    )
    db.add(db_pet)
    db.commit()
    db.refresh(db_pet)
    return PetRead.model_validate(db_pet)


@router.put("/{pet_id}", response_model=PetRead)
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

    db_pet.name = pet.name
    db_pet.breed_type = pet.breed_type
    db_pet.breed = pet.breed
    db_pet.birth_date = pet.birth_date
    db_pet.age = pet.age
    db_pet.is_birthday_given = int(pet.is_birthday_given)
    db_pet.weight_kg = pet.weight_kg
    db_pet.photo_uri = pet.photo_uri
    db_pet.health_issues = pet.health_issues
    db_pet.behavior_issues = pet.behavior_issues
    db_pet.last_known_latitude = pet.last_known_latitude
    db_pet.last_known_longitude = pet.last_known_longitude
    db_pet.last_location_update = pet.last_location_update
    db_pet.is_tracking_enabled = pet.is_tracking_enabled

    db.commit()
    db.refresh(db_pet)

    return PetRead.model_validate(db_pet)


@router.delete("/{pet_id}")
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
