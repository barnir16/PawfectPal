from __future__ import annotations
from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime
from .user import UserRead
from .service_type import ServiceTypeRead

class ProviderProfileBase(BaseModel):
    bio: Optional[str] = Field(None, max_length=1000, description="Provider bio")
    experience_years: Optional[int] = Field(None, ge=0, le=50, description="Years of experience")
    languages: Optional[List[str]] = Field(None, description="Languages spoken")
    hourly_rate: Optional[float] = Field(None, ge=0, description="Hourly rate")
    service_radius_km: Optional[int] = Field(None, ge=1, le=100, description="Service radius in km")
    is_available: bool = Field(True, description="Is currently available")
    available_days: Optional[List[str]] = Field(None, description="Available days")
    available_hours_start: Optional[str] = Field(None, description="Start time (HH:MM)")
    available_hours_end: Optional[str] = Field(None, description="End time (HH:MM)")
    certifications: Optional[List[str]] = Field(None, description="Certifications")
    insurance_info: Optional[str] = Field(None, max_length=500, description="Insurance information")

class ProviderProfileCreate(ProviderProfileBase):
    service_type_ids: List[int] = Field(..., min_items=1, description="Service types offered")

class ProviderProfileUpdate(BaseModel):
    bio: Optional[str] = Field(None, max_length=1000)
    experience_years: Optional[int] = Field(None, ge=0, le=50)
    languages: Optional[List[str]] = None
    hourly_rate: Optional[float] = Field(None, ge=0)
    service_radius_km: Optional[int] = Field(None, ge=1, le=100)
    is_available: Optional[bool] = None
    available_days: Optional[List[str]] = None
    available_hours_start: Optional[str] = None
    available_hours_end: Optional[str] = None
    certifications: Optional[List[str]] = None
    insurance_info: Optional[str] = Field(None, max_length=500)
    service_type_ids: Optional[List[int]] = None

class ProviderProfileRead(ProviderProfileBase):
    id: int
    user_id: int
    is_verified: bool
    average_rating: Optional[float]
    total_reviews: int
    created_at: datetime
    updated_at: datetime
    
    # Relationships
    user: Optional[UserRead] = None
    services: Optional[List[ServiceTypeRead]] = None
    
    class Config:
        from_attributes = True

class ProviderProfileSummary(BaseModel):
    """Summary view for browsing providers"""
    id: int
    user_id: int
    bio: Optional[str]
    experience_years: Optional[int]
    hourly_rate: Optional[float]
    is_available: bool
    average_rating: Optional[float]
    total_reviews: int
    user: UserRead
    services: List[ServiceTypeRead]
    
    class Config:
        from_attributes = True

