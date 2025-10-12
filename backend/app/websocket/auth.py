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
import os
import logging

logger = logging.getLogger(__name__)

# Get secret key from environment
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")

async def get_current_user_websocket(token: str, db: Session) -> Optional[UserORM]:
    """Get current user from WebSocket token"""
    try:
        # Decode JWT token
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id: int = payload.get("sub")
        
        if user_id is None:
            logger.warning("Token missing user ID")
            return None
            
        # Get user from database
        user = db.query(UserORM).filter(UserORM.id == user_id).first()
        if user is None:
            logger.warning(f"User {user_id} not found")
            return None
            
        return user
        
    except jwt.ExpiredSignatureError:
        logger.warning("Token expired")
        return None
    except jwt.JWTError as e:
        logger.warning(f"JWT error: {e}")
        return None
    except Exception as e:
        logger.error(f"Error authenticating WebSocket user: {e}")
        return None