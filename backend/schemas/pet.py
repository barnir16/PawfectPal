from typing import List, Optional
from pydantic import BaseModel


class Pet(BaseModel):
    id: Optional[int] = None
    name: str
    breedType: str
    breed: str
    birthDate: Optional[str] = None  # ISO date string
    age: Optional[int] = None
    isBirthdayGiven: bool = False
    weightKg: Optional[float] = None
    photoUri: Optional[str] = None
    healthIssues: List[str] = []
    behaviorIssues: List[str] = []

    # GPS tracking
    lastKnownLatitude: Optional[float] = None
    lastKnownLongitude: Optional[float] = None
    lastLocationUpdate: Optional[str] = None  # ISO datetime string
    isTrackingEnabled: bool = False
