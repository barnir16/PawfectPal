from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from dependencies.db import get_db
from dependencies.auth import get_current_user
from models.user import UserORM
from models.ai_conversation import AIConversationORM, AIConversationMessageORM
from schemas.ai_conversation import (
    AIConversationCreate, 
    AIConversationRead, 
    AIConversationUpdate,
    AIConversationMessageCreate,
    AIConversationMessageRead
)

router = APIRouter(prefix="/ai/conversations", tags=["AI Conversations"])

@router.get("/", response_model=List[AIConversationRead])
def get_user_conversations(
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user)
):
    """Get all AI conversations for the current user"""
    conversations = db.query(AIConversationORM).filter(
        AIConversationORM.user_id == current_user.id,
        AIConversationORM.is_active == True
    ).order_by(AIConversationORM.updated_at.desc()).all()
    
    return conversations

@router.post("/", response_model=AIConversationRead)
def create_conversation(
    conversation_data: AIConversationCreate,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user)
):
    """Create a new AI conversation"""
    conversation = AIConversationORM(
        user_id=current_user.id,
        title=conversation_data.title
    )
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    
    return conversation

@router.get("/{conversation_id}", response_model=AIConversationRead)
def get_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user)
):
    """Get a specific AI conversation with all messages"""
    conversation = db.query(AIConversationORM).filter(
        AIConversationORM.id == conversation_id,
        AIConversationORM.user_id == current_user.id,
        AIConversationORM.is_active == True
    ).first()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    return conversation

@router.put("/{conversation_id}", response_model=AIConversationRead)
def update_conversation(
    conversation_id: int,
    conversation_data: AIConversationUpdate,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user)
):
    """Update an AI conversation"""
    conversation = db.query(AIConversationORM).filter(
        AIConversationORM.id == conversation_id,
        AIConversationORM.user_id == current_user.id,
        AIConversationORM.is_active == True
    ).first()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    if conversation_data.title is not None:
        conversation.title = conversation_data.title
    if conversation_data.is_active is not None:
        conversation.is_active = conversation_data.is_active
    
    db.commit()
    db.refresh(conversation)
    
    return conversation

@router.delete("/{conversation_id}")
def delete_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user)
):
    """Delete an AI conversation (soft delete)"""
    conversation = db.query(AIConversationORM).filter(
        AIConversationORM.id == conversation_id,
        AIConversationORM.user_id == current_user.id,
        AIConversationORM.is_active == True
    ).first()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    conversation.is_active = False
    db.commit()
    
    return {"message": "Conversation deleted successfully"}

@router.post("/{conversation_id}/messages", response_model=AIConversationMessageRead)
def add_message_to_conversation(
    conversation_id: int,
    message_data: AIConversationMessageCreate,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user)
):
    """Add a message to an AI conversation"""
    # Verify conversation exists and belongs to user
    conversation = db.query(AIConversationORM).filter(
        AIConversationORM.id == conversation_id,
        AIConversationORM.user_id == current_user.id,
        AIConversationORM.is_active == True
    ).first()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Create new message
    message = AIConversationMessageORM(
        conversation_id=conversation_id,
        role=message_data.role,
        content=message_data.content,
        pet_context=message_data.pet_context,
        suggested_actions=message_data.suggested_actions
    )
    
    db.add(message)
    db.commit()
    db.refresh(message)
    
    return message
