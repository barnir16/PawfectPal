from fastapi import HTTPException, Depends, status, APIRouter
from sqlalchemy.orm import Session
from app.models import UserORM, ServiceTypeORM
from app.models.provider import ProviderORM
from app.schemas import UserRead, UserCreate, UserUpdate
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.auth.utils import (
    get_password_hash,
    get_user_by_username,
    verify_password,
    create_access_token,
)
from config import ACCESS_TOKEN_EXPIRE_MINUTES
from pydantic import BaseModel
import jwt


router = APIRouter(prefix="/auth", tags=["auth"])

# Create a separate router for user endpoints that don't have the /auth prefix
user_router = APIRouter(prefix="/users", tags=["users"])


# Google OAuth Models
class GoogleAuthRequest(BaseModel):
    credential: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


@router.post("/register", response_model=UserRead, status_code=201)
def register(user: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    db_user = get_user_by_username(db, username=user.username)
    print("Existing user check:", db_user)
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
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    """Login user and return access token"""
    user = get_user_by_username(db, username=form_data.username)
    print(f"Trying login for username: {form_data.username}")
    print(f"User found: {user}")
    print(
        f"Password matches: {verify_password(form_data.password, user.hashed_password) if user else 'N/A'}"
    )

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/google", response_model=TokenResponse)
def google_auth(request: GoogleAuthRequest, db: Session = Depends(get_db)):
    """Authenticate user with Google OAuth"""
    try:
        # Handle both JWT and base64-encoded credentials
        decoded_token = None

        # First try base64-encoded format (OAuth2 flow)
        try:
            import base64
            import json

            decoded_data = base64.b64decode(request.credential).decode("utf-8")
            decoded_token = json.loads(decoded_data)
            print(f"✅ Decoded OAuth2 credential: {decoded_token}")
        except Exception as e1:
            print(f"❌ Failed to decode as OAuth2: {e1}")
            # Try JWT format (original Google Sign-In)
            try:
                decoded_token = jwt.decode(
                    request.credential, options={"verify_signature": False}
                )
                print(f"✅ Decoded JWT credential: {decoded_token}")
            except Exception as e2:
                print(f"❌ Failed to decode as JWT: {e2}")
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid credential format. OAuth2 error: {e1}, JWT error: {e2}",
                )

        # Extract user information
        google_id = decoded_token.get("sub")
        email = decoded_token.get("email")
        name = decoded_token.get("name")
        picture = decoded_token.get("picture")

        if not email or not google_id:
            print(
                f"❌ Missing required fields - email: {email}, google_id: {google_id}"
            )
            raise HTTPException(
                status_code=400, detail="Invalid Google token: missing required fields"
            )

        print(f"🔍 Looking for user with email: {email}")

        # Check if user exists by email
        db_user = db.query(UserORM).filter(UserORM.email == email).first()
        print(f"👤 Found existing user: {db_user.username if db_user else 'None'}")

        if not db_user:
            # Create new user from Google account
            username = email.split("@")[0]  # Use email prefix as username
            # Ensure username is unique
            counter = 1
            original_username = username
            while get_user_by_username(db, username):
                username = f"{original_username}{counter}"
                counter += 1

            db_user = UserORM(
                username=username,
                email=email,
                full_name=name or email,
                hashed_password="",  # No password for Google OAuth users
                is_active=True,
                google_id=google_id,
                profile_picture_url=picture,
            )
            db.add(db_user)
            db.commit()
            db.refresh(db_user)
        else:
            # Update existing user's Google info if needed
            if not db_user.google_id:
                db_user.google_id = google_id
            if picture and not db_user.profile_picture_url:
                db_user.profile_picture_url = picture
            db.commit()

        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": db_user.username}, expires_delta=access_token_expires
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        }

    except jwt.InvalidTokenError:
        raise HTTPException(status_code=400, detail="Invalid Google token")
    except Exception as e:
        import traceback

        print(f"❌ DETAILED ERROR: {str(e)}")
        print(f"📍 TRACEBACK: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Authentication failed: {str(e)}")


@router.patch("/me", response_model=UserRead)
def update_user(
    update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    update_data = update.model_dump(exclude_unset=True)

    # Update basic user fields
    for field, value in update_data.items():
        if value is not None and not field.startswith("provider_"):
            setattr(current_user, field, value)

    # Update provider-related fields
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
                    service_objs = (
                        db.query(ServiceTypeORM)
                        .filter(ServiceTypeORM.id.in_(value))
                        .all()
                    )
                    setattr(profile, orm_field, service_objs)  # can be empty list
                else:
                    setattr(profile, orm_field, value)

    db.commit()
    db.refresh(current_user)
    return current_user


@router.patch("/me/provider", response_model=UserRead)
def toggle_provider_status(
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    # Flip current value
    current_user.is_provider = not current_user.is_provider

    if current_user.is_provider:
        # Becoming a provider: create provider record if not exists
        if (
            not db.query(ProviderORM)
            .filter(ProviderORM.user_id == current_user.id)
            .first()
        ):
            db.add(ProviderORM(user_id=current_user.id))
    else:
        # Unbecoming a provider: remove provider record
        existing_provider = (
            db.query(ProviderORM).filter(ProviderORM.user_id == current_user.id).first()
        )
        if existing_provider:
            db.delete(existing_provider)
            # Clear provider-related fields if needed
            current_user.provider_bio = None
            current_user.provider_hourly_rate = None
            current_user.provider_rating = None
            current_user.provider_services = None

    db.commit()
    db.refresh(current_user)
    return current_user


@user_router.get("/me", response_model=UserRead)
def get_current_user_info(current_user: UserORM = Depends(get_current_user)):
    """Get current user information"""
    return UserRead.model_validate(current_user)


# ------------------------------------------------------------
# Compatibility endpoints for tests expecting /users/* routes
# ------------------------------------------------------------


@user_router.post("/register", response_model=UserRead, status_code=201)
def users_register(user: UserCreate, db: Session = Depends(get_db)):
    """Mirror of /auth/register at /users/register for test compatibility."""
    return register(user=user, db=db)


@user_router.post("/login")
def users_login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """Mirror of /auth/token at /users/login for test compatibility."""
    return login(form_data=form_data, db=db)
