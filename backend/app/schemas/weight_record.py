from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class WeightRecordBase(BaseModel):
    """Base weight record schema.

    Field names are plain snake_case, matching every other Create/Update
    schema in this codebase (PetCreate, VaccinationCreate, etc.). This used
    to declare pydantic v1-style camelCase aliases (petId/weightUnit), but
    that config used the old `allow_population_by_field_name`/`fields`
    keys, which pydantic v2 silently ignores -- so the aliases never
    actually worked, they just made the API demand camelCase input while
    the frontend (frontend/src/services/weight/weightService.ts) already
    sends snake_case. Removed rather than migrated, since nothing relies
    on camelCase here.
    """
    weight: float = Field(..., gt=0, description="Weight value")
    weight_unit: str = Field(default="kg", description="Weight unit (kg or lbs)")
    date: datetime = Field(..., description="Date of weight measurement")
    notes: Optional[str] = Field(None, description="Additional notes about the weight record")
    source: str = Field(default="manual", description="Source of the weight record (manual, vet, auto)")


class WeightRecordCreate(WeightRecordBase):
    """Schema for creating a new weight record"""
    pet_id: int = Field(..., description="ID of the pet")


class WeightRecordUpdate(BaseModel):
    """Schema for updating a weight record"""
    weight: Optional[float] = Field(None, gt=0, description="Weight value")
    weight_unit: Optional[str] = Field(None, description="Weight unit (kg or lbs)")
    date: Optional[datetime] = Field(None, description="Date of weight measurement")
    notes: Optional[str] = Field(None, description="Additional notes about the weight record")
    source: Optional[str] = Field(None, description="Source of the weight record")


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
