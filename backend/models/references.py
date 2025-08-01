from __future__ import annotations
from typing import List, Optional
from sqlalchemy import Integer, String, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base


class AgeRestrictionORM(Base):
    """Age restrictions for vaccines and treatments"""

    __tablename__ = "age_restrictions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    minWeeks: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    maxYears: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    vaccines: Mapped[List[VaccineORM]] = relationship(
        "VaccineORM", back_populates="ageRestriction"
    )


class VaccineORM(Base):
    """Vaccine information and scheduling"""

    __tablename__ = "vaccines"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    frequency: Mapped[str] = mapped_column(String, nullable=False)
    firstDoseAge: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    kittenSchedule: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True
    )  # Comma-separated string
    puppySchedule: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True
    )  # Comma-separated string
    description: Mapped[str] = mapped_column(Text, nullable=False)
    sideEffects: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True
    )  # Comma-separated string
    ageRestrictionId: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("age_restrictions.id"), nullable=True
    )

    ageRestriction: Mapped[Optional[AgeRestrictionORM]] = relationship(
        "AgeRestrictionORM", back_populates="vaccines"
    )

    lastUpdated: Mapped[str] = mapped_column(String, nullable=False)
    commonTreatments: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True
    )  # Comma-separated string
