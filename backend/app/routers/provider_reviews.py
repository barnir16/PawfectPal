from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.models import UserORM, ProviderORM, ProviderReviewORM, ServiceORM
from app.schemas.provider_review import ProviderReviewCreate, ProviderReviewRead

router = APIRouter(prefix="/providers", tags=["provider-reviews"])  # share base with providers


@router.post("/{provider_id}/reviews", response_model=ProviderReviewRead)
def create_review(
    provider_id: int,
    payload: ProviderReviewCreate,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    # provider_id refers to User.id in existing routes; resolve ProviderORM
    provider_user = (
        db.query(UserORM).filter(UserORM.id == provider_id, UserORM.is_provider).first()
    )
    if not provider_user or not provider_user.provider_profile:
        raise HTTPException(status_code=404, detail="Provider not found")

    provider_profile: ProviderORM = provider_user.provider_profile

    # Eligibility: require at least one completed service with this provider
    has_completed = (
        db.query(ServiceORM)
        .filter(
            ServiceORM.user_id == current_user.id,
            ServiceORM.provider_id == provider_user.id,
            ServiceORM.status == "completed",
        )
        .first()
        is not None
    )
    if not has_completed:
        raise HTTPException(status_code=403, detail="You can only review providers you have completed a service with")

    # Prevent duplicate review per user/provider (MVP rule)
    existing = (
        db.query(ProviderReviewORM)
        .filter(
            ProviderReviewORM.provider_id == provider_profile.id,
            ProviderReviewORM.user_id == current_user.id,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="You have already reviewed this provider")

    review = ProviderReviewORM(
        provider_id=provider_profile.id,
        user_id=current_user.id,
        service_request_id=None,
        rating=payload.rating,
        comment=payload.comment,
    )
    db.add(review)

    # Update aggregates on ProviderORM
    old_avg = provider_profile.rating or 0.0
    old_count = provider_profile.rating_count or 0
    new_count = old_count + 1
    new_avg = (old_avg * old_count + payload.rating) / new_count
    provider_profile.rating = float(new_avg)
    provider_profile.rating_count = new_count

    db.commit()
    db.refresh(review)
    return review


@router.get("/{provider_id}/reviews", response_model=List[ProviderReviewRead])
def list_reviews(
    provider_id: int,
    db: Session = Depends(get_db),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    provider_user = (
        db.query(UserORM).filter(UserORM.id == provider_id, UserORM.is_provider).first()
    )
    if not provider_user or not provider_user.provider_profile:
        raise HTTPException(status_code=404, detail="Provider not found")
    provider_profile: ProviderORM = provider_user.provider_profile

    q = (
        db.query(ProviderReviewORM)
        .filter(ProviderReviewORM.provider_id == provider_profile.id)
        .order_by(ProviderReviewORM.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    return q.all()


@router.get("/{provider_id}/review-eligibility")
def review_eligibility(
    provider_id: int,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    provider_user = (
        db.query(UserORM).filter(UserORM.id == provider_id, UserORM.is_provider).first()
    )
    if not provider_user or not provider_user.provider_profile:
        raise HTTPException(status_code=404, detail="Provider not found")
    provider_profile: ProviderORM = provider_user.provider_profile

    has_completed = (
        db.query(ServiceORM)
        .filter(
            ServiceORM.user_id == current_user.id,
            ServiceORM.provider_id == provider_user.id,
            ServiceORM.status == "completed",
        )
        .first()
        is not None
    )
    if not has_completed:
        return {"eligible": False, "reason": "no_completed_service"}

    existing = (
        db.query(ProviderReviewORM)
        .filter(
            ProviderReviewORM.provider_id == provider_profile.id,
            ProviderReviewORM.user_id == current_user.id,
        )
        .first()
    )
    if existing:
        return {"eligible": False, "reason": "already_reviewed"}

    return {"eligible": True}
