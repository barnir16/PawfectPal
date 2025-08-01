from typing import List, Optional
from pydantic import BaseModel


class UserCreate(BaseModel):
    username: str
    password: str
    email: Optional[str] = None
    full_name: Optional[str] = None


class User(BaseModel):
    id: int
    username: str
    is_active: bool
    email: Optional[str] = None
    phone: Optional[str] = None
    full_name: Optional[str] = None
    profile_image: Optional[str] = None
    is_provider: bool = False
    provider_services: Optional[List[str]] = None
    provider_rating: Optional[float] = None
    provider_bio: Optional[str] = None
    provider_hourly_rate: Optional[float] = None

    class Config:
        from_attributes = True
