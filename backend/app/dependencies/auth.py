from urllib.parse import parse_qs

from fastapi import HTTPException, Depends, status, WebSocket
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


async def get_current_user_websocket(
    token: str = None,
    websocket: WebSocket = None,
    db: Session = None,
) -> Optional[UserORM]:
    """Get current authenticated user for WebSocket connections
    
    Args:
        token: JWT token from the WebSocket connection
        websocket: Optional WebSocket instance (for compatibility with FastAPI's dependency injection)
    """
    # Handle case where token is passed as part of WebSocket query params
    if websocket is not None and token is None:
        raw_query_string = websocket.scope.get("query_string", b"").decode()
        parsed_query_params = parse_qs(raw_query_string)
        token_values = parsed_query_params.get("token", [])
        token = token_values[0] if token_values else None
        
    if not token:
        return None
        
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: Optional[str] = payload.get("sub")
        if username is None:
            return None
    except JWTError:
        return None
    
    if db is None:
        db_generator = get_db()
        db = next(db_generator)
        try:
            return get_user_by_username(db, username=username)
        finally:
            db.close()

    return get_user_by_username(db, username=username)


def require_provider(user: UserORM = Depends(get_current_user)) -> UserORM:
    if not user.is_provider:
        raise HTTPException(status_code=403, detail="Providers only")
    return user
