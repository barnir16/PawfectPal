from typing import List, Optional
from pydantic import BaseModel
from datetime import date, datetime
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Table, ForeignKey, Text, Boolean, JSON
from sqlalchemy.orm import declarative_base, relationship
from enum import Enum

Base = declarative_base()

# Enums for service types and status
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

class PetORM(Base):
    """Pet entity with all pet-related information including GPS tracking"""
    __tablename__ = 'pets'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    name = Column(String, nullable=False)
    breedType = Column(String, nullable=False)
    breed = Column(String, nullable=False)
    birthDate = Column(Date, nullable=True)
    age = Column(Integer, nullable=True)
    isBirthdayGiven = Column(Integer, default=0)  # Boolean as Integer for SQLite
    weightKg = Column(Float, nullable=True)
    photoUri = Column(String, nullable=True)  # Image URL/path
    healthIssues = Column(Text, nullable=True)  # Comma-separated
    behaviorIssues = Column(Text, nullable=True)  # Comma-separated
    
    # GPS tracking fields
    lastKnownLatitude = Column(Float, nullable=True)
    lastKnownLongitude = Column(Float, nullable=True)
    lastLocationUpdate = Column(DateTime, nullable=True)
    isTrackingEnabled = Column(Boolean, default=False)
    
    # Relationships
    user = relationship("UserORM", back_populates="pets")
    services = relationship("ServiceORM", back_populates="pet")
    locationHistory = relationship("LocationHistoryORM", back_populates="pet")

class TaskORM(Base):
    """Task entity for scheduling pet care activities"""
    __tablename__ = 'tasks'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    dateTime = Column(DateTime, nullable=False)
    repeatInterval = Column(Integer, nullable=True)
    repeatUnit = Column(String, nullable=True)
    petIds = Column(String, nullable=True)  # Comma-separated pet IDs
    
    # Image attachments
    attachments = Column(Text, nullable=True)  # JSON array of image URLs
    
    # Relationships
    user = relationship("UserORM", back_populates="tasks")

class ServiceORM(Base):
    """Service booking entity for pet walking, sitting, boarding, etc."""
    __tablename__ = 'services'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    pet_id = Column(Integer, ForeignKey('pets.id'), nullable=False)
    service_type = Column(String, nullable=False)  # ServiceType enum
    status = Column(String, nullable=False, default=ServiceStatus.PENDING)
    
    # Service details
    start_datetime = Column(DateTime, nullable=False)
    end_datetime = Column(DateTime, nullable=True)
    duration_hours = Column(Float, nullable=True)
    price = Column(Float, nullable=True)
    currency = Column(String, default="USD")
    
    # Location and tracking
    pickup_address = Column(Text, nullable=True)
    dropoff_address = Column(Text, nullable=True)
    pickup_latitude = Column(Float, nullable=True)
    pickup_longitude = Column(Float, nullable=True)
    dropoff_latitude = Column(Float, nullable=True)
    dropoff_longitude = Column(Float, nullable=True)
    
    # Service provider info
    provider_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    provider_notes = Column(Text, nullable=True)
    customer_notes = Column(Text, nullable=True)
    
    # Images and documentation
    before_images = Column(Text, nullable=True)  # JSON array of image URLs
    after_images = Column(Text, nullable=True)  # JSON array of image URLs
    service_report = Column(Text, nullable=True)
    
    # Relationships
    user = relationship("UserORM", foreign_keys=[user_id], back_populates="booked_services")
    pet = relationship("PetORM", back_populates="services")
    provider = relationship("UserORM", foreign_keys=[provider_id])

