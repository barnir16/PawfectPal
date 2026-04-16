from typing import List, Optional

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
    def validate_password(cls, value: str):
        if len(value) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not any(char.isdigit() for char in value):
            raise ValueError("Password must contain a digit")
        if not any(char.isupper() for char in value):
            raise ValueError("Password must contain an uppercase letter")
        return value


class UserRead(ProviderExtras, UserContact, UserBase):
    id: int

    google_id: Optional[str] = None
    profile_picture_url: Optional[str] = None

    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None

    latitude: Optional[float] = None
    longitude: Optional[float] = None

    @staticmethod
    def _service_names(profile) -> Optional[List[str]]:
        if not profile or not hasattr(profile, "services") or not profile.services:
            return None
        return [service.name for service in profile.services]

    @classmethod
    def model_validate(cls, obj, **kwargs):
        data = obj.__dict__.copy()

        provider_profile = getattr(obj, "provider_profile", None)
        enhanced_provider_profile = getattr(obj, "enhanced_provider_profile", None)

        provider_services = cls._service_names(provider_profile)
        enhanced_services = cls._service_names(enhanced_provider_profile)
        if provider_services and enhanced_services:
            provider_services = list(dict.fromkeys(provider_services + enhanced_services))
        elif enhanced_services:
            provider_services = enhanced_services

        data["provider_services"] = provider_services
        data["provider_bio"] = None
        data["provider_hourly_rate"] = None
        data["provider_rating"] = None
        data["provider_rating_count"] = None

        if provider_profile:
            data["provider_bio"] = provider_profile.bio
            data["provider_hourly_rate"] = provider_profile.hourly_rate
            data["provider_rating"] = provider_profile.rating
            data["provider_rating_count"] = provider_profile.rating_count

        if enhanced_provider_profile:
            if enhanced_provider_profile.bio:
                data["provider_bio"] = enhanced_provider_profile.bio
            if enhanced_provider_profile.hourly_rate is not None:
                data["provider_hourly_rate"] = enhanced_provider_profile.hourly_rate
            if enhanced_provider_profile.average_rating is not None:
                data["provider_rating"] = enhanced_provider_profile.average_rating
            if enhanced_provider_profile.total_reviews is not None:
                data["provider_rating_count"] = enhanced_provider_profile.total_reviews

        return super().model_validate(data, **kwargs)

    class Config:
        from_attributes = True


class UserPublic(UserBase):
    id: int

    class Config:
        from_attributes = True


class UserUpdate(ProviderExtras, BaseModel):
    username: Optional[str] = None
    is_active: Optional[bool] = None
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None

    phone: Optional[str] = None
    profile_image: Optional[str] = None

    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None

    google_id: Optional[str] = None
    profile_picture_url: Optional[str] = None

    latitude: Optional[float] = None
    longitude: Optional[float] = None

    provider_services: Optional[List[str]] = None
    provider_rating: Optional[float] = None
    provider_rating_count: Optional[int] = None
    provider_bio: Optional[str] = None
    provider_hourly_rate: Optional[float] = None
