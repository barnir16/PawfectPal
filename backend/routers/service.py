from fastapi import HTTPException, Depends, APIRouter, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from models import PetORM, ServiceORM, UserORM, ServiceStatus
from schemas import ServiceCreate, ServiceRead
from dependencies.db import get_db
from dependencies.auth import get_current_user

router = APIRouter(prefix="/service_booking", tags=["service_booking"])


@router.get("/{service_id}", response_model=ServiceRead)
def get_service_by_id(
    service_id: int,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Get a single service by its ID for the authenticated user"""
    service = (
        db.query(ServiceORM)
        .filter(ServiceORM.id == service_id, ServiceORM.user_id == current_user.id)
        .first()
    )
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    return ServiceRead.model_validate(service)


@router.get("/", response_model=List[ServiceRead])
def get_services(
    status: Optional[str] = Query(
        None, description="Filter by status: active or history"
    ),
    pet_id: Optional[int] = Query(None, description="Filter services by pet"),
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Get all services for the authenticated user"""
    query = db.query(ServiceORM).filter(ServiceORM.user_id == current_user.id)

    if pet_id:
        query = query.filter(ServiceORM.pet_id == pet_id)

    if status == "active":
        query = query.filter(ServiceORM.status != ServiceStatus.COMPLETED)
        query = query.order_by(ServiceORM.start_datetime.asc())
    elif status == "history":
        query = query.filter(ServiceORM.status == ServiceStatus.COMPLETED)
        query = query.order_by(ServiceORM.start_datetime.desc())
    else:
        # default ordering if no status filter
        query = query.order_by(ServiceORM.start_datetime.asc())

    services = query.all()
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

    db_service = ServiceORM(user_id=current_user.id, **service.model_dump())

    db.add(db_service)
    db.commit()
    db.refresh(db_service)

    return ServiceRead.model_validate(db_service)


@router.delete("/{service_id}", status_code=204)
def delete_service(
    service_id: int,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Delete a service by its ID for the authenticated user"""
    service = (
        db.query(ServiceORM)
        .filter(ServiceORM.id == service_id, ServiceORM.user_id == current_user.id)
        .first()
    )
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    db.delete(service)
    db.commit()
