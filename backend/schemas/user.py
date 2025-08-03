from typing import List, Optional
from pydantic import BaseModel, EmailStr, field_validator


class UserBase(BaseModel):
    username: str
    is_active: bool
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None


class UserContact(BaseModel):
    phone: Optional[str] = None
    profile_image: Optional[str] = None


class ProviderExtras(BaseModel):
    is_provider: bool = False
    provider_services: Optional[List[str]] = None
    provider_rating: Optional[float] = None
    provider_bio: Optional[str] = None
    provider_hourly_rate: Optional[float] = None


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

    class Config:
        from_attributes = True


class UserPublic(UserBase):
    id: int

    class Config:
        from_attributes = True
