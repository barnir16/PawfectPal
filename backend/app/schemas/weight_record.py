from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class WeightRecordBase(BaseModel):
    """Base weight record schema"""
    weight: float = Field(..., gt=0, description="Weight value")
    weight_unit: str = Field(default="kg", description="Weight unit (kg or lbs)")
    date: datetime = Field(..., description="Date of weight measurement")
    notes: Optional[str] = Field(None, description="Additional notes about the weight record")
    source: str = Field(default="manual", description="Source of the weight record (manual, vet, auto)")

    class Config:
        # Allow both camelCase and snake_case field names
        allow_population_by_field_name = True
        # Define field aliases for camelCase inputs
        fields = {
            'weight_unit': {'alias': 'weightUnit'},
            'pet_id': {'alias': 'petId'}
        }


class WeightRecordCreate(WeightRecordBase):
    """Schema for creating a new weight record"""
    pet_id: int = Field(..., description="ID of the pet", alias="petId")

    class Config:
        # Allow both camelCase and snake_case field names
        allow_population_by_field_name = True


class WeightRecordUpdate(BaseModel):
    """Schema for updating a weight record"""
    weight: Optional[float] = Field(None, gt=0, description="Weight value")
    weight_unit: Optional[str] = Field(None, description="Weight unit (kg or lbs)", alias="weightUnit")
    date: Optional[datetime] = Field(None, description="Date of weight measurement")
    notes: Optional[str] = Field(None, description="Additional notes about the weight record")
    source: Optional[str] = Field(None, description="Source of the weight record")

    class Config:
        # Allow both camelCase and snake_case field names
        allow_population_by_field_name = True


class WeightRecordResponse(WeightRecordBase):
    """Schema for weight record responses"""
    id: int
    pet_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class WeightRecordWithPet(WeightRecordResponse):
    """Schema for weight record with pet information"""
    pet_name: str
    pet_type: str
