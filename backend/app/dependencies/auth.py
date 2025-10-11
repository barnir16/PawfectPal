from fastapi import HTTPException, Depends, status
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from app.auth.utils import oauth2_scheme, get_user_by_username
from config import ALGORITHM, SECRET_KEY
from .db import get_db
from typing import Optional
from app.models import UserORM


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
):
    """Get current authenticated user"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: Optional[str] = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = get_user_by_username(db, username=username)
    if user is None:
        raise credentials_exception
    return user


def get_current_user_websocket(token: str) -> Optional[UserORM]:
    """Get current authenticated user for WebSocket connections"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: Optional[str] = payload.get("sub")
        if username is None:
            return None
    except JWTError:
        return None
    
    # For WebSocket, we'll need to create a temporary session
    # This is a simplified version - in production you might want to cache users
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy import create_engine
    from config import DATABASE_URL
    
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        user = get_user_by_username(db, username=username)
        return user
    finally:
        db.close()


def require_provider(user: UserORM = Depends(get_current_user)) -> UserORM:
    if not user.is_provider:
        raise HTTPException(status_code=403, detail="Providers only")
    return user
