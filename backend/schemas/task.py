from typing import List, Optional
from pydantic import BaseModel


class TaskBase(BaseModel):
    title: str
    description: str
    dateTime: Optional[str]  # ISO datetime string
    repeatInterval: Optional[int] = None
    repeatUnit: Optional[str] = None
    petIds: List[int] = []
    attachments: List[str] = []  # Image URLs


class TaskCreate(TaskBase):
    pass


class TaskRead(TaskBase):
    id: int

    class Config:
        from_attributes = True
