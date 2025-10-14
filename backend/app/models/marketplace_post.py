from __future__ import annotations
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import Integer, String, Text, DateTime, Boolean, ForeignKey, JSON, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base
from datetime import datetime

if TYPE_CHECKING:
    from .pet import PetORM
    from .user import UserORM
    from .chat_message import ChatMessageORM
    from .service_type import ServiceTypeORM

class MarketplacePostORM(Base):
    """Marketplace post entity - users create posts that all providers can see"""
    __tablename__ = "marketplace_posts"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Post details
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    service_type: Mapped[str] = mapped_column(String, nullable=False)  # walking, sitting, etc.
    
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
    user: Mapped["UserORM"] = relationship("UserORM", foreign_keys=[user_id], back_populates="marketplace_posts")
    pets: Mapped[List["PetORM"]] = relationship("PetORM", secondary="marketplace_post_pets")
    
    def __repr__(self):
        return f"<MarketplacePost(id={self.id}, title='{self.title}', service_type='{self.service_type}')>"

