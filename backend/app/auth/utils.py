from sqlalchemy.orm import Session
from typing import Optional
from app.models.user import UserORM
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta, timezone
from config import SECRET_KEY, ALGORITHM

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")


# Helper functions
def get_password_hash(password: str):
    """Hash password using argon2"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str):
    """Verify password against hash"""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_user_by_username(db: Session, username: str) -> Optional[UserORM]:
    """Get user by username"""
    return db.query(UserORM).filter(UserORM.username == username).first()
