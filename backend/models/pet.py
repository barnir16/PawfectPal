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
    breed_type: Mapped[str] = mapped_column(String, nullable=False)
    breed: Mapped[str] = mapped_column(String, nullable=False)
    birth_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    age: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    is_birthday_given: Mapped[int] = mapped_column(
        Integer, default=0
    )  # Boolean as Integer for SQLite
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

    # GPS tracking fields
    last_known_latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    last_known_longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    last_location_update: Mapped[Optional[datetime]] = mapped_column(
        DateTime, nullable=True
    )
    is_tracking_enabled: Mapped[bool] = mapped_column(Boolean, default=False)

    # Relationships
    user: Mapped["UserORM"] = relationship("UserORM", back_populates="pets")
    services: Mapped[list["ServiceORM"]] = relationship(
        "ServiceORM", back_populates="pet"
    )
    location_history: Mapped[list["LocationHistoryORM"]] = relationship(
        "LocationHistoryORM", back_populates="pet"
    )
