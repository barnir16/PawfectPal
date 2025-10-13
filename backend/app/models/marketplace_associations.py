from sqlalchemy import Table, Column, Integer, ForeignKey
from .base import Base

# Association table for marketplace posts and pets
marketplace_post_pets = Table(
    "marketplace_post_pets",
    Base.metadata,
    Column("marketplace_post_id", Integer, ForeignKey("marketplace_posts.id"), primary_key=True),
    Column("pet_id", Integer, ForeignKey("pets.id"), primary_key=True),
)

# Association table for provider profiles and services
provider_profile_services = Table(
    "provider_profile_services",
    Base.metadata,
    Column("provider_profile_id", Integer, ForeignKey("provider_profiles.id"), primary_key=True),
    Column("service_type_id", Integer, ForeignKey("service_types.id"), primary_key=True),
)

