from __future__ import annotations
from sqlalchemy import (
    Integer,
    String,
    Float,
    DateTime,
    Text,
    ForeignKey,
    Boolean,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base
from typing import Optional
from datetime import datetime


class WeightGoalORM(Base):
    """Weight goal entity for user-defined weight targets"""

    __tablename__ = "weight_goals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    pet_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("pets.id"), nullable=False
    )
    target_weight: Mapped[float] = mapped_column(Float, nullable=False)
    weight_unit: Mapped[str] = mapped_column(String, nullable=False, default="kg")
    goal_type: Mapped[str] = mapped_column(
        String, nullable=False, default="custom"
    )  # custom, external_api, vet_recommended
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    target_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    pet: Mapped["PetORM"] = relationship("PetORM", back_populates="weight_goals", lazy="selectin")
