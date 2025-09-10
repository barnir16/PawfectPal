from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from models import UserORM
from schemas import UserRead
from dependencies.db import get_db

router = APIRouter(prefix="/providers", tags=["providers"])


@router.get("/{provider_id}", response_model=UserRead)
def get_provider_by_id(provider_id: int, db: Session = Depends(get_db)):
    provider = (
        db.query(UserORM)
        .filter(UserORM.id == provider_id, UserORM.is_provider == True)
        .first()
    )
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    # Flatten provider fields
    user_data = UserRead.model_validate(provider).model_dump()
    if provider.provider_profile:
        user_data.update(
            {
                "provider_services": provider.provider_profile.services.split(",")
                if provider.provider_profile.services
                else [],
                "provider_bio": provider.provider_profile.bio,
                "provider_hourly_rate": provider.provider_profile.hourly_rate,
                "provider_rating": provider.provider_profile.rating,
            }
        )
    return user_data


@router.get("/", response_model=List[UserRead])
def get_providers(
    filter: Optional[List[str]] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(UserORM).filter(UserORM.is_provider == True)

    providers = query.all()
    if not providers:
        raise HTTPException(status_code=404, detail="Providers not found")

    results = []
    for p in providers:
        user_data = UserRead.model_validate(p).model_dump()
        if p.provider_profile:
            user_data.update(
                {
                    "provider_services": p.provider_profile.services.split(",")
                    if p.provider_profile.services
                    else [],
                    "provider_bio": p.provider_profile.bio,
                    "provider_hourly_rate": p.provider_profile.hourly_rate,
                    "provider_rating": p.provider_profile.rating,
                }
            )
        results.append(user_data)

    return results
