from __future__ import annotations
from datetime import datetime
from typing import Optional

from sqlalchemy import Integer, Text, ForeignKey, DateTime, SmallInteger
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class ProviderReviewORM(Base):
    __tablename__ = "provider_reviews"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    provider_id: Mapped[int] = mapped_column(Integer, ForeignKey("providers.id"), index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), index=True)
    # Optional link to a specific service request (not enforced for MVP)
    service_request_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("service_requests.id"), nullable=True)

    rating: Mapped[int] = mapped_column(SmallInteger, nullable=False)  # 1-5
    comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships (optional for now)
    provider = relationship("ProviderORM", backref="reviews")
    user = relationship("UserORM")
    service_request = relationship("ServiceRequestORM")
