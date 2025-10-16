from sqlalchemy.orm import declarative_base
from enum import Enum

Base = declarative_base()


class ServiceType(str, Enum):
    WALKING = "walking"
    SITTING = "sitting"
    BOARDING = "boarding"
    GROOMING = "grooming"
    VETERINARY = "veterinary"


class ServiceStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
