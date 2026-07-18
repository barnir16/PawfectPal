from __future__ import annotations
from typing import Optional
from pydantic import BaseModel
from datetime import datetime


class ServiceRequestResponseRead(BaseModel):
    id: int
    service_request_id: int
    provider_id: int
    bid_amount: Optional[float] = None
    message: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
