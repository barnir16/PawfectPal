from __future__ import annotations
from typing import Optional, List
from sqlalchemy import Integer, Float, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base


class ProviderORM(Base):
    __tablename__ = "providers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)

    # Provider-specific info
    services: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True
    )  # JSON/text list
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    hourly_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    rating: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Relationship back to User
    user = relationship("UserORM", back_populates="provider_profile")
