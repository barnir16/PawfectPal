from typing import List, Optional
from pydantic import BaseModel


class AgeRestriction(BaseModel):
    min_weeks: Optional[int] = None
    max_years: Optional[int] = None


class Vaccine(BaseModel):
    name: str
    frequency: str
    first_doseAge: Optional[str] = None
    kitten_schedule: Optional[List[str]] = None
    puppy_schedule: Optional[List[str]] = None
    description: str
    side_effects: Optional[List[str]] = None
    age_restriction: Optional[AgeRestriction] = None
    last_updated: str
    common_treatments: Optional[List[str]] = None
