from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from sqlalchemy import func
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.models.user import UserORM
from app.models.provider_profile import ProviderProfileORM
from app.models.provider_review import ProviderReviewORM
from app.models.service_request import ServiceRequestORM
from app.schemas.provider_review import (
    ProviderReviewCreate, 
    ProviderReviewUpdate, 
    ProviderReviewRead
)
from datetime import datetime

router = APIRouter(prefix="/provider-reviews", tags=["provider-reviews"])

@router.post("/", response_model=ProviderReviewRead)
def create_provider_review(
    review: ProviderReviewCreate,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user)
):
    """Create a new provider review"""
    
    # Validate provider exists
    provider = db.query(ProviderProfileORM).filter(
        ProviderProfileORM.id == review.provider_id
    ).first()
    
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    # Check if user already reviewed this provider for this service
    existing_review = db.query(ProviderReviewORM).filter(
        ProviderReviewORM.provider_id == review.provider_id,
        ProviderReviewORM.reviewer_id == current_user.id,
        ProviderReviewORM.service_type == review.service_type
    ).first()
    
    if existing_review:
        raise HTTPException(
            status_code=400, 
            detail="You have already reviewed this provider for this service type"
        )
    
    # Validate service request if provided
    if review.service_request_id:
        service_request = db.query(ServiceRequestORM).filter(
            ServiceRequestORM.id == review.service_request_id,
            ServiceRequestORM.user_id == current_user.id
        ).first()
        
        if not service_request:
            raise HTTPException(
                status_code=404, 
                detail="Service request not found or does not belong to you"
            )
    
    # Create the review
    db_review = ProviderReviewORM(
        provider_id=review.provider_id,
        reviewer_id=current_user.id,
        service_request_id=review.service_request_id,
        rating=review.rating,
        title=review.title,
        comment=review.comment,
        service_type=review.service_type,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    db.add(db_review)
    db.commit()
    db.refresh(db_review)
    
    # Update provider's average rating and total reviews
    update_provider_rating_stats(db, review.provider_id)
    
    return db_review

@router.get("/provider/{provider_id}", response_model=List[ProviderReviewRead])
def get_provider_reviews(
    provider_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    service_type: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Get reviews for a specific provider"""
    
    # Validate provider exists
    provider = db.query(ProviderProfileORM).filter(
        ProviderProfileORM.id == provider_id
    ).first()
    
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    query = db.query(ProviderReviewORM).filter(
        ProviderReviewORM.provider_id == provider_id
    )
    
    if service_type:
        query = query.filter(ProviderReviewORM.service_type == service_type)
    
    reviews = query.order_by(
        ProviderReviewORM.created_at.desc()
    ).offset(skip).limit(limit).all()
    
    return reviews

@router.get("/my-reviews", response_model=List[ProviderReviewRead])
def get_my_reviews(
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user)
):
    """Get current user's reviews"""
    
    reviews = db.query(ProviderReviewORM).filter(
        ProviderReviewORM.reviewer_id == current_user.id
    ).order_by(ProviderReviewORM.created_at.desc()).all()
    
    return reviews

@router.get("/{review_id}", response_model=ProviderReviewRead)
def get_review(
    review_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific review by ID"""
    
    review = db.query(ProviderReviewORM).filter(
        ProviderReviewORM.id == review_id
    ).first()
    
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    return review

@router.put("/{review_id}", response_model=ProviderReviewRead)
def update_review(
    review_id: int,
    review_update: ProviderReviewUpdate,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user)
):
    """Update a review"""
    
    review = db.query(ProviderReviewORM).filter(
        ProviderReviewORM.id == review_id,
        ProviderReviewORM.reviewer_id == current_user.id
    ).first()
    
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    # Update fields
    update_data = review_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(review, field, value)
    
    review.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(review)
    
    # Update provider's average rating and total reviews
    update_provider_rating_stats(db, review.provider_id)
    
    return review

@router.delete("/{review_id}")
def delete_review(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user)
):
    """Delete a review"""
    
    review = db.query(ProviderReviewORM).filter(
        ProviderReviewORM.id == review_id,
        ProviderReviewORM.reviewer_id == current_user.id
    ).first()
    
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    provider_id = review.provider_id
    
    db.delete(review)
    db.commit()
    
    # Update provider's average rating and total reviews
    update_provider_rating_stats(db, provider_id)
    
    return {"message": "Review deleted successfully"}

def update_provider_rating_stats(db: Session, provider_id: int):
    """Update provider's average rating and total reviews count"""
    
    # Calculate new stats
    stats = db.query(
        func.avg(ProviderReviewORM.rating).label('avg_rating'),
        func.count(ProviderReviewORM.id).label('total_reviews')
    ).filter(ProviderReviewORM.provider_id == provider_id).first()
    
    # Update provider profile
    provider = db.query(ProviderProfileORM).filter(
        ProviderProfileORM.id == provider_id
    ).first()
    
    if provider:
        provider.average_rating = float(stats.avg_rating) if stats.avg_rating else None
        provider.total_reviews = stats.total_reviews
        provider.updated_at = datetime.utcnow()
        
        db.commit()
