from typing import List, Optional
from pydantic import BaseModel
from datetime import date, datetime


class PetBase(BaseModel):
    name: str
    breedType: str
    breed: str
    birthDate: Optional[date] = None  # ISO date string
    age: Optional[int] = None
    isBirthdayGiven: bool = False
    weightKg: Optional[float] = None
    photoUri: Optional[str] = None
    healthIssues: List[str] = []
    behaviorIssues: List[str] = []

    # GPS tracking
    lastKnownLatitude: Optional[float] = None
    lastKnownLongitude: Optional[float] = None
    lastLocationUpdate: Optional[datetime] = None  # ISO datetime string
    isTrackingEnabled: bool = False


class PetCreate(PetBase):
    pass


class PetUpdate(PetBase):
    pass


class PetRead(PetBase):
    id: int

    class Config:
        from_attributes = True
