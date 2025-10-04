from __future__ import annotations
from sqlalchemy import Integer, ForeignKey, Table, Column
from .base import Base

# Association table for many-to-many relationship between service requests and pets
service_request_pets = Table(
    "service_request_pets",
    Base.metadata,
    Column("service_request_id", Integer, ForeignKey("service_requests.id"), primary_key=True),
    Column("pet_id", Integer, ForeignKey("pets.id"), primary_key=True)
)