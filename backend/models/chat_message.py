from __future__ import annotations
from typing import Optional, TYPE_CHECKING
from sqlalchemy import Integer, String, Text, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base
from datetime import datetime, timezone

if TYPE_CHECKING:
    from .user import UserORM
    from .service_request import ServiceRequestORM

class ChatMessageORM(Base):
    """Chat message entity for user-provider communication"""
    __tablename__ = "chat_messages"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    service_request_id: Mapped[int] = mapped_column(Integer, ForeignKey("service_requests.id"), nullable=False)
    sender_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Message content
    message: Mapped[str] = mapped_column(Text, nullable=False)
    message_type: Mapped[str] = mapped_column(String, default="text")  # text, image, file, system
    
    # Message metadata
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    is_edited: Mapped[bool] = mapped_column(Boolean, default=False)
    edited_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    message_metadata: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # JSON metadata for attachments, location, etc.
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    service_request: Mapped["ServiceRequestORM"] = relationship("ServiceRequestORM", back_populates="chat_messages")
    sender: Mapped["UserORM"] = relationship("UserORM", back_populates="chat_messages")
    
    def __repr__(self):
        return f"<ChatMessage(id={self.id}, sender_id={self.sender_id}, message='{self.message[:50]}...')>"