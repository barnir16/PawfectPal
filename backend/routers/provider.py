from typing import List, Optional
from fastapi import HTTPException, Depends, APIRouter, Query
from sqlalchemy.orm import Session
from models import UserORM
from schemas import UserRead
from dependencies.db import get_db

router = APIRouter(prefix="/providers", tags=["providers"])


@router.get("/provider_id", response_model=UserRead)
def get_provider_by_id(provider_id: int, db: Session = Depends(get_db)):
    """Get a single provider by its ID"""
    provider = (
        db.query(UserORM).filter(UserORM.id == provider_id, UserORM.is_provider).first()
    )
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    return UserRead.model_validate(provider)


router = APIRouter(prefix="/providers", tags=["providers"])


@router.get("/", response_model=list[UserRead])
def get_providers(
    filter: Optional[List[str]] = Query(None),
    db: Session = Depends(get_db),
):
    """Get providers, optionally filtered"""
    query = db.query(UserORM).filter(UserORM.is_provider)

    if filter:
        # Example: filter by services or roles
        query = query.filter(UserORM.provider_services.overlap(filter))

    providers = query.all()
    if not providers:
        raise HTTPException(status_code=404, detail="Providers not found")

    return [UserRead.model_validate(p) for p in providers]