class LocationHistoryORM(Base):
    """GPS location history for pets"""
    __tablename__ = 'location_history'
    id = Column(Integer, primary_key=True, index=True)
    pet_id = Column(Integer, ForeignKey('pets.id'), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    timestamp = Column(DateTime, nullable=False, default=datetime.utcnow)
    accuracy = Column(Float, nullable=True)  # GPS accuracy in meters
    speed = Column(Float, nullable=True)  # Speed in m/s
    altitude = Column(Float, nullable=True)  # Altitude in meters
    
    # Relationships
    pet = relationship("PetORM", back_populates="locationHistory")

class AgeRestrictionORM(Base):
    """Age restrictions for vaccines and treatments"""
    __tablename__ = 'age_restrictions'
    id = Column(Integer, primary_key=True, index=True)
    minWeeks = Column(Integer, nullable=True)
    maxYears = Column(Integer, nullable=True)
    vaccines = relationship('VaccineORM', back_populates='ageRestriction')

class VaccineORM(Base):
    """Vaccine information and scheduling"""
    __tablename__ = 'vaccines'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    frequency = Column(String, nullable=False)
    firstDoseAge = Column(String, nullable=True)
    kittenSchedule = Column(Text, nullable=True)  # Comma-separated
    puppySchedule = Column(Text, nullable=True)  # Comma-separated
    description = Column(Text, nullable=False)
    sideEffects = Column(Text, nullable=True)  # Comma-separated
    ageRestrictionId = Column(Integer, ForeignKey('age_restrictions.id'), nullable=True)
    ageRestriction = relationship('AgeRestrictionORM', back_populates='vaccines')
    lastUpdated = Column(String, nullable=False)
    commonTreatments = Column(Text, nullable=True)  # Comma-separated

class UserORM(Base):
    """User entity with authentication and profile information"""
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    
    # Profile information
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    full_name = Column(String, nullable=True)
    profile_image = Column(String, nullable=True)
    
    # Service provider information
    is_provider = Column(Boolean, default=False)
    provider_services = Column(Text, nullable=True)  # JSON array of service types
    provider_rating = Column(Float, nullable=True)
    provider_bio = Column(Text, nullable=True)
    provider_hourly_rate = Column(Float, nullable=True)
    
    # Address information
    address = Column(Text, nullable=True)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    country = Column(String, nullable=True)
    postal_code = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    # Relationships
    pets = relationship("PetORM", back_populates="user")
    tasks = relationship("TaskORM", back_populates="user")
    booked_services = relationship("ServiceORM", foreign_keys=[ServiceORM.user_id], back_populates="user")

# Pydantic models for API
class AgeRestriction(BaseModel):
    minWeeks: Optional[int] = None
    maxYears: Optional[int] = None

class Vaccine(BaseModel):
    name: str
    frequency: str
    firstDoseAge: Optional[str] = None
    kittenSchedule: Optional[List[str]] = None
    puppySchedule: Optional[List[str]] = None
    description: str
    sideEffects: Optional[List[str]] = None
    ageRestriction: Optional[AgeRestriction] = None
    lastUpdated: str
    commonTreatments: Optional[List[str]] = None

class Pet(BaseModel):
    id: Optional[int] = None
    name: str
    breedType: str
    breed: str
    birthDate: Optional[str] = None  # ISO date string
    age: Optional[int] = None
    isBirthdayGiven: bool = False
    weightKg: Optional[float] = None
    photoUri: Optional[str] = None
    healthIssues: List[str] = []
    behaviorIssues: List[str] = []
    
    # GPS tracking
    lastKnownLatitude: Optional[float] = None
    lastKnownLongitude: Optional[float] = None
    lastLocationUpdate: Optional[str] = None  # ISO datetime string
    isTrackingEnabled: bool = False

class Task(BaseModel):
    id: Optional[int] = None
    title: str
    description: str
    dateTime: str  # ISO datetime string
    repeatInterval: Optional[int] = None
    repeatUnit: Optional[str] = None
    petIds: List[int] = []
    attachments: List[str] = []  # Image URLs

class Service(BaseModel):
    id: Optional[int] = None
    pet_id: int
    service_type: ServiceType
    status: ServiceStatus = ServiceStatus.PENDING
    start_datetime: str  # ISO datetime string
    end_datetime: Optional[str] = None  # ISO datetime string
    duration_hours: Optional[float] = None
    price: Optional[float] = None
    currency: str = "USD"
    
    # Location
    pickup_address: Optional[str] = None
    dropoff_address: Optional[str] = None
    pickup_latitude: Optional[float] = None
    pickup_longitude: Optional[float] = None
    dropoff_latitude: Optional[float] = None
    dropoff_longitude: Optional[float] = None
    
    # Provider info
    provider_id: Optional[int] = None
    provider_notes: Optional[str] = None
    customer_notes: Optional[str] = None
    
    # Images and documentation
    before_images: List[str] = []
    after_images: List[str] = []
    service_report: Optional[str] = None

class LocationHistory(BaseModel):
    id: Optional[int] = None
    pet_id: int
    latitude: float
    longitude: float
    timestamp: str  # ISO datetime string
    accuracy: Optional[float] = None
    speed: Optional[float] = None
    altitude: Optional[float] = None

class UserCreate(BaseModel):
    username: str
    password: str
    email: Optional[str] = None
    full_name: Optional[str] = None

class User(BaseModel):
    id: int
    username: str
    is_active: bool
    email: Optional[str] = None
    phone: Optional[str] = None
    full_name: Optional[str] = None
    profile_image: Optional[str] = None
    is_provider: bool = False
    provider_services: Optional[List[str]] = None
    provider_rating: Optional[float] = None
    provider_bio: Optional[str] = None
    provider_hourly_rate: Optional[float] = None
    
    class Config:
        orm_mode = True

# Helper functions for list conversion
def list_to_str(lst):
    """Convert list to comma-separated string for database storage"""
    return ",".join(lst) if lst else None

def str_to_list(s):
    """Convert comma-separated string back to list"""
    return s.split(",") if s else []

def json_to_list(json_str):
    """Convert JSON string to list"""
    import json
    try:
        return json.loads(json_str) if json_str else []
    except:
        return []

def list_to_json(lst):
    """Convert list to JSON string for database storage"""
    import json
    return json.dumps(lst) if lst else None 