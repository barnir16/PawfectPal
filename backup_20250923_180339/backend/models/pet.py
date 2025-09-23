from __future__ import annotations
from sqlalchemy import (
    Integer,
    String,
    Float,
    Date,
    DateTime,
    Text,
    Boolean,
    ForeignKey,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base
from typing import Optional
from .user import UserORM
from .service import ServiceORM
from .location import LocationHistoryORM
from .weight_record import WeightRecordORM
from .weight_goal import WeightGoalORM
from datetime import date, datetime


class PetORM(Base):
    """Pet entity with all pet-related information including GPS tracking"""

    __tablename__ = "pets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    breed_type: Mapped[str] = mapped_column(String, nullable=False)
    breed: Mapped[str] = mapped_column(String, nullable=False)
    birth_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    age: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    is_birthday_given: Mapped[bool] = mapped_column(
        Boolean, default=False
    )  # Boolean field
    weight_kg: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    photo_uri: Mapped[Optional[str]] = mapped_column(
        String, nullable=True
    )  # Image URL/path
    health_issues: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True
    )  # Comma-separated
    behavior_issues: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True
    )  # Comma-separated

    # Additional pet information fields
    gender: Mapped[str] = mapped_column(String, nullable=False, default="unknown")
    weight_unit: Mapped[str] = mapped_column(String, nullable=False, default="kg")
    color: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    microchip_number: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    is_neutered: Mapped[bool] = mapped_column(Boolean, default=False)
    is_vaccinated: Mapped[bool] = mapped_column(Boolean, default=False)
    is_microchipped: Mapped[bool] = mapped_column(Boolean, default=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Medical records
    last_vet_visit: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    next_vet_visit: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    vet_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    vet_phone: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    vet_address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    medical_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # GPS tracking fields
    last_known_latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    last_known_longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    last_location_update: Mapped[Optional[datetime]] = mapped_column(
        DateTime, nullable=True
    )
    is_tracking_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    is_lost: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Metadata
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Relationships
    user: Mapped["UserORM"] = relationship("UserORM", back_populates="pets", lazy="selectin", foreign_keys=[user_id])
    services: Mapped[list["ServiceORM"]] = relationship(
        "ServiceORM", back_populates="pet", lazy="selectin"
    )
    location_history: Mapped[list["LocationHistoryORM"]] = relationship(
        "LocationHistoryORM", back_populates="pet", lazy="selectin"
    )
    medical_records: Mapped[list["MedicalRecordORM"]] = relationship(
        "MedicalRecordORM", back_populates="pet", lazy="selectin"
    )
    vaccinations: Mapped[list["VaccinationORM"]] = relationship(
        "VaccinationORM", back_populates="pet", lazy="selectin"
    )
    weight_records: Mapped[list["WeightRecordORM"]] = relationship(
        "WeightRecordORM", back_populates="pet", lazy="selectin"
    )
    weight_goals: Mapped[list["WeightGoalORM"]] = relationship(
        "WeightGoalORM", back_populates="pet", lazy="selectin"
    )
