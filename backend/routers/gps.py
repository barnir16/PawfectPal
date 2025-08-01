from fastapi import HTTPException, Depends, APIRouter
from sqlalchemy.orm import Session
from typing import List
from models import (
    PetORM,
    LocationHistoryORM,
    UserORM,
)
from schemas import LocationHistory
from datetime import datetime
from dependencies.db import get_db
from dependencies.auth import get_current_user

router = APIRouter(prefix="/gps", tags=["gps"])


@router.post("/pets/{pet_id}/location", response_model=LocationHistory)
def update_pet_location(
    pet_id: int,
    location: LocationHistory,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Update pet's GPS location"""
    # Verify pet belongs to user
    pet = (
        db.query(PetORM)
        .filter(PetORM.id == pet_id, PetORM.user_id == current_user.id)
        .first()
    )
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    # Create location history entry
    db_location = LocationHistoryORM(
        pet_id=pet_id,
        latitude=location.latitude,
        longitude=location.longitude,
        timestamp=datetime.fromisoformat(location.timestamp),
        accuracy=location.accuracy,
        speed=location.speed,
        altitude=location.altitude,
    )
    db.add(db_location)

    # Update pet's last known location
    pet.lastKnownLatitude = location.latitude
    pet.lastKnownLongitude = location.longitude
    pet.lastLocationUpdate = datetime.fromisoformat(location.timestamp)

    db.commit()
    db.refresh(db_location)

    return LocationHistory(
        id=db_location.id,
        pet_id=db_location.pet_id,
        latitude=db_location.latitude,
        longitude=db_location.longitude,
        timestamp=db_location.timestamp.isoformat(),
        accuracy=db_location.accuracy,
        speed=db_location.speed,
        altitude=db_location.altitude,
    )


@router.get("/pets/{pet_id}/location-history", response_model=List[LocationHistory])
def get_pet_location_history(
    pet_id: int,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Get pet's location history"""
    # Verify pet belongs to user
    pet = (
        db.query(PetORM)
        .filter(PetORM.id == pet_id, PetORM.user_id == current_user.id)
        .first()
    )
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    locations = (
        db.query(LocationHistoryORM)
        .filter(LocationHistoryORM.pet_id == pet_id)
        .order_by(LocationHistoryORM.timestamp.desc())
        .limit(limit)
        .all()
    )

    return [
        LocationHistory(
            id=loc.id,
            pet_id=loc.pet_id,
            latitude=loc.latitude,
            longitude=loc.longitude,
            timestamp=loc.timestamp.isoformat(),
            accuracy=loc.accuracy,
            speed=loc.speed,
            altitude=loc.altitude,
        )
        for loc in locations
    ]
