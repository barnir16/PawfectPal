from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator


class ProviderReviewCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None


class ProviderReviewRead(BaseModel):
    id: int
    provider_id: int
    user_id: int
    service_request_id: Optional[int] = None
    rating: int
    comment: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
