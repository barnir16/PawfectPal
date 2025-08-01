from fastapi import HTTPException, Depends, APIRouter
from sqlalchemy.orm import Session
from typing import List
from models import (
    PetORM,
    ServiceORM,
    UserORM,
    json_to_list,
    list_to_json,
    ServiceType,
    ServiceStatus,
)
from schemas import Service
from datetime import datetime
from dependencies.db import get_db
from dependencies.auth import get_current_user

router = APIRouter(prefix="/service_booking", tags=["service_booking"])


@router.get("/", response_model=List[Service])
def get_services(
    db: Session = Depends(get_db), current_user: UserORM = Depends(get_current_user)
):
    """Get all services for the authenticated user"""
    services = db.query(ServiceORM).filter(ServiceORM.user_id == current_user.id).all()
    return [
        Service(
            id=s.id,
            pet_id=s.pet_id,
            service_type=ServiceType(s.service_type),
            status=ServiceStatus(s.status),
            start_datetime=s.start_datetime.isoformat(),
            end_datetime=s.end_datetime.isoformat() if s.end_datetime else None,
            duration_hours=s.duration_hours,
            price=s.price,
            currency=s.currency,
            pickup_address=s.pickup_address,
            dropoff_address=s.dropoff_address,
            pickup_latitude=s.pickup_latitude,
            pickup_longitude=s.pickup_longitude,
            dropoff_latitude=s.dropoff_latitude,
            dropoff_longitude=s.dropoff_longitude,
            provider_id=s.provider_id,
            provider_notes=s.provider_notes,
            customer_notes=s.customer_notes,
            before_images=json_to_list(s.before_images),
            after_images=json_to_list(s.after_images),
            service_report=s.service_report,
        )
        for s in services
    ]


@router.post("/", response_model=Service)
def create_service(
    service: Service,
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
        start_datetime=datetime.fromisoformat(service.start_datetime),
        end_datetime=datetime.fromisoformat(service.end_datetime)
        if service.end_datetime
        else None,
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
        before_images=list_to_json(service.before_images),
        after_images=list_to_json(service.after_images),
        service_report=service.service_report,
    )
    db.add(db_service)
    db.commit()
    db.refresh(db_service)

    return Service(
        id=db_service.id,
        pet_id=db_service.pet_id,
        service_type=ServiceType(db_service.service_type),
        status=ServiceStatus(db_service.status),
        start_datetime=db_service.start_datetime.isoformat(),
        end_datetime=db_service.end_datetime.isoformat()
        if db_service.end_datetime
        else None,
        duration_hours=db_service.duration_hours,
        price=db_service.price,
        currency=db_service.currency,
        pickup_address=db_service.pickup_address,
        dropoff_address=db_service.dropoff_address,
        pickup_latitude=db_service.pickup_latitude,
        pickup_longitude=db_service.pickup_longitude,
        dropoff_latitude=db_service.dropoff_latitude,
        dropoff_longitude=db_service.dropoff_longitude,
        provider_id=db_service.provider_id,
        provider_notes=db_service.provider_notes,
        customer_notes=db_service.customer_notes,
        before_images=json_to_list(db_service.before_images),
        after_images=json_to_list(db_service.after_images),
        service_report=db_service.service_report,
    )
