from fastapi import HTTPException, Depends, APIRouter
from sqlalchemy.orm import Session
from typing import List
from models import (
    PetORM,
    UserORM,
    list_to_str,
    str_to_list,
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
    return [
        PetRead(
            id=p.id,
            name=p.name,
            breedType=p.breedType,
            breed=p.breed,
            birthDate=p.birthDate,
            age=p.age,
            isBirthdayGiven=bool(p.isBirthdayGiven),
            weightKg=p.weightKg,
            photoUri=p.photoUri,
            healthIssues=str_to_list(p.healthIssues),
            behaviorIssues=str_to_list(p.behaviorIssues),
            lastKnownLatitude=p.lastKnownLatitude,
            lastKnownLongitude=p.lastKnownLongitude,
            lastLocationUpdate=p.lastLocationUpdate,
            isTrackingEnabled=p.isTrackingEnabled,
        )
        for p in pets
    ]


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
        breedType=pet.breedType,
        breed=pet.breed,
        birthDate=pet.birthDate if pet.birthDate else None,
        age=pet.age,
        isBirthdayGiven=int(pet.isBirthdayGiven),
        weightKg=pet.weightKg,
        photoUri=pet.photoUri,
        healthIssues=list_to_str(pet.healthIssues),
        behaviorIssues=list_to_str(pet.behaviorIssues),
        lastKnownLatitude=pet.lastKnownLatitude,
        lastKnownLongitude=pet.lastKnownLongitude,
        lastLocationUpdate=pet.lastLocationUpdate if pet.lastLocationUpdate else None,
        isTrackingEnabled=pet.isTrackingEnabled,
    )
    db.add(db_pet)
    db.commit()
    db.refresh(db_pet)
    return PetRead(
        id=db_pet.id,
        name=db_pet.name,
        breedType=db_pet.breedType,
        breed=db_pet.breed,
        birthDate=db_pet.birthDate,
        age=db_pet.age,
        isBirthdayGiven=bool(db_pet.isBirthdayGiven),
        weightKg=db_pet.weightKg,
        photoUri=db_pet.photoUri,
        healthIssues=str_to_list(db_pet.healthIssues),
        behaviorIssues=str_to_list(db_pet.behaviorIssues),
        lastKnownLatitude=db_pet.lastKnownLatitude,
        lastKnownLongitude=db_pet.lastKnownLongitude,
        lastLocationUpdate=db_pet.lastLocationUpdate,
        isTrackingEnabled=db_pet.isTrackingEnabled,
    )


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
    db_pet.breedType = pet.breedType
    db_pet.breed = pet.breed
    db_pet.birthDate = pet.birthDate
    db_pet.age = pet.age
    db_pet.isBirthdayGiven = int(pet.isBirthdayGiven)
    db_pet.weightKg = pet.weightKg
    db_pet.photoUri = pet.photoUri
    db_pet.healthIssues = list_to_str(pet.healthIssues)
    db_pet.behaviorIssues = list_to_str(pet.behaviorIssues)
    db_pet.lastKnownLatitude = pet.lastKnownLatitude
    db_pet.lastKnownLongitude = pet.lastKnownLongitude
    db_pet.lastLocationUpdate = pet.lastLocationUpdate
    db_pet.isTrackingEnabled = pet.isTrackingEnabled

    db.commit()
    db.refresh(db_pet)

    return PetRead(
        id=db_pet.id,
        name=db_pet.name,
        breedType=db_pet.breedType,
        breed=db_pet.breed,
        birthDate=db_pet.birthDate,
        age=db_pet.age,
        isBirthdayGiven=bool(db_pet.isBirthdayGiven),
        weightKg=db_pet.weightKg,
        photoUri=db_pet.photoUri,
        healthIssues=str_to_list(db_pet.healthIssues),
        behaviorIssues=str_to_list(db_pet.behaviorIssues),
        lastKnownLatitude=db_pet.lastKnownLatitude,
        lastKnownLongitude=db_pet.lastKnownLongitude,
        lastLocationUpdate=db_pet.lastLocationUpdate,
        isTrackingEnabled=db_pet.isTrackingEnabled,
    )


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
