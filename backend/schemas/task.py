from typing import List, Optional
from pydantic import BaseModel, field_validator
from datetime import datetime
import json


class TaskBase(BaseModel):
    title: str
    description: str
    date_time: Optional[datetime]  # ISO datetime string
    repeat_interval: Optional[int] = None
    repeat_unit: Optional[str] = None
    repeat_end_date: Optional[datetime] = None
    pet_ids: List[int] = []
    attachments: List[str] = []  # Image URLs
    priority: Optional[str] = "medium"  # low, medium, high, urgent
    status: Optional[str] = "pending"  # pending, in_progress, completed, cancelled
    is_completed: Optional[bool] = False


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    date_time: Optional[datetime] = None
    repeat_interval: Optional[int] = None
    repeat_unit: Optional[str] = None
    repeat_end_date: Optional[datetime] = None
    pet_ids: Optional[List[int]] = None
    attachments: Optional[List[str]] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    is_completed: Optional[bool] = None


class TaskRead(TaskBase):
    id: int

    @field_validator("attachments", mode="before")
    @classmethod
    def validate_attachments(cls, v):
        if isinstance(v, str):
            # If it's a JSON string (from DB), parse it into a list
            return json.loads(v)
        return v

    class Config:
        from_attributes = True
