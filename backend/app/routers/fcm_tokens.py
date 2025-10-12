"""
FCM Token Management Router
Handles FCM token registration and management
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.models import UserORM, FCMTokenORM
from pydantic import BaseModel
from typing import Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/fcm", tags=["fcm"])

class FCMTokenRequest(BaseModel):
    token: str
    device_type: Optional[str] = "web"

class FCMTokenResponse(BaseModel):
    success: bool
    message: str

@router.post("/register", response_model=FCMTokenResponse)
def register_fcm_token(
    request: FCMTokenRequest,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user)
):
    """Register FCM token for push notifications"""
    try:
        # Check if token already exists
        existing_token = (
            db.query(FCMTokenORM)
            .filter(FCMTokenORM.token == request.token)
            .first()
        )
        
        if existing_token:
            # Update existing token
            existing_token.user_id = current_user.id
            existing_token.device_type = request.device_type
            existing_token.is_active = "true"
            db.commit()
            
            logger.info(f"FCM token updated for user {current_user.username}")
            return FCMTokenResponse(
                success=True,
                message="FCM token updated successfully"
            )
        else:
            # Create new token
            fcm_token = FCMTokenORM(
                user_id=current_user.id,
                token=request.token,
                device_type=request.device_type,
                is_active="true"
            )
            db.add(fcm_token)
            db.commit()
            
            logger.info(f"FCM token registered for user {current_user.username}")
            return FCMTokenResponse(
                success=True,
                message="FCM token registered successfully"
            )
            
    except Exception as e:
        logger.error(f"Error registering FCM token: {e}")
        raise HTTPException(status_code=500, detail="Failed to register FCM token")

@router.delete("/unregister", response_model=FCMTokenResponse)
def unregister_fcm_token(
    request: FCMTokenRequest,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user)
):
    """Unregister FCM token"""
    try:
        # Find and deactivate token
        fcm_token = (
            db.query(FCMTokenORM)
            .filter(
                FCMTokenORM.token == request.token,
                FCMTokenORM.user_id == current_user.id
            )
            .first()
        )
        
        if fcm_token:
            fcm_token.is_active = "false"
            db.commit()
            
            logger.info(f"FCM token unregistered for user {current_user.username}")
            return FCMTokenResponse(
                success=True,
                message="FCM token unregistered successfully"
            )
        else:
            return FCMTokenResponse(
                success=False,
                message="FCM token not found"
            )
            
    except Exception as e:
        logger.error(f"Error unregistering FCM token: {e}")
        raise HTTPException(status_code=500, detail="Failed to unregister FCM token")

@router.get("/tokens")
def get_user_fcm_tokens(
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user)
):
    """Get user's FCM tokens"""
    try:
        tokens = (
            db.query(FCMTokenORM)
            .filter(
                FCMTokenORM.user_id == current_user.id,
                FCMTokenORM.is_active == "true"
            )
            .all()
        )
        
        return {
            "tokens": [
                {
                    "id": token.id,
                    "device_type": token.device_type,
                    "created_at": token.created_at.isoformat(),
                    "last_used": token.last_used.isoformat()
                }
                for token in tokens
            ]
        }
        
    except Exception as e:
        logger.error(f"Error getting FCM tokens: {e}")
        raise HTTPException(status_code=500, detail="Failed to get FCM tokens")

