from typing import Optional
from pydantic import BaseModel


class LocationHistoryBase(BaseModel):
    pet_id: int
    latitude: float
    longitude: float
    timestamp: str  # ISO datetime string
    accuracy: Optional[float] = None
    speed: Optional[float] = None
    altitude: Optional[float] = None


class LocationHistoryCreate(LocationHistoryBase):
    pass


class LocationHistoryRead(LocationHistoryBase):
    id: int

    class Config:
        from_attributes = True
