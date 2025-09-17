from __future__ import annotations
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import String, Integer, Boolean, Float, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base

if TYPE_CHECKING:
    from .pet import PetORM
    from .task import TaskORM
    from .service import ServiceORM
    from .provider import ProviderORM
    from .service_request import ServiceRequestORM
    from .chat_message import ChatMessageORM


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

    # OAuth information
    google_id: Mapped[Optional[str]] = mapped_column(String, nullable=True, unique=True)
    profile_picture_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    # Provider relationship
    is_provider: Mapped[bool] = mapped_column(Boolean, default=False)
    provider_services: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON array
    provider_rating: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    provider_bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    provider_hourly_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    provider_profile: Mapped[Optional["ProviderORM"]] = relationship(
        "ProviderORM", back_populates="user", uselist=False
    )

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
    service_requests: Mapped[List["ServiceRequestORM"]] = relationship("ServiceRequestORM", back_populates="user")
    chat_messages: Mapped[List["ChatMessageORM"]] = relationship("ChatMessageORM", back_populates="sender")
