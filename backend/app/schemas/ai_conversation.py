from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class AIConversationMessageCreate(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    pet_context: Optional[Dict[str, Any]] = None
    suggested_actions: Optional[List[Dict[str, Any]]] = None

class AIConversationMessageRead(BaseModel):
    id: int
    conversation_id: int
    role: str
    content: str
    pet_context: Optional[Dict[str, Any]] = None
    suggested_actions: Optional[List[Dict[str, Any]]] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class AIConversationCreate(BaseModel):
    title: Optional[str] = None

class AIConversationRead(BaseModel):
    id: int
    user_id: int
    title: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    is_active: bool
    messages: List[AIConversationMessageRead] = []
    
    class Config:
        from_attributes = True

class AIConversationUpdate(BaseModel):
    title: Optional[str] = None
    is_active: Optional[bool] = None
