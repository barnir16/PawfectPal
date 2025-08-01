from __future__ import annotations
from typing import Optional, TYPE_CHECKING
from sqlalchemy import Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base
from datetime import datetime

if TYPE_CHECKING:
    from .user import UserORM


class TaskORM(Base):
    """Task entity for scheduling pet care activities"""

    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    dateTime: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    repeatInterval: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    repeatUnit: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    petIds: Mapped[Optional[str]] = mapped_column(
        String, nullable=True
    )  # Comma-separated pet IDs
    attachments: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True
    )  # JSON array of image URLs

    # Relationships
    user: Mapped["UserORM"] = relationship("UserORM", back_populates="tasks")
