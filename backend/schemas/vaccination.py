from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime

class VaccinationBase(BaseModel):
    vaccine_name: str = Field(..., min_length=1, max_length=255)
    vaccine_type: Optional[str] = Field(default="Core", max_length=100)
    date_administered: date
    next_due_date: Optional[date] = None
    batch_number: Optional[str] = Field(None, max_length=100)
    manufacturer: Optional[str] = Field(None, max_length=255)
    veterinarian: str = Field(..., min_length=1, max_length=255)
    clinic: str = Field(..., min_length=1, max_length=255)
    dose_number: Optional[int] = Field(default=1, ge=1)
    notes: Optional[str] = None
    is_completed: bool = Field(default=True)
    reminder_sent: bool = Field(default=False)

class VaccinationCreate(VaccinationBase):
    pet_id: int

class VaccinationUpdate(VaccinationBase):
    pass

class VaccinationResponse(VaccinationBase):
    id: int
    pet_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class VaccinationSummary(BaseModel):
    pet_id: int
    total_vaccinations: int
    up_to_date: bool
    next_due_date: Optional[date] = None
    overdue_count: int
    due_soon_count: int
    completed_series: List[str]

class VaccinationListResponse(BaseModel):
    vaccinations: List[VaccinationResponse]
    total: int
    page: int
    page_size: int

class VaccinationReminder(BaseModel):
    vaccination_id: int
    pet_id: int
    pet_name: str
    vaccine_name: str
    due_date: date
    days_until_due: int
    is_overdue: bool