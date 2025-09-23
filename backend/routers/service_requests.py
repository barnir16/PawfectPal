from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_, or_
from models import ServiceRequestORM, UserORM, PetORM
from schemas import ServiceRequestCreate, ServiceRequestRead, ServiceRequestUpdate, ServiceRequestSummary
from dependencies.db import get_db
from dependencies.auth import get_current_user

router = APIRouter(prefix="/service-requests", tags=["service-requests"])

@router.post("/", response_model=ServiceRequestRead)
def create_service_request(
    request: ServiceRequestCreate,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user)
):
    """Create a new service request"""
    # Verify all pet IDs belong to the current user
    user_pets = db.query(PetORM).filter(
        PetORM.user_id == current_user.id,
        PetORM.id.in_(request.pet_ids)
    ).all()
    
    if len(user_pets) != len(request.pet_ids):
        raise HTTPException(status_code=400, detail="Some pets don't belong to you")
    
    # Create the service request
    db_request = ServiceRequestORM(
        user_id=current_user.id,
        **request.dict()
    )
    
    db.add(db_request)
    db.commit()
    db.refresh(db_request)
    
    return db_request

@router.get("/", response_model=List[ServiceRequestSummary])
def get_service_requests(
    service_type: Optional[str] = Query(None, description="Filter by service type"),
    location: Optional[str] = Query(None, description="Filter by location"),
    budget_min: Optional[int] = Query(None, ge=0, description="Minimum budget"),
    budget_max: Optional[int] = Query(None, ge=0, description="Maximum budget"),
    is_urgent: Optional[bool] = Query(None, description="Filter urgent requests"),
    limit: int = Query(20, le=100, description="Number of requests to return"),
    offset: int = Query(0, ge=0, description="Number of requests to skip"),
    db: Session = Depends(get_db)
):
    """Get service requests with optional filtering"""
    query = db.query(ServiceRequestORM).filter(ServiceRequestORM.status == "open")
    
    # Apply filters
    if service_type:
        query = query.filter(ServiceRequestORM.service_type == service_type)
    if location:
        query = query.filter(ServiceRequestORM.location.ilike(f"%{location}%"))
    if budget_min is not None:
        query = query.filter(ServiceRequestORM.budget_max >= budget_min)
    if budget_max is not None:
        query = query.filter(ServiceRequestORM.budget_min <= budget_max)
    if is_urgent is not None:
        query = query.filter(ServiceRequestORM.is_urgent == is_urgent)
    
    # Order by urgency and creation date
    query = query.order_by(desc(ServiceRequestORM.is_urgent), desc(ServiceRequestORM.created_at))
    
    requests = query.offset(offset).limit(limit).all()
    return requests

@router.get("/my-requests/", response_model=List[ServiceRequestRead])
def get_my_service_requests(
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user)
):
    """Get current user's service requests"""
    requests = db.query(ServiceRequestORM).filter(
        ServiceRequestORM.user_id == current_user.id
    ).order_by(desc(ServiceRequestORM.created_at)).all()
    
    return requests

@router.get("/{request_id}/", response_model=ServiceRequestRead)
def get_service_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user)
):
    """Get a specific service request"""
    request = db.query(ServiceRequestORM).filter(
        ServiceRequestORM.id == request_id
    ).first()
    
    if not request:
        raise HTTPException(status_code=404, detail="Service request not found")
    
    # Increment view count
    request.views_count += 1
    db.commit()
    
    return request

@router.put("/{request_id}/", response_model=ServiceRequestRead)
def update_service_request(
    request_id: int,
    request_update: ServiceRequestUpdate,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user)
):
    """Update a service request"""
    request = db.query(ServiceRequestORM).filter(
        ServiceRequestORM.id == request_id,
        ServiceRequestORM.user_id == current_user.id
    ).first()
    
    if not request:
        raise HTTPException(status_code=404, detail="Service request not found")
    
    # Update fields
    for field, value in request_update.dict(exclude_unset=True).items():
        setattr(request, field, value)
    
    db.commit()
    db.refresh(request)
    
    return request

@router.delete("/{request_id}/")
def delete_service_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user)
):
    """Delete a service request"""
    request = db.query(ServiceRequestORM).filter(
        ServiceRequestORM.id == request_id,
        ServiceRequestORM.user_id == current_user.id
    ).first()
    
    if not request:
        raise HTTPException(status_code=404, detail="Service request not found")
    
    db.delete(request)
    db.commit()
    
    return {"message": "Service request deleted successfully"}