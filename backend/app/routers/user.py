import base64
import json
import logging
from datetime import timedelta

import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth.utils import (
    create_access_token,
    get_password_hash,
    get_user_by_username,
    verify_password,
)
from app.dependencies.auth import get_current_user
from app.dependencies.db import get_db
from app.models import ServiceTypeORM, UserORM
from app.models.provider import ProviderORM
from app.models.provider_profile import ProviderProfileORM
from app.schemas import UserCreate, UserRead, UserUpdate
from config import ACCESS_TOKEN_EXPIRE_MINUTES

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])
user_router = APIRouter(prefix="/users", tags=["users"])


class GoogleAuthRequest(BaseModel):
    credential: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


def _resolve_service_objects(db: Session, service_names: list[str]):
    return db.query(ServiceTypeORM).filter(ServiceTypeORM.name.in_(service_names)).all()


def _decode_google_credential(credential: str) -> dict:
    try:
        decoded_data = base64.b64decode(credential).decode("utf-8")
        return json.loads(decoded_data)
    except Exception:
        pass

    try:
        return jwt.decode(credential, options={"verify_signature": False})
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid credential format") from exc


@router.post("/register", response_model=UserRead, status_code=201)
def register(user: UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    db_user = get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")

    hashed_password = get_password_hash(user.password)
    db_user = UserORM(
        username=user.username,
        hashed_password=hashed_password,
        email=user.email,
        full_name=user.full_name,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return UserRead.model_validate(db_user)


@router.post("/token")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """Login user and return an access token."""
    user = get_user_by_username(db, username=form_data.username)
    password_matches = bool(
        user and verify_password(form_data.password, user.hashed_password)
    )

    if not password_matches:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=access_token_expires,
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/google", response_model=TokenResponse)
def google_auth(request: GoogleAuthRequest, db: Session = Depends(get_db)):
    """Authenticate a user with Google OAuth credential payloads."""
    try:
        decoded_token = _decode_google_credential(request.credential)

        google_id = decoded_token.get("sub")
        email = decoded_token.get("email")
        name = decoded_token.get("name")
        picture = decoded_token.get("picture")

        if not email or not google_id:
            raise HTTPException(
                status_code=400,
                detail="Invalid Google token: missing required fields",
            )

        db_user = db.query(UserORM).filter(UserORM.email == email).first()

        if not db_user:
            username = email.split("@")[0]
            counter = 1
            original_username = username
            while get_user_by_username(db, username):
                username = f"{original_username}{counter}"
                counter += 1

            db_user = UserORM(
                username=username,
                email=email,
                full_name=name or email,
                hashed_password="",
                is_active=True,
                google_id=google_id,
                profile_picture_url=picture,
            )
            db.add(db_user)
            db.commit()
            db.refresh(db_user)
        else:
            if not db_user.google_id:
                db_user.google_id = google_id
            if picture and not db_user.profile_picture_url:
                db_user.profile_picture_url = picture
            db.commit()

        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": db_user.username},
            expires_delta=access_token_expires,
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        }
    except HTTPException:
        raise
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=400, detail="Invalid Google token")
    except Exception:
        logger.exception("Google authentication failed")
        raise HTTPException(status_code=500, detail="Authentication failed")


@router.get("/me", response_model=UserRead)
def get_current_user_info(current_user: UserORM = Depends(get_current_user)):
    """Get current user information."""
    return UserRead.model_validate(current_user)


@router.patch("/me", response_model=UserRead)
def update_user(
    update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    update_data = update.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        if value is not None and not field.startswith("provider_"):
            setattr(current_user, field, value)

    provider_map = {
        "provider_services": "services",
        "provider_bio": "bio",
        "provider_hourly_rate": "hourly_rate",
        "provider_rating": "rating",
    }

    if current_user.is_provider:
        profile = current_user.provider_profile
        if profile:
            for schema_field, orm_field in provider_map.items():
                value = getattr(update, schema_field, None)
                if value is None:
                    continue
                if schema_field == "provider_services":
                    setattr(profile, orm_field, _resolve_service_objects(db, value))
                else:
                    setattr(profile, orm_field, value)

        enhanced_profile = current_user.enhanced_provider_profile
        if enhanced_profile:
            for schema_field, orm_field in provider_map.items():
                value = getattr(update, schema_field, None)
                if value is None:
                    continue
                if schema_field == "provider_services":
                    setattr(
                        enhanced_profile,
                        orm_field,
                        _resolve_service_objects(db, value),
                    )
                else:
                    setattr(enhanced_profile, orm_field, value)

    db.commit()
    db.refresh(current_user)
    return UserRead.model_validate(current_user)


@router.patch("/me/provider", response_model=UserRead)
def toggle_provider_status(
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Toggle provider status for the current user."""
    try:
        current_user.is_provider = not current_user.is_provider

        if current_user.is_provider:
            existing_provider = (
                db.query(ProviderORM)
                .filter(ProviderORM.user_id == current_user.id)
                .first()
            )
            if not existing_provider:
                db.add(ProviderORM(user_id=current_user.id))

            existing_enhanced_profile = (
                db.query(ProviderProfileORM)
                .filter(ProviderProfileORM.user_id == current_user.id)
                .first()
            )
            if not existing_enhanced_profile:
                db.add(
                    ProviderProfileORM(
                        user_id=current_user.id,
                        bio="",
                        hourly_rate=None,
                        service_radius_km=None,
                        is_available=True,
                        experience_years=None,
                        languages=[],
                        certifications=[],
                        is_verified=False,
                        average_rating=None,
                        total_reviews=0,
                    )
                )
        else:
            existing_provider = (
                db.query(ProviderORM)
                .filter(ProviderORM.user_id == current_user.id)
                .first()
            )
            if existing_provider:
                db.delete(existing_provider)
                current_user.provider_bio = None
                current_user.provider_hourly_rate = None
                current_user.provider_rating = None
                current_user.provider_services = None

            existing_enhanced_profile = (
                db.query(ProviderProfileORM)
                .filter(ProviderProfileORM.user_id == current_user.id)
                .first()
            )
            if existing_enhanced_profile:
                db.delete(existing_enhanced_profile)

        db.commit()
        db.refresh(current_user)
        return current_user
    except Exception:
        db.rollback()
        logger.exception("Failed to toggle provider status for user %s", current_user.id)
        raise HTTPException(
            status_code=500,
            detail="Failed to update provider status",
        )


@user_router.get("/me", response_model=UserRead)
def get_current_user_info_users(current_user: UserORM = Depends(get_current_user)):
    """Get current user information."""
    return UserRead.model_validate(current_user)


@user_router.post("/register", response_model=UserRead, status_code=201)
def users_register(user: UserCreate, db: Session = Depends(get_db)):
    """Mirror of /auth/register at /users/register for compatibility."""
    return register(user=user, db=db)


@user_router.post("/login")
def users_login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """Mirror of /auth/token at /users/login for compatibility."""
    return login(form_data=form_data, db=db)
