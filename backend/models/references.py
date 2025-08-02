from __future__ import annotations
from typing import List, Optional
from sqlalchemy import Integer, String, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base


class AgeRestrictionORM(Base):
    """Age restrictions for vaccines and treatments"""

    __tablename__ = "age_restrictions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    min_weeks: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    max_years: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    vaccines: Mapped[List[VaccineORM]] = relationship(
        "VaccineORM", back_populates="age_restriction"
    )


class VaccineORM(Base):
    """Vaccine information and scheduling"""

    __tablename__ = "vaccines"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    frequency: Mapped[str] = mapped_column(String, nullable=False)
    first_doseAge: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    kitten_schedule: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True
    )  # Comma-separated string
    puppy_schedule: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True
    )  # Comma-separated string
    description: Mapped[str] = mapped_column(Text, nullable=False)
    side_effects: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True
    )  # Comma-separated string
    age_restrictionId: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("age_restrictions.id"), nullable=True
    )

    age_restriction: Mapped[Optional[AgeRestrictionORM]] = relationship(
        "AgeRestrictionORM", back_populates="vaccines"
    )

    last_updated: Mapped[str] = mapped_column(String, nullable=False)
    common_treatments: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True
    )  # Comma-separated string
