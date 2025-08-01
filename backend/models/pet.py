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
from datetime import date, datetime


class PetORM(Base):
    """Pet entity with all pet-related information including GPS tracking"""

    __tablename__ = "pets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    breedType: Mapped[str] = mapped_column(String, nullable=False)
    breed: Mapped[str] = mapped_column(String, nullable=False)
    birthDate: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    age: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    isBirthdayGiven: Mapped[int] = mapped_column(
        Integer, default=0
    )  # Boolean as Integer for SQLite
    weightKg: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    photoUri: Mapped[Optional[str]] = mapped_column(
        String, nullable=True
    )  # Image URL/path
    healthIssues: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True
    )  # Comma-separated
    behaviorIssues: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True
    )  # Comma-separated

    # GPS tracking fields
    lastKnownLatitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    lastKnownLongitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    lastLocationUpdate: Mapped[Optional[datetime]] = mapped_column(
        DateTime, nullable=True
    )
    isTrackingEnabled: Mapped[bool] = mapped_column(Boolean, default=False)

    # Relationships
    user: Mapped["UserORM"] = relationship("UserORM", back_populates="pets")
    services: Mapped[list["ServiceORM"]] = relationship(
        "ServiceORM", back_populates="pet"
    )
    locationHistory: Mapped[list["LocationHistoryORM"]] = relationship(
        "LocationHistoryORM", back_populates="pet"
    )
