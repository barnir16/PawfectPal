from __future__ import annotations
from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime
from .user import UserRead

class ProviderReviewBase(BaseModel):
    rating: int = Field(..., ge=1, le=5, description="Rating from 1 to 5 stars")
    title: Optional[str] = Field(None, max_length=100, description="Review title")
    comment: Optional[str] = Field(None, max_length=1000, description="Review comment")
    service_type: str = Field(..., description="The service that was reviewed")

class ProviderReviewCreate(ProviderReviewBase):
    provider_id: int = Field(..., description="Provider being reviewed")
    service_request_id: Optional[int] = Field(None, description="Related service request")

class ProviderReviewUpdate(BaseModel):
    rating: Optional[int] = Field(None, ge=1, le=5)
    title: Optional[str] = Field(None, max_length=100)
    comment: Optional[str] = Field(None, max_length=1000)

class ProviderReviewRead(ProviderReviewBase):
    id: int
    provider_id: int
    reviewer_id: int
    service_request_id: Optional[int]
    created_at: datetime
    updated_at: datetime
    
    # Relationships
    reviewer: Optional[UserRead] = None
    
    class Config:
        from_attributes = True