from __future__ import annotations
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import Integer, Float, Text, ForeignKey, Table, Column
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base

if TYPE_CHECKING:
    from .service_type import ServiceTypeORM


class ProviderORM(Base):
    __tablename__ = "providers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)

    services: Mapped[List["ServiceTypeORM"]] = relationship(
        "ServiceTypeORM",
        secondary="provider_services_link",
        back_populates="providers",
    )
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    hourly_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    rating: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    provider_services_link = Table(
        "provider_services_link",
        Base.metadata,
        Column("provider_id", Integer, ForeignKey("providers.id")),
        Column("service_type_id", Integer, ForeignKey("service_types.id")),
    )
    # Relationship back to User
    user = relationship("UserORM", back_populates="provider_profile")
