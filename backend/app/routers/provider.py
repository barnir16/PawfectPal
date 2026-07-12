import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.dependencies.db import get_db
from app.models import UserORM
from app.models.provider_profile import ProviderProfileORM
from app.models.service_type import ServiceTypeORM
from app.schemas import UserRead

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/providers", tags=["providers"])


def _serialize_provider(provider: UserORM) -> dict:
    """Flatten a provider's profile onto the UserRead shape.

    provider_profiles (enhanced_provider_profile) is the only profile table
    now, so list and detail responses finally read from the same place -
    previously this endpoint and get_provider_by_id pulled from two
    different tables and disagreed with each other.
    """
    user_data = UserRead.model_validate(provider).model_dump()
    profile = provider.enhanced_provider_profile

    if not profile:
        return user_data

    try:
        services = [service.name for service in profile.services] if profile.services else []
        user_data.update(
            {
                "provider_services": services,
                "provider_bio": profile.bio,
                "provider_hourly_rate": profile.hourly_rate,
                "provider_rating": profile.average_rating,
                "provider_rating_count": profile.total_reviews or 0,
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

    return _serialize_provider(provider)


@router.get("/", response_model=List[UserRead])
def get_providers(
    service_type: Optional[str] = Query(
        None, description="Only return providers offering this service type"
    ),
    db: Session = Depends(get_db),
):
    try:
        query = db.query(UserORM).filter(UserORM.is_provider)

        if service_type:
            # Same join pattern as enhanced_provider_profiles.get_provider_profiles -
            # filter through the profile's services M2M, not anything on UserORM.
            query = (
                query.join(UserORM.enhanced_provider_profile)
                .join(ProviderProfileORM.services)
                .filter(ServiceTypeORM.name == service_type)
            )

        providers = query.all()
        results = []

        for provider in providers:
            try:
                results.append(_serialize_provider(provider))
            except Exception:
                logger.exception("Failed to serialize provider %s", provider.id)

        return results
    except Exception:
        logger.exception("Failed to list providers")
        raise HTTPException(status_code=500, detail="Internal server error")
