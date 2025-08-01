from fastapi import Depends, APIRouter
from sqlalchemy.orm import Session
from typing import List
from models import (
    VaccineORM,
    AgeRestrictionORM,
    str_to_list,
)
from schemas import Vaccine, AgeRestriction
from dependencies.db import get_db

vaccines_router = APIRouter(prefix="/vaccines", tags=["Vaccines"])
age_router = APIRouter(prefix="/age_restrictions", tags=["Age Restrictions"])


@vaccines_router.get("/", response_model=List[Vaccine])
def get_vaccines(db: Session = Depends(get_db)):
    """Get all vaccines"""
    vaccines = db.query(VaccineORM).all()
    return [
        Vaccine(
            name=v.name,
            frequency=v.frequency,
            firstDoseAge=v.firstDoseAge,
            kittenSchedule=str_to_list(v.kittenSchedule) if v.kittenSchedule else None,
            puppySchedule=str_to_list(v.puppySchedule) if v.puppySchedule else None,
            description=v.description,
            sideEffects=str_to_list(v.sideEffects) if v.sideEffects else None,
            ageRestriction=AgeRestriction(
                minWeeks=v.ageRestriction.minWeeks,
                maxYears=v.ageRestriction.maxYears,
            )
            if v.ageRestriction
            else None,
            lastUpdated=v.lastUpdated,
            commonTreatments=str_to_list(v.commonTreatments)
            if v.commonTreatments
            else None,
        )
        for v in vaccines
    ]


@age_router.get("/", response_model=List[AgeRestriction])
def get_age_restrictions(db: Session = Depends(get_db)):
    """Get all age restrictions"""
    restrictions = db.query(AgeRestrictionORM).all()
    return [
        AgeRestriction(
            minWeeks=r.minWeeks,
            maxYears=r.maxYears,
        )
        for r in restrictions
    ]
