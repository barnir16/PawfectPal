"""
FCM Token Management Service
Handles storing and retrieving FCM tokens for users
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base
from datetime import datetime

class FCMTokenORM(Base):
    """FCM Token storage model"""
    __tablename__ = "fcm_tokens"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token = Column(String, nullable=False, unique=True)
    device_type = Column(String, nullable=True)  # android, ios, web
    created_at = Column(DateTime, default=datetime.utcnow)
    last_used = Column(DateTime, default=datetime.utcnow)
    is_active = Column(String, default="true")  # Store as string for simplicity
    
    # Relationship
    user = relationship("UserORM", back_populates="fcm_tokens")

