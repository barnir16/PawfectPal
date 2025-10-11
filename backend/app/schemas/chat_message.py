from __future__ import annotations
from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime
from .user import UserRead

class MediaAttachment(BaseModel):
    id: str = Field(..., description="Unique attachment ID")
    file_name: str = Field(..., description="Original filename")
    file_url: str = Field(..., description="URL to access the file")
    file_type: str = Field(..., description="MIME type of the file")
    file_size: int = Field(..., description="File size in bytes")
    created_at: str = Field(..., description="ISO timestamp when attachment was created")

class ChatMessageBase(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000, description="Message content")
    message_type: str = Field("text", pattern="^(text|image|file|system|location)$", description="Type of message")

class ChatMessageCreate(ChatMessageBase):
    service_request_id: int = Field(..., description="ID of the service request")
    attachments: Optional[List[MediaAttachment]] = Field(None, description="File attachments")

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
    message_metadata: Optional[dict] = None
    attachments: Optional[List[MediaAttachment]] = None
    
    # Delivery status tracking
    delivery_status: Optional[str] = "sent"
    delivered_at: Optional[datetime] = None
    read_at: Optional[datetime] = None
    
    # Relationships
    sender: Optional[UserRead] = None
    
    class Config:
        from_attributes = True

class ChatConversation(BaseModel):
    """Complete conversation for a service request"""
    service_request_id: int
    messages: list[ChatMessageRead]
    unread_count: int
    
    # Pagination info
    total_messages: Optional[int] = None
    has_more: Optional[bool] = None
    current_offset: Optional[int] = None
    limit: Optional[int] = None
    
    class Config:
        from_attributes = True