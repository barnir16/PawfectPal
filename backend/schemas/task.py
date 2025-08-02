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
    pet_ids: List[int] = []
    attachments: List[str] = []  # Image URLs


class TaskCreate(TaskBase):
    pass


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
