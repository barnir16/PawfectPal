from __future__ import annotations
from typing import Optional
from pydantic import BaseModel, Field

class ServiceTypeBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=50, description="Service type name")
    description: Optional[str] = Field(None, max_length=200, description="Service description")

class ServiceTypeCreate(ServiceTypeBase):
    pass

class ServiceTypeUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=50)
    description: Optional[str] = Field(None, max_length=200)

class ServiceTypeRead(ServiceTypeBase):
    id: int
    
    class Config:
        from_attributes = True

