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
