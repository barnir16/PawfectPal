from __future__ import annotations
from typing import Optional, TYPE_CHECKING
from sqlalchemy import Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base, ServiceStatus
from datetime import datetime

if TYPE_CHECKING:
    from .pet import PetORM
    from .user import UserORM


class ServiceORM(Base):
    """Service booking entity for pet walking, sitting, boarding, etc."""

    __tablename__ = "services"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False
    )
    pet_id: Mapped[int] = mapped_column(Integer, ForeignKey("pets.id"), nullable=False)
    service_type: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(
        String, nullable=False, default=ServiceStatus.PENDING
    )

    # Service details
    start_datetime: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_datetime: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    duration_hours: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    price: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    currency: Mapped[str] = mapped_column(String, default="USD")

    # Location and tracking
    pickup_address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    dropoff_address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    pickup_latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    pickup_longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    dropoff_latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    dropoff_longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Service provider info
    provider_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=True
    )
    provider_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    customer_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Images and documentation
    before_images: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True
    )  # JSON array
    after_images: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True
    )  # JSON array
    service_report: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    user: Mapped["UserORM"] = relationship(
        "UserORM", foreign_keys=[user_id], back_populates="booked_services"
    )
    pet: Mapped["PetORM"] = relationship("PetORM", back_populates="services")
    provider: Mapped[Optional["UserORM"]] = relationship(
        "UserORM", foreign_keys=[provider_id]
    )
