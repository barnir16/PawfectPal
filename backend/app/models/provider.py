from __future__ import annotations
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import Integer, Float, Text, ForeignKey, Table, Column
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base

if TYPE_CHECKING:
    from .service_type import ServiceTypeORM

# Correctly define the association table at module level
provider_services_link = Table(
    "provider_services_link",
    Base.metadata,
    Column("provider_id", Integer, ForeignKey("providers.id"), primary_key=True),
    Column(
        "service_type_id", Integer, ForeignKey("service_types.id"), primary_key=True
    ),
)


class ProviderORM(Base):
    __tablename__ = "providers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)

    services: Mapped[List["ServiceTypeORM"]] = relationship(
        "ServiceTypeORM",
        secondary=provider_services_link,  # use the module-level table
        back_populates="providers",
    )
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    hourly_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    rating: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    rating_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, default=0)

    # Relationship back to User
    user = relationship("UserORM", back_populates="provider_profile")
