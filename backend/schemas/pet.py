from typing import Optional
from pydantic import BaseModel
from datetime import date, datetime


class PetBase(BaseModel):
    name: str
    breed_type: str
    breed: str
    birth_date: Optional[date] = None  # ISO date string
    age: Optional[int] = None
    is_birthday_given: bool = False
    weight_kg: Optional[float] = None
    photo_uri: Optional[str] = None
    health_issues: Optional[str] = None
    behavior_issues: Optional[str] = None

    # GPS tracking
    last_known_latitude: Optional[float] = None
    last_known_longitude: Optional[float] = None
    last_location_update: Optional[datetime] = None  # ISO datetime string
    is_tracking_enabled: bool = False


class PetCreate(PetBase):
    pass


class PetUpdate(PetBase):
    pass


class PetRead(PetBase):
    id: int

    class Config:
        from_attributes = True
