from __future__ import annotations
from typing import Optional, TYPE_CHECKING
from sqlalchemy import Integer, String, Text, DateTime, Float, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base
from datetime import datetime

if TYPE_CHECKING:
    from .user import UserORM
    from .service_request import ServiceRequestORM


class ServiceRequestResponseORM(Base):
    """A provider's response to a service request (marketplace post).

    One row per provider per request — enforced by a unique constraint
    matching the one already present in the production database (added by
    the add_marketplace_functionality migration, but never previously wired
    up to any application code).
    """

    __tablename__ = "service_request_responses"
    __table_args__ = (
        UniqueConstraint("service_request_id", "provider_id", name="unique_provider_response"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    service_request_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("service_requests.id"), nullable=False, index=True
    )
    provider_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    bid_amount: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String, default="pending", index=True)  # pending, accepted, declined
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    service_request: Mapped["ServiceRequestORM"] = relationship(
        "ServiceRequestORM", back_populates="responses"
    )
    provider: Mapped["UserORM"] = relationship("UserORM", foreign_keys=[provider_id])

    def __repr__(self):
        return (
            f"<ServiceRequestResponse(id={self.id}, "
            f"service_request_id={self.service_request_id}, "
            f"provider_id={self.provider_id}, status='{self.status}')>"
        )
