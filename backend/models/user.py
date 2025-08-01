from __future__ import annotations
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import String, Integer, Boolean, Float, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base


if TYPE_CHECKING:
    from .pet import PetORM
    from .task import TaskORM
    from .service import ServiceORM


class UserORM(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(
        String, unique=True, nullable=False, index=True
    )
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Profile information
    email: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    full_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    profile_image: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    # Service provider information
    is_provider: Mapped[bool] = mapped_column(Boolean, default=False)
    provider_services: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    provider_rating: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    provider_bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    provider_hourly_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Address information
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    state: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    country: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    postal_code: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Relationships
    pets: Mapped[List["PetORM"]] = relationship("PetORM", back_populates="user")
    tasks: Mapped[List["TaskORM"]] = relationship("TaskORM", back_populates="user")
    booked_services: Mapped[List["ServiceORM"]] = relationship(
        "ServiceORM", foreign_keys="ServiceORM.user_id", back_populates="user"
    )
