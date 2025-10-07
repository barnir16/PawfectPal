from fastapi import Depends, APIRouter
from sqlalchemy.orm import Session
from typing import List
from app.models import (
    VaccineORM,
    AgeRestrictionORM,
)
from app.schemas import Vaccine, AgeRestriction
from app.dependencies.db import get_db

vaccines_router = APIRouter(prefix="/vaccines", tags=["Vaccines"])
age_router = APIRouter(prefix="/age_restrictions", tags=["Age Restrictions"])


@vaccines_router.get("/", response_model=List[Vaccine])
def get_vaccines(db: Session = Depends(get_db)):
    """Get all vaccines"""
    vaccines = db.query(VaccineORM).all()
    return [Vaccine.model_validate(v) for v in vaccines]


@age_router.get("/", response_model=List[AgeRestriction])
def get_age_restrictions(db: Session = Depends(get_db)):
    """Get all age restrictions"""
    restrictions = db.query(AgeRestrictionORM).all()
    return [AgeRestriction.model_validate(r) for r in restrictions]
