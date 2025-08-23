from __future__ import annotations
from typing import Optional, TYPE_CHECKING, List
from sqlalchemy import Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base
from datetime import datetime
import json

if TYPE_CHECKING:
    from .user import UserORM


class TaskORM(Base):
    """Task entity for scheduling pet care activities"""

    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    date_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    repeat_interval: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    repeat_unit: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    repeat_end_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    _pet_ids: Mapped[Optional[str]] = mapped_column(
        "pet_ids", String, nullable=True
    )  # Comma-separated pet IDs
    _attachments: Mapped[Optional[str]] = mapped_column(
        "attachments", Text, nullable=True
    )  # JSON array of image URLs
    
    # Task status and priority
    priority: Mapped[str] = mapped_column(String, nullable=False, default="medium")
    status: Mapped[str] = mapped_column(String, nullable=False, default="pending")
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)

    @property
    def pet_ids(self) -> List[int]:
        if self._pet_ids:
            return [int(pid) for pid in self._pet_ids.split(",") if pid]
        return []

    @pet_ids.setter
    def pet_ids(self, value: List[int]):
        self._pet_ids = ",".join(str(pid) for pid in value)

    @property
    def attachments(self) -> List[str]:
        if self._attachments:
            return json.loads(self._attachments)
        return []

    @attachments.setter
    def attachments(self, value: List[str]):
        self._attachments = json.dumps(value)

    # Relationships
    user: Mapped["UserORM"] = relationship("UserORM", back_populates="tasks")
