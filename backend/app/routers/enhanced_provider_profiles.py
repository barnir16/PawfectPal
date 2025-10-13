from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.models.user import UserORM
from app.models.provider_profile import ProviderProfileORM
from app.models.service_type import ServiceTypeORM
from app.schemas.provider_profile import (
    ProviderProfileCreate, 
    ProviderProfileUpdate, 
    ProviderProfileRead,
    ProviderProfileSummary
)
from datetime import datetime

router = APIRouter(prefix="/provider-profiles", tags=["provider-profiles"])

@router.post("/", response_model=ProviderProfileRead)
def create_provider_profile(
    profile: ProviderProfileCreate,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user)
):
    """Create a new provider profile"""
    
    # Check if user already has a provider profile
    existing_profile = db.query(ProviderProfileORM).filter(
        ProviderProfileORM.user_id == current_user.id
    ).first()
    
    if existing_profile:
        raise HTTPException(
            status_code=400, 
            detail="User already has a provider profile"
        )
    
    # Validate service types exist
    service_types = db.query(ServiceTypeORM).filter(
        ServiceTypeORM.id.in_(profile.service_type_ids)
    ).all()
    
    if len(service_types) != len(profile.service_type_ids):
        raise HTTPException(
            status_code=400, 
            detail="Some service type IDs are invalid"
        )
    
    # Create the provider profile
    db_profile = ProviderProfileORM(
        user_id=current_user.id,
        bio=profile.bio,
        experience_years=profile.experience_years,
        languages=profile.languages,
        hourly_rate=profile.hourly_rate,
        service_radius_km=profile.service_radius_km,
        is_available=profile.is_available,
        available_days=profile.available_days,
        available_hours_start=profile.available_hours_start,
        available_hours_end=profile.available_hours_end,
        certifications=profile.certifications,
        insurance_info=profile.insurance_info,
        is_verified=False,
        average_rating=None,
        total_reviews=0,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    db.add(db_profile)
    db.commit()
    db.refresh(db_profile)
    
    # Add service types to the association table
    for service_type in service_types:
        db_profile.services.append(service_type)
    
    db.commit()
    db.refresh(db_profile)
    
    return db_profile

@router.get("/", response_model=List[ProviderProfileSummary])
def get_provider_profiles(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    service_type: Optional[str] = Query(None),
    is_available: Optional[bool] = Query(True),
    min_rating: Optional[float] = Query(None, ge=1.0, le=5.0),
    db: Session = Depends(get_db)
):
    """Get all provider profiles with optional filters"""
    
    query = db.query(ProviderProfileORM)
    
    if is_available is not None:
        query = query.filter(ProviderProfileORM.is_available == is_available)
    
    if min_rating is not None:
        query = query.filter(ProviderProfileORM.average_rating >= min_rating)
    
    if service_type:
        query = query.join(ProviderProfileORM.services).filter(
            ServiceTypeORM.name == service_type
        )
    
    # Order by rating and availability
    profiles = query.order_by(
        ProviderProfileORM.is_available.desc(),
        ProviderProfileORM.average_rating.desc().nullslast(),
        ProviderProfileORM.created_at.desc()
    ).offset(skip).limit(limit).all()
    
    return profiles

@router.get("/my-profile", response_model=ProviderProfileRead)
def get_my_provider_profile(
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user)
):
    """Get current user's provider profile"""
    
    profile = db.query(ProviderProfileORM).filter(
        ProviderProfileORM.user_id == current_user.id
    ).first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Provider profile not found")
    
    return profile

@router.get("/{profile_id}", response_model=ProviderProfileRead)
def get_provider_profile(
    profile_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific provider profile by ID"""
    
    profile = db.query(ProviderProfileORM).filter(
        ProviderProfileORM.id == profile_id
    ).first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Provider profile not found")
    
    return profile

@router.put("/my-profile", response_model=ProviderProfileRead)
def update_my_provider_profile(
    profile_update: ProviderProfileUpdate,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user)
):
    """Update current user's provider profile"""
    
    profile = db.query(ProviderProfileORM).filter(
        ProviderProfileORM.user_id == current_user.id
    ).first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Provider profile not found")
    
    # Update fields
    update_data = profile_update.dict(exclude_unset=True)
    
    # Handle service types separately
    service_type_ids = update_data.pop('service_type_ids', None)
    
    for field, value in update_data.items():
        setattr(profile, field, value)
    
    # Update service types if provided
    if service_type_ids is not None:
        # Validate service types exist
        service_types = db.query(ServiceTypeORM).filter(
            ServiceTypeORM.id.in_(service_type_ids)
        ).all()
        
        if len(service_types) != len(service_type_ids):
            raise HTTPException(
                status_code=400, 
                detail="Some service type IDs are invalid"
            )
        
        # Clear existing service types and add new ones
        profile.services.clear()
        for service_type in service_types:
            profile.services.append(service_type)
    
    profile.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(profile)
    
    return profile

@router.delete("/my-profile")
def delete_my_provider_profile(
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user)
):
    """Delete current user's provider profile"""
    
    profile = db.query(ProviderProfileORM).filter(
        ProviderProfileORM.user_id == current_user.id
    ).first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Provider profile not found")
    
    db.delete(profile)
    db.commit()
    
    return {"message": "Provider profile deleted successfully"}

@router.get("/service-types", response_model=List[dict])
def get_service_types(db: Session = Depends(get_db)):
    """Get all available service types"""
    
    service_types = db.query(ServiceTypeORM).all()
    
    return [
        {
            "id": st.id,
            "name": st.name,
            "description": st.description
        }
        for st in service_types
    ]
