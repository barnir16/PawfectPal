import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from typing import List, Optional
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.models.user import UserORM
from app.models.service_request import ServiceRequestORM
from app.models.service_request_response import ServiceRequestResponseORM
from app.models.pet import PetORM
from app.models.service_type import ServiceTypeORM
from app.schemas.marketplace_post import (
    MarketplacePostCreate,
    MarketplacePostUpdate,
    MarketplacePostRead,
    MarketplacePostSummary,
)
from app.schemas.user import UserRead
from app.schemas.pet import PetRead
from app.services.service_matching import ServiceMatchingService
from datetime import datetime, timedelta

router = APIRouter(prefix="/marketplace-posts", tags=["marketplace-posts"])
logger = logging.getLogger(__name__)


@router.post("/", response_model=MarketplacePostRead)
def create_marketplace_post(
    post: MarketplacePostCreate,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user)
):
    """Create a new marketplace post.

    Stored as a public ServiceRequestORM row — the same table the browse/
    my-posts/detail endpoints already read from, so a post created here
    shows up immediately everywhere else.
    """
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

    # Create the marketplace post as a public service request
    db_post = ServiceRequestORM(
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
        request_type="marketplace",
        is_public=True,
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
    db: Session = Depends(get_db),
):
    """Browse open service requests posted by pet owners.

    Reads from service_requests — the single source of truth for all
    owner-posted requests.
    """
    try:
        query = db.query(ServiceRequestORM).filter(ServiceRequestORM.status == "open")

        if service_type:
            query = query.filter(ServiceRequestORM.service_type == service_type)
        if location:
            query = query.filter(ServiceRequestORM.location.ilike(f"%{location}%"))
        if is_urgent is not None:
            query = query.filter(ServiceRequestORM.is_urgent == is_urgent)

        requests = query.order_by(
            ServiceRequestORM.is_urgent.desc(),
            ServiceRequestORM.created_at.desc(),
        ).offset(skip).limit(limit).all()

        result = []
        for req in requests:
            pets = (
                db.query(PetORM).filter(PetORM.id.in_(req.pet_ids)).all()
                if req.pet_ids
                else []
            )
            result.append(
                MarketplacePostSummary(
                    id=req.id,
                    title=req.title,
                    description=req.description,
                    service_type=req.service_type,
                    location=req.location,
                    budget_min=req.budget_min,
                    budget_max=req.budget_max,
                    is_urgent=req.is_urgent,
                    created_at=req.created_at,
                    views_count=req.views_count,
                    responses_count=req.responses_count,
                    user=UserRead.model_validate(req.user),
                    pets=[PetRead.model_validate(pet) for pet in pets],
                )
            )
        return result
    except Exception:
        logger.exception("Failed to query service requests for marketplace feed")
        return []


@router.get("/my-posts", response_model=List[MarketplacePostSummary])
def get_my_marketplace_posts(
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Get the current user's own service requests in marketplace summary form."""
    try:
        requests = (
            db.query(ServiceRequestORM)
            .filter(ServiceRequestORM.user_id == current_user.id)
            .order_by(ServiceRequestORM.created_at.desc())
            .all()
        )

        result = []
        for req in requests:
            pets = (
                db.query(PetORM).filter(PetORM.id.in_(req.pet_ids)).all()
                if req.pet_ids
                else []
            )
            result.append(
                MarketplacePostSummary(
                    id=req.id,
                    title=req.title,
                    description=req.description,
                    service_type=req.service_type,
                    location=req.location,
                    budget_min=req.budget_min,
                    budget_max=req.budget_max,
                    is_urgent=req.is_urgent,
                    created_at=req.created_at,
                    views_count=req.views_count,
                    responses_count=req.responses_count,
                    user=UserRead.model_validate(req.user),
                    pets=[PetRead.model_validate(pet) for pet in pets],
                )
            )
        return result
    except Exception:
        logger.exception("Failed to query user service requests for my-posts feed")
        return []

@router.get("/{post_id}", response_model=MarketplacePostRead)
def get_marketplace_post(
    post_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific marketplace post by ID"""
    post = db.query(ServiceRequestORM).filter(
        ServiceRequestORM.id == post_id
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
    post = db.query(ServiceRequestORM).filter(
        ServiceRequestORM.id == post_id,
        ServiceRequestORM.user_id == current_user.id
    ).first()

    if not post:
        raise HTTPException(status_code=404, detail="Marketplace post not found")

    # Update fields
    update_data = post_update.dict(exclude_unset=True)

    if "pet_ids" in update_data:
        user_pets = db.query(PetORM).filter(
            PetORM.user_id == current_user.id,
            PetORM.id.in_(update_data["pet_ids"])
        ).all()

        if len(user_pets) != len(update_data["pet_ids"]):
            raise HTTPException(
                status_code=400,
                detail="Some pet IDs do not belong to you"
            )

        post.pet_ids = update_data["pet_ids"]
        post.pets = user_pets

    if "service_type" in update_data:
        service_type_obj = db.query(ServiceTypeORM).filter(
            ServiceTypeORM.name == update_data["service_type"]
        ).first()

        if not service_type_obj:
            raise HTTPException(
                status_code=400,
                detail=f"Service type '{update_data['service_type']}' does not exist"
            )

    for field, value in update_data.items():
        if field == "pet_ids":
            continue
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
    post = db.query(ServiceRequestORM).filter(
        ServiceRequestORM.id == post_id,
        ServiceRequestORM.user_id == current_user.id
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
    """Respond to a marketplace post.

    Creates a real per-provider response row (service_request_responses) —
    not just a counter bump — so a provider can't respond to the same post
    twice (enforced by the unique_provider_response constraint) and so the
    app has an actual record of who responded to what.
    """
    post = db.query(ServiceRequestORM).filter(
        ServiceRequestORM.id == post_id
    ).first()

    if not post:
        raise HTTPException(status_code=404, detail="Marketplace post not found")

    if post.user_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot respond to your own post"
        )

    response = ServiceRequestResponseORM(
        service_request_id=post_id,
        provider_id=current_user.id,
        status="pending",
    )
    db.add(response)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="You've already responded to this post",
        )

    post.responses_count += 1
    db.commit()

    return {"message": "Response recorded successfully"}
