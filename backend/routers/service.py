from fastapi import HTTPException, Depends, APIRouter
from sqlalchemy.orm import Session
from typing import List
from models import (
    PetORM,
    ServiceORM,
    UserORM,
)
from schemas import ServiceCreate, ServiceRead
from dependencies.db import get_db
from dependencies.auth import get_current_user

router = APIRouter(prefix="/service_booking", tags=["service_booking"])


@router.get("/", response_model=List[ServiceRead])
def get_services(
    db: Session = Depends(get_db), current_user: UserORM = Depends(get_current_user)
):
    """Get all services for the authenticated user"""
    services = db.query(ServiceORM).filter(ServiceORM.user_id == current_user.id).all()
    return [ServiceRead.model_validate(s) for s in services]


@router.post("/", response_model=ServiceRead)
def create_service(
    service: ServiceCreate,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Create a new service booking"""
    # Verify pet belongs to user
    pet = (
        db.query(PetORM)
        .filter(PetORM.id == service.pet_id, PetORM.user_id == current_user.id)
        .first()
    )
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    db_service = ServiceORM(
        user_id=current_user.id,
        pet_id=service.pet_id,
        service_type=service.service_type,
        status=service.status,
        start_datetime=service.start_datetime,
        end_datetime=service.end_datetime,
        duration_hours=service.duration_hours,
        price=service.price,
        currency=service.currency,
        pickup_address=service.pickup_address,
        dropoff_address=service.dropoff_address,
        pickup_latitude=service.pickup_latitude,
        pickup_longitude=service.pickup_longitude,
        dropoff_latitude=service.dropoff_latitude,
        dropoff_longitude=service.dropoff_longitude,
        provider_id=service.provider_id,
        provider_notes=service.provider_notes,
        customer_notes=service.customer_notes,
        before_images=service.before_images,
        after_images=service.after_images,
        service_report=service.service_report,
    )
    db.add(db_service)
    db.commit()
    db.refresh(db_service)

    return ServiceRead.model_validate(db_service)
