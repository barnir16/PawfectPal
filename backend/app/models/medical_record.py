from __future__ import annotations
from sqlalchemy import (
    Integer,
    String,
    Text,
    Date,
    DateTime,
    ForeignKey,
    Boolean,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base
from typing import Optional, TYPE_CHECKING
from datetime import date, datetime

if TYPE_CHECKING:
    from .pet import PetORM


class MedicalRecordORM(Base):
    """Medical record entity for tracking pet medical history"""

    __tablename__ = "medical_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    pet_id: Mapped[int] = mapped_column(Integer, ForeignKey("pets.id"), nullable=False)
    record_type: Mapped[str] = mapped_column(
        String, nullable=False
    )  # vaccination, checkup, surgery, etc.
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    veterinarian: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    clinic: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    follow_up_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    attachments: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True
    )  # JSON array of file URLs
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    pet: Mapped["PetORM"] = relationship(
        "PetORM", back_populates="medical_records", lazy="selectin"
    )
