from __future__ import annotations
from typing import Optional, TYPE_CHECKING
from sqlalchemy import Integer, String, Text, DateTime, ForeignKey, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base
from datetime import datetime

if TYPE_CHECKING:
    from .user import UserORM
    from .provider_profile import ProviderProfileORM

class ProviderReviewORM(Base):
    """Provider review and rating system"""
    __tablename__ = "provider_reviews"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    provider_id: Mapped[int] = mapped_column(ForeignKey("provider_profiles.id"), nullable=False)
    reviewer_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    service_request_id: Mapped[Optional[int]] = mapped_column(ForeignKey("service_requests.id"), nullable=True)
    
    # Review content
    rating: Mapped[int] = mapped_column(Integer, nullable=False)  # 1-5 stars
    title: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Service-specific rating
    service_type: Mapped[str] = mapped_column(String, nullable=False)  # The service that was reviewed
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    provider: Mapped["ProviderProfileORM"] = relationship("ProviderProfileORM", back_populates="reviews")
    reviewer: Mapped["UserORM"] = relationship("UserORM", foreign_keys=[reviewer_id])
    
    def __repr__(self):
        return f"<ProviderReview(id={self.id}, provider_id={self.provider_id}, rating={self.rating})>"