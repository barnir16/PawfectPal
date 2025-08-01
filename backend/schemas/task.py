from typing import List, Optional
from pydantic import BaseModel


class Task(BaseModel):
    id: Optional[int] = None
    title: str
    description: str
    dateTime: Optional[str]  # ISO datetime string
    repeatInterval: Optional[int] = None
    repeatUnit: Optional[str] = None
    petIds: List[int] = []
    attachments: List[str] = []  # Image URLs
