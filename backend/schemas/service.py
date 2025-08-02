from typing import List, Optional
from pydantic import BaseModel
from models import ServiceType, ServiceStatus


class ServiceBase(BaseModel):
    pet_id: int
    service_type: ServiceType
    status: ServiceStatus = ServiceStatus.PENDING
    start_datetime: str  # ISO datetime string
    end_datetime: Optional[str] = None  # ISO datetime string
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


class ServiceRead(ServiceBase):
    id: int

    class Config:
        from_attributes = True
