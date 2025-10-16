from typing import List, Optional
from pydantic import BaseModel, field_validator
from app.models import ServiceType, ServiceStatus
from datetime import datetime
import json


class ServiceBase(BaseModel):
    pet_id: int
    service_type: str
    status: ServiceStatus = ServiceStatus.PENDING
    start_datetime: datetime  # ISO datetime string
    end_datetime: Optional[datetime] = None  # ISO datetime string
    duration_hours: Optional[float] = None
    price: Optional[float] = None
    currency: str = "USD"

    # Location
    pickup_address: Optional[str] = None
    dropoff_address: Optional[str] = None
    pickup_latitude: Optional[float] = None
    pickup_longitude: Optional[float] = None
    dropoff_latitude: Optional[float] = None
    dropoff_longitude: Optional[float] = None

    # Provider info
    provider_id: Optional[int] = None
    provider_notes: Optional[str] = None
    customer_notes: Optional[str] = None

    # Images and documentation
    before_images: List[str] = []
    after_images: List[str] = []
    service_report: Optional[str] = None


class ServiceCreate(ServiceBase):
    pass


class ServiceUpdate(BaseModel):
    """Schema for updating services - all fields are optional"""

    pet_id: Optional[int] = None
    service_type: Optional[ServiceType] = None
    status: Optional[ServiceStatus] = None
    start_datetime: Optional[datetime] = None
    end_datetime: Optional[datetime] = None
    duration_hours: Optional[float] = None
    price: Optional[float] = None
    currency: Optional[str] = None
    pickup_address: Optional[str] = None
    dropoff_address: Optional[str] = None
    pickup_latitude: Optional[float] = None
    pickup_longitude: Optional[float] = None
    dropoff_latitude: Optional[float] = None
    dropoff_longitude: Optional[float] = None
    provider_id: Optional[int] = None
    provider_notes: Optional[str] = None
    customer_notes: Optional[str] = None
    before_images: Optional[List[str]] = None
    after_images: Optional[List[str]] = None
    service_report: Optional[str] = None


class ServiceRead(ServiceBase):
    id: int
    service_type: Optional[str] = None

    @field_validator("before_images", "after_images", mode="before")
    @classmethod
    def validate_image_lists(cls, v):
        if isinstance(v, str):
            # This is the raw JSON string from the database.
            # We explicitly deserialize it here.
            return json.loads(v)
        # If it's already a list, or None, let it pass through.
        return v

    class Config:
        from_attributes = True
