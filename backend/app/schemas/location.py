from typing import Optional
from pydantic import BaseModel
from datetime import datetime


class LocationHistoryBase(BaseModel):
    latitude: float
    longitude: float
    timestamp: datetime  # ISO datetime string
    accuracy: Optional[float] = None
    speed: Optional[float] = None
    altitude: Optional[float] = None


class LocationHistoryUpdate(LocationHistoryBase):
    pass


class LocationHistoryRead(LocationHistoryBase):
    pet_id: int

    class Config:
        from_attributes = True
