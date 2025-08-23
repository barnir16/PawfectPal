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
from typing import Optional
from datetime import date, datetime


class VaccinationORM(Base):
    """Vaccination record entity for tracking pet vaccinations"""

    __tablename__ = "vaccinations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    pet_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("pets.id"), nullable=False
    )
    vaccine_name: Mapped[str] = mapped_column(String, nullable=False)
    date_administered: Mapped[date] = mapped_column(Date, nullable=False)
    next_due_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    batch_number: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    manufacturer: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    veterinarian: Mapped[str] = mapped_column(String, nullable=False)
    clinic: Mapped[str] = mapped_column(String, nullable=False)
    dose_number: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # For multi-dose vaccines
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=True)
    reminder_sent: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    pet: Mapped["PetORM"] = relationship("PetORM", back_populates="vaccinations", lazy="selectin")
