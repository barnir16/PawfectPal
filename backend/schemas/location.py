from typing import Optional
from pydantic import BaseModel


class LocationHistory(BaseModel):
    id: Optional[int] = None
    pet_id: int
    latitude: float
    longitude: float
    timestamp: str  # ISO datetime string
    accuracy: Optional[float] = None
    speed: Optional[float] = None
    altitude: Optional[float] = None
