from __future__ import annotations
from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime
from .user import UserRead
from .pet import PetRead

class ServiceRequestBase(BaseModel):
    service_type: str = Field(..., description="Type of service requested")
    title: str = Field(..., min_length=5, max_length=100, description="Request title")
    description: str = Field(..., min_length=10, max_length=1000, description="Detailed description")
    pet_ids: List[int] = Field(..., min_items=1, description="Pet IDs to share with providers")
    location: Optional[str] = Field(None, max_length=200, description="Preferred location")
    preferred_dates: Optional[List[str]] = Field(None, description="Preferred dates")
    budget_min: Optional[int] = Field(None, ge=0, description="Minimum budget")
    budget_max: Optional[int] = Field(None, ge=0, description="Maximum budget")
    experience_years_min: Optional[int] = Field(None, ge=0, le=50, description="Minimum experience required")
    languages: Optional[List[str]] = Field(None, description="Required languages")
    special_requirements: Optional[str] = Field(None, max_length=500, description="Special requirements")
    is_urgent: bool = Field(False, description="Is this request urgent?")

class ServiceRequestCreate(ServiceRequestBase):
    pass

class ServiceRequestUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=5, max_length=100)
    description: Optional[str] = Field(None, min_length=10, max_length=1000)
    location: Optional[str] = Field(None, max_length=200)
    preferred_dates: Optional[List[str]] = None
    budget_min: Optional[int] = Field(None, ge=0)
    budget_max: Optional[int] = Field(None, ge=0)
    experience_years_min: Optional[int] = Field(None, ge=0, le=50)
    languages: Optional[List[str]] = None
    special_requirements: Optional[str] = Field(None, max_length=500)
    is_urgent: Optional[bool] = None
    status: Optional[str] = Field(None, pattern="^(open|in_progress|completed|closed)$")

class ServiceRequestRead(ServiceRequestBase):
    id: int
    user_id: int
    assigned_provider_id: Optional[int] = None
    status: str
    views_count: int
    responses_count: int
    created_at: datetime
    updated_at: datetime
    expires_at: Optional[datetime]
    
    # Relationships
    user: Optional[UserRead] = None
    assigned_provider: Optional[UserRead] = None
    pets: Optional[List[PetRead]] = None
    
    class Config:
        from_attributes = True

class ServiceRequestSummary(BaseModel):
    """Summary view for browsing requests"""
    id: int
    title: str
    service_type: str
    location: Optional[str]
    budget_min: Optional[int]
    budget_max: Optional[int]
    is_urgent: bool
    created_at: datetime
    views_count: int
    responses_count: int
    user: UserRead
    pets: List[PetRead]
    
    class Config:
        from_attributes = True