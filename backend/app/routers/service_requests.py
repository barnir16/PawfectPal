from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models import ServiceRequestORM, UserORM, PetORM, ServiceTypeORM
from app.schemas import (
    ServiceRequestCreate,
    ServiceRequestRead,
    ServiceRequestUpdate,
    ServiceRequestSummary,
)
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user, require_provider
from app.services.service_matching import ServiceMatchingService

router = APIRouter(prefix="/service-requests", tags=["service-requests"])


@router.post("/", response_model=ServiceRequestRead)
def create_service_request(
    request: ServiceRequestCreate,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Create a new service request"""
    # Verify all pet IDs belong to the current user
    user_pets = (
        db.query(PetORM)
        .filter(PetORM.user_id == current_user.id, PetORM.id.in_(request.pet_ids))
        .all()
    )

    if len(user_pets) != len(request.pet_ids):
        raise HTTPException(status_code=400, detail="Some pets don't belong to you")

    # Validate service type exists
    service_type_obj = db.query(ServiceTypeORM).filter(
        ServiceTypeORM.name == request.service_type
    ).first()
    
    if not service_type_obj:
        raise HTTPException(
            status_code=400, 
            detail=f"Service type '{request.service_type}' does not exist. Available services: {', '.join([st.name for st in db.query(ServiceTypeORM).all()])}"
        )
    
    # Check if there are any providers offering this service
    available_providers = ServiceMatchingService.get_providers_for_service(
        db, request.service_type, is_available=True
    )
    
    if not available_providers:
        raise HTTPException(
            status_code=400,
            detail=f"No providers are currently offering '{request.service_type}' service. Please try a different service type."
        )

    # Create the service request
    print(f"🔍 Service Request Creation Debug:")
    print(f"  Current User ID: {current_user.id}")
    print(f"  Current User Username: {current_user.username}")
    print(f"  Pet IDs: {request.pet_ids}")
    print(f"  Service Type: {request.service_type}")
    print(f"  Available Providers: {len(available_providers)}")
    
    db_request = ServiceRequestORM(user_id=current_user.id, **request.dict())
    
    print(f"  Created Service Request User ID: {db_request.user_id}")

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
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(require_provider),
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
    query = query.order_by(
        desc(ServiceRequestORM.is_urgent), desc(ServiceRequestORM.created_at)
    )

    requests = query.offset(offset).limit(limit).all()
    
    # Populate pets for each request
    from app.schemas.pet import PetRead
    result = []
    for request in requests:
        pets = []
        if hasattr(request, 'pet_ids') and request.pet_ids:
            pets = db.query(PetORM).filter(PetORM.id.in_(request.pet_ids)).all()
        
        request_data = {
            "id": request.id,
            "title": request.title,
            "service_type": request.service_type,
            "location": request.location,
            "budget_min": request.budget_min,
            "budget_max": request.budget_max,
            "is_urgent": request.is_urgent,
            "created_at": request.created_at,
            "views_count": request.views_count,
            "responses_count": request.responses_count,
            "user": request.user,
            "pets": [PetRead.model_validate(pet) for pet in pets]
        }
        result.append(ServiceRequestSummary.model_validate(request_data))
    
    return result


@router.get("/my-requests/", response_model=List[ServiceRequestRead])
def get_my_service_requests(
    db: Session = Depends(get_db), current_user: UserORM = Depends(get_current_user)
):
    """Get current user's service requests"""
    requests = (
        db.query(ServiceRequestORM)
        .filter(ServiceRequestORM.user_id == current_user.id)
        .order_by(desc(ServiceRequestORM.created_at))
        .all()
    )

    # Populate pets for each request
    from app.schemas.pet import PetRead
    result = []
    for request in requests:
        pets = []
        if hasattr(request, 'pet_ids') and request.pet_ids:
            pets = db.query(PetORM).filter(PetORM.id.in_(request.pet_ids)).all()
        
        request_data = {
            "id": request.id,
            "user_id": request.user_id,
            "assigned_provider_id": request.assigned_provider_id,
            "service_type": request.service_type,
            "title": request.title,
            "description": request.description,
            "pet_ids": request.pet_ids,
            "location": request.location,
            "preferred_dates": request.preferred_dates,
            "budget_min": request.budget_min,
            "budget_max": request.budget_max,
            "experience_years_min": request.experience_years_min,
            "languages": request.languages,
            "special_requirements": request.special_requirements,
            "is_urgent": request.is_urgent,
            "status": request.status,
            "views_count": request.views_count,
            "responses_count": request.responses_count,
            "created_at": request.created_at,
            "updated_at": request.updated_at,
            "expires_at": request.expires_at,
            "user": request.user,
            "assigned_provider": request.assigned_provider,
            "pets": [PetRead.model_validate(pet) for pet in pets]
        }
        result.append(ServiceRequestRead.model_validate(request_data))
    
    return result


@router.get("/{request_id}/", response_model=ServiceRequestRead)
def get_service_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Get a specific service request"""
    request = (
        db.query(ServiceRequestORM).filter(ServiceRequestORM.id == request_id).first()
    )

    if not request:
        raise HTTPException(status_code=404, detail="Service request not found")

    # Debug logging for access control
    print(f"🔍 Service Request Access Debug:")
    print(f"  Service Request ID: {request_id}")
    print(f"  Service Request User ID: {request.user_id}")
    print(f"  Service Request Assigned Provider ID: {request.assigned_provider_id}")
    print(f"  Current User ID: {current_user.id}")
    print(f"  Current User Username: {current_user.username}")
    print(f"  Current User Is Provider: {current_user.is_provider}")

    # Industry standard access control: Owner OR Assigned Provider OR Public (if open)
    is_owner = request.user_id == current_user.id
    is_assigned_provider = request.assigned_provider_id == current_user.id
    is_public_open = request.status == "open"  # Open requests can be viewed by providers
    
    print(f"  Is Owner: {is_owner}")
    print(f"  Is Assigned Provider: {is_assigned_provider}")
    print(f"  Is Public Open: {is_public_open}")
    
    # Allow access if: Owner OR Assigned Provider OR (Provider viewing open request)
    if not (is_owner or is_assigned_provider or (is_public_open and current_user.is_provider)):
        print(f"❌ Access denied for user {current_user.username} (ID: {current_user.id}) to service request {request_id}")
        raise HTTPException(status_code=403, detail="Access denied")
    
    print(f"✅ Access granted for user {current_user.username} (ID: {current_user.id}) to service request {request_id}")

    # Increment view count
    request.views_count += 1
    db.commit()

    # Fetch pets for this service request
    pets = []
    if hasattr(request, 'pet_ids') and request.pet_ids:
        pets = db.query(PetORM).filter(PetORM.id.in_(request.pet_ids)).all()
    
    # Create the response with pets populated
    from app.schemas.pet import PetRead
    response_data = {
        "id": request.id,
        "user_id": request.user_id,
        "assigned_provider_id": request.assigned_provider_id,
        "service_type": request.service_type,
        "title": request.title,
        "description": request.description,
        "pet_ids": request.pet_ids,
        "location": request.location,
        "preferred_dates": request.preferred_dates,
        "budget_min": request.budget_min,
        "budget_max": request.budget_max,
        "experience_years_min": request.experience_years_min,
        "languages": request.languages,
        "special_requirements": request.special_requirements,
        "is_urgent": request.is_urgent,
        "status": request.status,
        "views_count": request.views_count,
        "responses_count": request.responses_count,
        "created_at": request.created_at,
        "updated_at": request.updated_at,
        "expires_at": request.expires_at,
        "user": request.user,
        "assigned_provider": request.assigned_provider,
        "pets": [PetRead.model_validate(pet) for pet in pets]
    }
    
    return ServiceRequestRead.model_validate(response_data)


@router.post("/{request_id}/assign-provider", response_model=ServiceRequestRead)
def assign_provider(
    request_id: int,
    provider_id: int,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Assign a provider to a service request (only request owner can do this)"""
    # Get the service request
    request = (
        db.query(ServiceRequestORM).filter(ServiceRequestORM.id == request_id).first()
    )
    
    if not request:
        raise HTTPException(status_code=404, detail="Service request not found")
    
    # Only the request owner can assign providers
    if request.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the request owner can assign providers")
    
    # Verify the provider exists and is actually a provider
    provider = db.query(UserORM).filter(UserORM.id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    if not provider.is_provider:
        raise HTTPException(status_code=400, detail="User is not a provider")
    
    # Assign the provider
    request.assigned_provider_id = provider_id
    request.status = "in_progress"
    
    db.commit()
    db.refresh(request)
    
    print(f"✅ Provider {provider.username} (ID: {provider_id}) assigned to service request {request_id}")
    
    return request


@router.put("/{request_id}/", response_model=ServiceRequestRead)
def update_service_request(
    request_id: int,
    request_update: ServiceRequestUpdate,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Update a service request"""
    request = (
        db.query(ServiceRequestORM)
        .filter(
            ServiceRequestORM.id == request_id,
            ServiceRequestORM.user_id == current_user.id,
        )
        .first()
    )

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
    current_user: UserORM = Depends(get_current_user),
):
    """Delete a service request"""
    request = (
        db.query(ServiceRequestORM)
        .filter(
            ServiceRequestORM.id == request_id,
            ServiceRequestORM.user_id == current_user.id,
        )
        .first()
    )

    if not request:
        raise HTTPException(status_code=404, detail="Service request not found")

    db.delete(request)
    db.commit()

    return {"message": "Service request deleted successfully"}
