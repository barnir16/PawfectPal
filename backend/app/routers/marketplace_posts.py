from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.models.user import UserORM
from app.models.marketplace_post import MarketplacePostORM
from app.models.pet import PetORM
from app.models.service_type import ServiceTypeORM
from app.schemas.marketplace_post import (
    MarketplacePostCreate, 
    MarketplacePostUpdate, 
    MarketplacePostRead,
    MarketplacePostSummary
)
from app.services.service_matching import ServiceMatchingService
from datetime import datetime, timedelta

router = APIRouter(prefix="/marketplace-posts", tags=["marketplace-posts"])

@router.post("/", response_model=MarketplacePostRead)
def create_marketplace_post(
    post: MarketplacePostCreate,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user)
):
    """Create a new marketplace post"""
    
    # Validate that all pet IDs belong to the current user
    user_pets = db.query(PetORM).filter(
        PetORM.user_id == current_user.id,
        PetORM.id.in_(post.pet_ids)
    ).all()
    
    if len(user_pets) != len(post.pet_ids):
        raise HTTPException(
            status_code=400, 
            detail="Some pet IDs do not belong to you"
        )
    
    # Validate service type exists
    service_type_obj = db.query(ServiceTypeORM).filter(
        ServiceTypeORM.name == post.service_type
    ).first()
    
    if not service_type_obj:
        raise HTTPException(
            status_code=400, 
            detail=f"Service type '{post.service_type}' does not exist. Available services: {', '.join([st.name for st in db.query(ServiceTypeORM).all()])}"
        )
    
    # Check if there are any providers offering this service
    available_providers = ServiceMatchingService.get_providers_for_service(
        db, post.service_type, is_available=True
    )
    
    if not available_providers:
        raise HTTPException(
            status_code=400,
            detail=f"No providers are currently offering '{post.service_type}' service. Please try a different service type."
        )
    
    # Create the marketplace post
    db_post = MarketplacePostORM(
        user_id=current_user.id,
        title=post.title,
        description=post.description,
        service_type=post.service_type,
        pet_ids=post.pet_ids,
        location=post.location,
        preferred_dates=post.preferred_dates,
        budget_min=post.budget_min,
        budget_max=post.budget_max,
        experience_years_min=post.experience_years_min,
        languages=post.languages,
        special_requirements=post.special_requirements,
        is_urgent=post.is_urgent,
        status="open",
        views_count=0,
        responses_count=0,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        expires_at=datetime.utcnow() + timedelta(days=30) if post.is_urgent else datetime.utcnow() + timedelta(days=7)
    )
    
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    
    # Add pets to the association table
    for pet in user_pets:
        db_post.pets.append(pet)
    
    db.commit()
    db.refresh(db_post)
    
    return db_post

@router.get("/", response_model=List[MarketplacePostSummary])
def get_marketplace_posts(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    service_type: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    is_urgent: Optional[bool] = Query(None),
    db: Session = Depends(get_db)
):
    """Get all marketplace posts with optional filters"""
    
    query = db.query(MarketplacePostORM).filter(MarketplacePostORM.status == "open")
    
    if service_type:
        query = query.filter(MarketplacePostORM.service_type == service_type)
    
    if location:
        query = query.filter(MarketplacePostORM.location.ilike(f"%{location}%"))
    
    if is_urgent is not None:
        query = query.filter(MarketplacePostORM.is_urgent == is_urgent)
    
    # Order by urgent first, then by creation date
    posts = query.order_by(
        MarketplacePostORM.is_urgent.desc(),
        MarketplacePostORM.created_at.desc()
    ).offset(skip).limit(limit).all()
    
    return posts

@router.get("/my-posts", response_model=List[MarketplacePostRead])
def get_my_marketplace_posts(
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user)
):
    """Get current user's marketplace posts"""
    
    posts = db.query(MarketplacePostORM).filter(
        MarketplacePostORM.user_id == current_user.id
    ).order_by(MarketplacePostORM.created_at.desc()).all()
    
    return posts

@router.get("/{post_id}", response_model=MarketplacePostRead)
def get_marketplace_post(
    post_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific marketplace post by ID"""
    
    post = db.query(MarketplacePostORM).filter(
        MarketplacePostORM.id == post_id
    ).first()
    
    if not post:
        raise HTTPException(status_code=404, detail="Marketplace post not found")
    
    # Increment view count
    post.views_count += 1
    db.commit()
    
    return post

@router.put("/{post_id}", response_model=MarketplacePostRead)
def update_marketplace_post(
    post_id: int,
    post_update: MarketplacePostUpdate,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user)
):
    """Update a marketplace post"""
    
    post = db.query(MarketplacePostORM).filter(
        MarketplacePostORM.id == post_id,
        MarketplacePostORM.user_id == current_user.id
    ).first()
    
    if not post:
        raise HTTPException(status_code=404, detail="Marketplace post not found")
    
    # Update fields
    update_data = post_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(post, field, value)
    
    post.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(post)
    
    return post

@router.delete("/{post_id}")
def delete_marketplace_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user)
):
    """Delete a marketplace post"""
    
    post = db.query(MarketplacePostORM).filter(
        MarketplacePostORM.id == post_id,
        MarketplacePostORM.user_id == current_user.id
    ).first()
    
    if not post:
        raise HTTPException(status_code=404, detail="Marketplace post not found")
    
    db.delete(post)
    db.commit()
    
    return {"message": "Marketplace post deleted successfully"}

@router.post("/{post_id}/respond")
def respond_to_marketplace_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user)
):
    """Respond to a marketplace post (increment response count)"""
    
    post = db.query(MarketplacePostORM).filter(
        MarketplacePostORM.id == post_id
    ).first()
    
    if not post:
        raise HTTPException(status_code=404, detail="Marketplace post not found")
    
    if post.user_id == current_user.id:
        raise HTTPException(
            status_code=400, 
            detail="You cannot respond to your own post"
        )
    
    post.responses_count += 1
    db.commit()
    
    return {"message": "Response recorded successfully"}
