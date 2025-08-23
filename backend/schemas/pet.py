from typing import Optional
from pydantic import BaseModel, computed_field
from datetime import date, datetime


class PetBase(BaseModel):
    # Basic information
    name: str
    breed_type: str  # Maps to frontend 'type'
    breed: str
    birth_date: Optional[date] = None
    age: Optional[int] = None
    is_birthday_given: bool = False
    
    # Physical attributes
    weight_kg: Optional[float] = None
    weight_unit: str = "kg"
    gender: str = "unknown"
    color: Optional[str] = None
    
    # Health information
    is_neutered: bool = False
    is_vaccinated: bool = False
    is_microchipped: bool = False
    health_issues: Optional[str] = None  # Comma-separated string
    behavior_issues: Optional[str] = None  # Comma-separated string
    microchip_number: Optional[str] = None
    
    # Medical records
    last_vet_visit: Optional[date] = None
    next_vet_visit: Optional[date] = None
    vet_name: Optional[str] = None
    vet_phone: Optional[str] = None
    vet_address: Optional[str] = None
    medical_notes: Optional[str] = None
    
    # Media and identification
    photo_uri: Optional[str] = None
    notes: Optional[str] = None
    
    # GPS tracking
    last_known_latitude: Optional[float] = None
    last_known_longitude: Optional[float] = None
    last_location_update: Optional[datetime] = None
    is_tracking_enabled: bool = False
    is_lost: bool = False
    
    # Metadata
    is_active: bool = True


class PetCreate(PetBase):
    pass


class PetUpdate(PetBase):
    pass


class PetRead(PetBase):
    id: int

    @computed_field
    @property
    def type(self) -> str:
        """Computed field that maps breed_type to type for frontend compatibility"""
        return self.breed_type

    @computed_field
    @property
    def imageUrl(self) -> Optional[str]:
        """Computed field that maps photo_uri to imageUrl for frontend compatibility"""
        return self.photo_uri

    @computed_field
    @property
    def birthDate(self) -> Optional[str]:
        """Computed field that maps birth_date to birthDate for frontend compatibility"""
        return self.birth_date.isoformat() if self.birth_date else None

    @computed_field
    @property
    def weightKg(self) -> Optional[float]:
        """Computed field that maps weight_kg to weightKg for frontend compatibility"""
        return self.weight_kg

    @computed_field
    @property
    def lastVetVisit(self) -> Optional[str]:
        """Computed field that maps last_vet_visit to lastVetVisit for frontend compatibility"""
        return self.last_vet_visit.isoformat() if self.last_vet_visit else None

    @computed_field
    @property
    def nextVetVisit(self) -> Optional[str]:
        """Computed field that maps next_vet_visit to nextVetVisit for frontend compatibility"""
        return self.next_vet_visit.isoformat() if self.next_vet_visit else None

    @computed_field
    @property
    def healthIssues(self) -> list[str]:
        """Computed field that converts health_issues from comma-separated string to array"""
        if not self.health_issues:
            return []
        return [issue.strip() for issue in self.health_issues.split(',') if issue.strip()]

    @computed_field
    @property
    def behaviorIssues(self) -> list[str]:
        """Computed field that converts behavior_issues from comma-separated string to array"""
        if not self.behavior_issues:
            return []
        return [issue.strip() for issue in self.behavior_issues.split(',') if issue.strip()]

    @computed_field
    @property
    def breedType(self) -> str:
        """Computed field that maps breed_type to breedType for frontend compatibility"""
        return self.breed_type

    @computed_field
    @property
    def microchipNumber(self) -> Optional[str]:
        """Computed field that maps microchip_number to microchipNumber for frontend compatibility"""
        return self.microchip_number

    @computed_field
    @property
    def isNeutered(self) -> bool:
        """Computed field that maps is_neutered to isNeutered for frontend compatibility"""
        return self.is_neutered

    @computed_field
    @property
    def isVaccinated(self) -> bool:
        """Computed field that maps is_vaccinated to isVaccinated for frontend compatibility"""
        return self.is_vaccinated

    @computed_field
    @property
    def isMicrochipped(self) -> bool:
        """Computed field that maps is_microchipped to isMicrochipped for frontend compatibility"""
        return self.is_microchipped

    class Config:
        from_attributes = True
