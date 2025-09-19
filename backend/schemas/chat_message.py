from __future__ import annotations
from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime
from .user import UserRead

class ChatMessageBase(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000, description="Message content")
    message_type: str = Field("text", pattern="^(text|image|file|system)$", description="Type of message")

class ChatMessageCreate(ChatMessageBase):
    service_request_id: int = Field(..., description="ID of the service request")

class ChatMessageUpdate(BaseModel):
    message: Optional[str] = Field(None, min_length=1, max_length=2000)
    is_read: Optional[bool] = None

class ChatMessageRead(ChatMessageBase):
    id: int
    service_request_id: int
    sender_id: int
    is_read: bool
    is_edited: bool
    edited_at: Optional[datetime]
    created_at: datetime
    
    # Relationships
    sender: Optional[UserRead] = None
    
    class Config:
        from_attributes = True

class ChatConversation(BaseModel):
    """Complete conversation for a service request"""
    service_request_id: int
    messages: list[ChatMessageRead]
    unread_count: int
    
    class Config:
        from_attributes = True