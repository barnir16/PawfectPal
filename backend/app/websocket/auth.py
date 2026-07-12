"""
WebSocket Authentication Dependencies
Handles authentication for WebSocket connections
"""
import jwt
from typing import Optional
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models import UserORM
from app.dependencies.db import get_db
import logging
from config import ALGORITHM, SECRET_KEY

logger = logging.getLogger(__name__)

async def get_current_user_websocket(token: str, db: Session) -> Optional[UserORM]:
    """Get current user from WebSocket token"""
    try:
        # Decode JWT token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        subject = payload.get("sub")
        
        if subject is None:
            logger.warning("Token missing subject")
            return None
            
        # Get user from database
        user = db.query(UserORM).filter(UserORM.username == subject).first()
        if user is None:
            logger.warning("Token subject does not match a user")
            return None
            
        return user
        
    except jwt.ExpiredSignatureError:
        logger.warning("Token expired")
        return None
    except jwt.InvalidTokenError as e:
        logger.warning(f"JWT error: {e}")
        return None
    except Exception as e:
        logger.error(f"Error authenticating WebSocket user: {e}")
        return None
