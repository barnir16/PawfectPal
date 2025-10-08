from __future__ import annotations
from typing import Optional, TYPE_CHECKING, List
from sqlalchemy import Integer, String, Text, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base
from datetime import datetime

if TYPE_CHECKING:
    from .pet import PetORM
    from .user import UserORM
    from .chat_message import ChatMessageORM

class ServiceRequestORM(Base):
    """Service request entity - users post requests for services"""
    __tablename__ = "service_requests"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Service details
    service_type: Mapped[str] = mapped_column(String, nullable=False)  # walking, sitting, etc.
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    
    # Pet data to share with providers
    pet_ids: Mapped[List[int]] = mapped_column(JSON, nullable=False)  # List of pet IDs to share
    
    # Location and timing
    location: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    preferred_dates: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)  # List of preferred dates
    budget_min: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    budget_max: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Requirements
    experience_years_min: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    languages: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)
    special_requirements: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Provider assignment
    assigned_provider_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Status and metadata
    status: Mapped[str] = mapped_column(String, default="open")  # open, in_progress, completed, closed
    is_urgent: Mapped[bool] = mapped_column(Boolean, default=False)
    views_count: Mapped[int] = mapped_column(Integer, default=0)
    responses_count: Mapped[int] = mapped_column(Integer, default=0)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Relationships
    user: Mapped["UserORM"] = relationship("UserORM", back_populates="service_requests")
    # assigned_provider: Mapped[Optional["UserORM"]] = relationship("UserORM", foreign_keys=[assigned_provider_id])  # Temporarily disabled until DB migration
    pets: Mapped[List["PetORM"]] = relationship("PetORM", secondary="service_request_pets")
    chat_messages: Mapped[List["ChatMessageORM"]] = relationship("ChatMessageORM", back_populates="service_request")
    
    def __repr__(self):
        return f"<ServiceRequest(id={self.id}, title='{self.title}', service_type='{self.service_type}')>"