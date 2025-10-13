from __future__ import annotations
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import Integer, String, Text, DateTime, Boolean, ForeignKey, JSON, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base
from datetime import datetime

if TYPE_CHECKING:
    from .user import UserORM
    from .service_type import ServiceTypeORM
    from .provider_review import ProviderReviewORM

class ProviderProfileORM(Base):
    """Enhanced provider profile with detailed information"""
    __tablename__ = "provider_profiles"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, nullable=False)
    
    # Basic info
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    experience_years: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    languages: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)
    
    # Service details
    hourly_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    service_radius_km: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # Service radius in km
    
    # Availability
    is_available: Mapped[bool] = mapped_column(Boolean, default=True)
    available_days: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)  # ["monday", "tuesday", etc.]
    available_hours_start: Mapped[Optional[str]] = mapped_column(String, nullable=True)  # "09:00"
    available_hours_end: Mapped[Optional[str]] = mapped_column(String, nullable=True)  # "17:00"
    
    # Verification and credentials
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    certifications: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)
    insurance_info: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Rating and reviews
    average_rating: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    total_reviews: Mapped[int] = mapped_column(Integer, default=0)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user: Mapped["UserORM"] = relationship("UserORM", back_populates="enhanced_provider_profile")
    services: Mapped[List["ServiceTypeORM"]] = relationship(
        "ServiceTypeORM", secondary="provider_profile_services", back_populates="enhanced_providers"
    )
    reviews: Mapped[List["ProviderReviewORM"]] = relationship("ProviderReviewORM", back_populates="provider")
    
    def __repr__(self):
        return f"<ProviderProfile(id={self.id}, user_id={self.user_id})>"

