from __future__ import annotations
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base

if TYPE_CHECKING:
    from .service import ServiceORM


class ServiceTypeORM(Base):
    """Catalog of predefined service types (e.g., walking, sitting, boarding)."""

    __tablename__ = "service_types"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    # Reverse relationship: all services of this type
    services: Mapped[List["ServiceORM"]] = relationship(
        "ServiceORM", back_populates="service_type_obj"
    )
    
    # Many-to-many relationship with providers
    providers: Mapped[List["ProviderORM"]] = relationship(
        "ProviderORM",
        secondary="provider_services_link",
        back_populates="services"
    )
