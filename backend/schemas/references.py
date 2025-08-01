from typing import List, Optional
from pydantic import BaseModel


class AgeRestriction(BaseModel):
    minWeeks: Optional[int] = None
    maxYears: Optional[int] = None


class Vaccine(BaseModel):
    name: str
    frequency: str
    firstDoseAge: Optional[str] = None
    kittenSchedule: Optional[List[str]] = None
    puppySchedule: Optional[List[str]] = None
    description: str
    sideEffects: Optional[List[str]] = None
    ageRestriction: Optional[AgeRestriction] = None
    lastUpdated: str
    commonTreatments: Optional[List[str]] = None
