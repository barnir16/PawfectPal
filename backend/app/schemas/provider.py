from pydantic import BaseModel
from typing import List, Optional


# Base provider info
class ProviderExtras(BaseModel):
    is_provider: bool = False
    provider_services: Optional[List[int]] = None
    provider_rating: Optional[float] = None
    provider_bio: Optional[str] = None
    provider_hourly_rate: Optional[float] = None


# Update schema reuses ProviderExtras but makes all fields optional
class UserUpdateProvider(ProviderExtras):
    is_provider: Optional[bool] = None
    provider_services: Optional[List[str]] = None
    provider_rating: Optional[float] = None
    provider_bio: Optional[str] = None
    provider_hourly_rate: Optional[float] = None

    class Config:
        from_attributes = True
