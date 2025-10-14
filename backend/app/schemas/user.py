from typing import Optional, List
from pydantic import BaseModel, EmailStr, field_validator
from .provider import ProviderExtras


class UserBase(BaseModel):
    username: str
    is_active: bool
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None


class UserContact(BaseModel):
    phone: Optional[str] = None
    profile_image: Optional[str] = None


class UserCreate(ProviderExtras, UserContact, UserBase):
    password: str

    @field_validator("password")
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain a digit")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain an uppercase letter")
        return v


class UserRead(ProviderExtras, UserContact, UserBase):
    id: int

    # OAuth information
    google_id: Optional[str] = None
    profile_picture_url: Optional[str] = None

    # Address information
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None

    latitude: Optional[str] = None
    longitude: Optional[str] = None

    @classmethod
    def model_validate(cls, obj, **kwargs):
        data = obj.__dict__.copy()
        print(f"DEBUG: UserRead.model_validate called for user {obj.username}")
        print(f"DEBUG: provider_profile exists: {obj.provider_profile is not None}")
        print(f"DEBUG: enhanced_provider_profile exists: {obj.enhanced_provider_profile is not None}")

        # Initialize provider fields to None
        data["provider_services"] = None
        data["provider_bio"] = None
        data["provider_hourly_rate"] = None
        data["provider_rating"] = None
        data["provider_rating_count"] = None

        if obj.provider_profile:
            # Handle services as list of ServiceTypeORM objects from ProviderORM
            print(f"DEBUG: Using provider_profile: {obj.provider_profile}")
            if hasattr(obj.provider_profile, 'services') and obj.provider_profile.services:
                service_ids = [service.id for service in obj.provider_profile.services]
                print(f"DEBUG: Provider profile services IDs: {service_ids}")
                data["provider_services"] = service_ids
            else:
                print(f"DEBUG: Provider profile has no services or services not loaded")
                data["provider_services"] = None
            data["provider_bio"] = obj.provider_profile.bio
            data["provider_hourly_rate"] = obj.provider_profile.hourly_rate
            data["provider_rating"] = obj.provider_profile.rating
            data["provider_rating_count"] = obj.provider_profile.rating_count

        # Also check enhanced provider profile if it exists (don't use elif to allow both)
        if obj.enhanced_provider_profile:
            print(f"DEBUG: Using enhanced_provider_profile: {obj.enhanced_provider_profile}")
            # Handle services as list of ServiceTypeORM objects from ProviderProfileORM
            if hasattr(obj.enhanced_provider_profile, 'services') and obj.enhanced_provider_profile.services:
                service_ids = [service.id for service in obj.enhanced_provider_profile.services]
                print(f"DEBUG: Enhanced provider profile services IDs: {service_ids}")
                # If we already have services from provider_profile, merge them
                if data["provider_services"]:
                    data["provider_services"] = list(set(data["provider_services"] + service_ids))
                else:
                    data["provider_services"] = service_ids
            else:
                print(f"DEBUG: Enhanced provider profile has no services or services not loaded")

            # Override other fields with enhanced profile data if available
            if obj.enhanced_provider_profile.bio:
                data["provider_bio"] = obj.enhanced_provider_profile.bio
            if obj.enhanced_provider_profile.hourly_rate:
                data["provider_hourly_rate"] = obj.enhanced_provider_profile.hourly_rate
            if obj.enhanced_provider_profile.average_rating:
                data["provider_rating"] = obj.enhanced_provider_profile.average_rating
            if obj.enhanced_provider_profile.total_reviews:
                data["provider_rating_count"] = obj.enhanced_provider_profile.total_reviews

        print(f"DEBUG: Final provider_services value: {data.get('provider_services')}")
        return super().model_validate(data, **kwargs)

    class Config:
        from_attributes = True


class UserPublic(UserBase):
    id: int

    class Config:
        from_attributes = True


class UserUpdate(ProviderExtras, BaseModel):
    # UserBase fields
    username: Optional[str] = None
    is_active: Optional[bool] = None
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None

    # UserContact fields
    phone: Optional[str] = None
    profile_image: Optional[str] = None

    # Address fields
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None

    # OAuth fields if you want editable
    google_id: Optional[str] = None
    profile_picture_url: Optional[str] = None

    latitude: Optional[str] = None
    longitude: Optional[str] = None

    # Provider fields - override to use service names instead of IDs
    provider_services: Optional[List[str]] = None  # Changed from List[int] to List[str]
    provider_rating: Optional[float] = None
    provider_rating_count: Optional[int] = None
    provider_bio: Optional[str] = None
    provider_hourly_rate: Optional[float] = None
