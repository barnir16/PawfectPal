from fastapi import HTTPException, Depends, status
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from app.auth.utils import oauth2_scheme, get_user_by_username
from config import ALGORITHM, SECRET_KEY
from .db import get_db
from typing import Optional
<<<<<<< HEAD:backend/dependencies/auth.py
from models import UserORM
=======
from app.models import UserORM
>>>>>>> origin/merged-zoroflamingo:backend/app/dependencies/auth.py


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


def require_provider(user: UserORM = Depends(get_current_user)) -> UserORM:
    if not user.is_provider:
        raise HTTPException(status_code=403, detail="Providers only")
    return user
