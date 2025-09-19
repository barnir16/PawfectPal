from sqlalchemy import Column, Integer, String, Date, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .base import Base

class VaccinationORM(Base):
    __tablename__ = "vaccinations"
    
    id = Column(Integer, primary_key=True, index=True)
    pet_id = Column(Integer, ForeignKey("pets.id"), nullable=False)
    vaccine_name = Column(String(255), nullable=False)
    vaccine_type = Column(String(100), default="Core")  # Core, Non-Core, Optional
    date_administered = Column(Date, nullable=False)
    next_due_date = Column(Date)
    batch_number = Column(String(100))
    manufacturer = Column(String(255))
    veterinarian = Column(String(255), nullable=False)
    clinic = Column(String(255), nullable=False)
    dose_number = Column(Integer, default=1)
    notes = Column(Text)
    is_completed = Column(Boolean, default=True)
    reminder_sent = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationship
    pet = relationship("PetORM", back_populates="vaccinations")
    
    def __repr__(self):
        return f"<Vaccination(id={self.id}, pet_id={self.pet_id}, vaccine_name='{self.vaccine_name}')>"