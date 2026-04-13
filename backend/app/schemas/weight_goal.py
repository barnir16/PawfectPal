from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class WeightGoalBase(BaseModel):
    """Base weight goal schema"""
    target_weight: float = Field(..., gt=0, description="Target weight value")
    weight_unit: str = Field(default="kg", description="Weight unit (kg or lbs)")
    goal_type: str = Field(default="custom", description="Type of goal (custom, external_api, vet_recommended)")
    description: Optional[str] = Field(None, description="Description of the weight goal")
    is_active: bool = Field(default=True, description="Whether the goal is currently active")
    target_date: Optional[datetime] = Field(None, description="Target date to achieve the goal")


class WeightGoalCreate(WeightGoalBase):
    """Schema for creating a new weight goal"""
    pet_id: int = Field(..., description="ID of the pet")


class WeightGoalUpdate(BaseModel):
    """Schema for updating a weight goal"""
    pet_id: Optional[int] = Field(None, description="ID of the pet")
    target_weight: Optional[float] = Field(None, gt=0, description="Target weight value")
    weight_unit: Optional[str] = Field(None, description="Weight unit (kg or lbs)")
    goal_type: Optional[str] = Field(None, description="Type of goal")
    description: Optional[str] = Field(None, description="Description of the weight goal")
    is_active: Optional[bool] = Field(None, description="Whether the goal is currently active")
    target_date: Optional[datetime] = Field(None, description="Target date to achieve the goal")


class WeightGoalResponse(WeightGoalBase):
    """Schema for weight goal responses"""
    id: int
    pet_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class WeightGoalWithPet(WeightGoalResponse):
    """Schema for weight goal with pet information"""
    pet_name: str
    pet_type: str
