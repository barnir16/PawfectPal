from typing import Optional, List
from pydantic import BaseModel
from datetime import date, datetime


class VaccinationBase(BaseModel):
    vaccine_name: str
    date_administered: date
    next_due_date: Optional[date] = None
    batch_number: Optional[str] = None
    manufacturer: Optional[str] = None
    veterinarian: str
    clinic: str
    dose_number: Optional[int] = None
    notes: Optional[str] = None
    is_completed: bool = True
    reminder_sent: bool = False


class VaccinationCreate(VaccinationBase):
    pet_id: int


class VaccinationUpdate(VaccinationBase):
    pass


class VaccinationRead(VaccinationBase):
    id: int
    pet_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Response models
class VaccinationListResponse(BaseModel):
    vaccinations: List[VaccinationRead]
    total: int
    page: int
    page_size: int


class VaccinationSummary(BaseModel):
    pet_id: int
    total_vaccinations: int
    up_to_date: bool
    next_due_date: Optional[date] = None
    overdue_count: int
    completed_series: List[str]  # Completed vaccination series


class VaccinationReminder(BaseModel):
    vaccination_id: int
    pet_id: int
    pet_name: str
    vaccine_name: str
    due_date: date
    days_until_due: int
    is_overdue: bool


class VaccinationSchedule(BaseModel):
    """Standard vaccination schedule for different pet types"""
    pet_type: str  # dog, cat, etc.
    vaccines: List[dict]  # List of vaccines with timing info

