from typing import Optional, List
from pydantic import BaseModel
from datetime import date, datetime


class MedicalRecordBase(BaseModel):
    record_type: str  # vaccination, checkup, surgery, illness, injury, medication, other
    title: str
    description: Optional[str] = None
    date: date
    veterinarian: Optional[str] = None
    clinic: Optional[str] = None
    follow_up_date: Optional[date] = None
    attachments: Optional[str] = None  # JSON string of file URLs
    notes: Optional[str] = None
    is_completed: bool = True


class MedicalRecordCreate(MedicalRecordBase):
    pet_id: int


class MedicalRecordUpdate(MedicalRecordBase):
    pass


class MedicalRecordRead(MedicalRecordBase):
    id: int
    pet_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Response models for API
class MedicalRecordListResponse(BaseModel):
    records: List[MedicalRecordRead]
    total: int
    page: int
    page_size: int


class MedicalRecordSummary(BaseModel):
    pet_id: int
    total_records: int
    recent_checkup: Optional[date] = None
    next_followup: Optional[date] = None
    vaccination_count: int
    surgery_count: int

