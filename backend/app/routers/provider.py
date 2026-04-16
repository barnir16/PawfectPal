import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.dependencies.db import get_db
from app.models import UserORM
from app.schemas import UserRead

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/providers", tags=["providers"])


def _with_safe_provider_defaults(provider: UserORM) -> dict:
    user_data = UserRead.model_validate(provider).model_dump()

    if not provider.provider_profile:
        return user_data

    try:
        services = []
        if provider.provider_profile.services:
            services = [service.name for service in provider.provider_profile.services]

        user_data.update(
            {
                "provider_services": services,
                "provider_bio": provider.provider_profile.bio,
                "provider_hourly_rate": provider.provider_profile.hourly_rate,
                "provider_rating": provider.provider_profile.rating,
                "provider_rating_count": provider.provider_profile.rating_count or 0,
            }
        )
    except Exception:
        logger.exception("Failed to flatten provider profile for provider %s", provider.id)
        user_data.update(
            {
                "provider_services": [],
                "provider_bio": None,
                "provider_hourly_rate": None,
                "provider_rating": None,
                "provider_rating_count": 0,
            }
        )

    return user_data


@router.get("/{provider_id}", response_model=UserRead)
def get_provider_by_id(provider_id: int, db: Session = Depends(get_db)):
    provider = (
        db.query(UserORM).filter(UserORM.id == provider_id, UserORM.is_provider).first()
    )
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    return _with_safe_provider_defaults(provider)


@router.get("/", response_model=List[UserRead])
def get_providers(
    filter: Optional[List[str]] = Query(None),
    db: Session = Depends(get_db),
):
    del filter

    try:
        providers = db.query(UserORM).filter(UserORM.is_provider).all()
        results = []

        for provider in providers:
            try:
                user_data = UserRead.model_validate(provider).model_dump()

                if getattr(provider, "enhanced_provider_profile", None):
                    try:
                        services = []
                        if provider.enhanced_provider_profile.services:
                            services = [
                                service.name
                                for service in provider.enhanced_provider_profile.services
                            ]

                        user_data.update(
                            {
                                "provider_services": services,
                                "provider_bio": provider.enhanced_provider_profile.bio,
                                "provider_hourly_rate": provider.enhanced_provider_profile.hourly_rate,
                                "provider_rating": provider.enhanced_provider_profile.average_rating,
                                "provider_rating_count": provider.enhanced_provider_profile.total_reviews
                                or 0,
                            }
                        )
                    except Exception:
                        logger.exception(
                            "Failed to flatten enhanced provider profile for provider %s",
                            provider.id,
                        )
                        user_data.update(
                            {
                                "provider_services": [],
                                "provider_bio": None,
                                "provider_hourly_rate": None,
                                "provider_rating": None,
                                "provider_rating_count": 0,
                            }
                        )

                results.append(user_data)
            except Exception:
                logger.exception("Failed to serialize provider %s", provider.id)

        return results
    except Exception:
        logger.exception("Failed to list providers")
        raise HTTPException(status_code=500, detail="Internal server error")
