from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models import ChatMessageORM, ServiceRequestORM, UserORM
from schemas import ChatMessageCreate, ChatMessageRead, ChatConversation
from dependencies.db import get_db
from dependencies.auth import get_current_user

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/messages", response_model=ChatMessageRead)
def send_message(
    message: ChatMessageCreate,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Send a message in a service request conversation"""
    # Verify the service request exists and user has access
    service_request = (
        db.query(ServiceRequestORM)
        .filter(ServiceRequestORM.id == message.service_request_id)
        .first()
    )

    if not service_request:
        raise HTTPException(status_code=404, detail="Service request not found")

    # Check if user is either the request owner or a provider
    if service_request.user_id != current_user.id and not current_user.is_provider:
        raise HTTPException(status_code=403, detail="Access denied")

    # Create the message
    db_message = ChatMessageORM(
        service_request_id=message.service_request_id,
        sender_id=current_user.id,
        message=message.message,
        message_type=message.message_type,
    )
    
    # Handle attachments if present
    if message.attachments:
        print(f"💬 Processing {len(message.attachments)} attachments")
        # Store attachments as JSON in metadata for now
        # In a real implementation, you'd want a separate attachments table
        attachments_data = []
        for attachment in message.attachments:
            attachments_data.append({
                "id": attachment.id,
                "file_name": attachment.file_name,
                "file_url": attachment.file_url,
                "file_type": attachment.file_type,
                "file_size": attachment.file_size,
                "created_at": attachment.created_at
            })
        db_message.message_metadata = {"attachments": attachments_data}
        print(f"💬 Attachments stored: {attachments_data}")

    db.add(db_message)

    # Update response count on service request
    if current_user.is_provider and service_request.user_id != current_user.id:
        service_request.responses_count += 1

    db.commit()
    db.refresh(db_message)
    
    print(f"💬 Chat message created: {db_message.id}")
    print(f"💬 Message timestamp: {db_message.created_at}")
    print(f"💬 Message timestamp type: {type(db_message.created_at)}")

    # Convert to response model with proper serialization
    return ChatMessageRead.model_validate(db_message)


@router.get("/conversations/{service_request_id}", response_model=ChatConversation)
def get_conversation(
    service_request_id: int,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Get conversation for a service request"""
    # Verify the service request exists and user has access
    service_request = (
        db.query(ServiceRequestORM)
        .filter(ServiceRequestORM.id == service_request_id)
        .first()
    )

    if not service_request:
        raise HTTPException(status_code=404, detail="Service request not found")

    # Check if user is either the request owner or a provider
    if service_request.user_id != current_user.id and not current_user.is_provider:
        raise HTTPException(status_code=403, detail="Access denied")

    # Get all messages for this service request
    messages = (
        db.query(ChatMessageORM)
        .filter(ChatMessageORM.service_request_id == service_request_id)
        .order_by(ChatMessageORM.created_at)
        .all()
    )

    # Mark messages as read for the current user
    unread_count = 0
    for message in messages:
        if message.sender_id != current_user.id and not message.is_read:
            message.is_read = True
            unread_count += 1

    db.commit()

    # Convert messages to proper response format
    serialized_messages = [ChatMessageRead.model_validate(msg) for msg in messages]

    return ChatConversation(
        service_request_id=service_request_id,
        messages=serialized_messages,
        unread_count=unread_count,
    )


@router.get("/my-conversations", response_model=List[ChatConversation])
def get_my_conversations(
    db: Session = Depends(get_db), current_user: UserORM = Depends(get_current_user)
):
    """Get all conversations for the current user"""
    if current_user.is_provider:
        # For providers, get conversations where they've sent messages
        service_request_ids = (
            db.query(ChatMessageORM.service_request_id)
            .filter(ChatMessageORM.sender_id == current_user.id)
            .distinct()
            .all()
        )
        service_request_ids = [req_id[0] for req_id in service_request_ids]
    else:
        # For regular users, get their service requests
        service_request_ids = (
            db.query(ServiceRequestORM.id)
            .filter(ServiceRequestORM.user_id == current_user.id)
            .all()
        )
        service_request_ids = [req_id[0] for req_id in service_request_ids]

    conversations = []
    for request_id in service_request_ids:
        conversation = get_conversation(request_id, db, current_user)
        conversations.append(conversation)

    return conversations


@router.put("/messages/{message_id}/read")
def mark_message_read(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Mark a message as read"""
    message = db.query(ChatMessageORM).filter(ChatMessageORM.id == message_id).first()

    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    # Check if user has access to this message
    service_request = (
        db.query(ServiceRequestORM)
        .filter(ServiceRequestORM.id == message.service_request_id)
        .first()
    )

    if not service_request:
        raise HTTPException(status_code=404, detail="Service request not found")

    if service_request.user_id != current_user.id and not current_user.is_provider:
        raise HTTPException(status_code=403, detail="Access denied")

    message.is_read = True
    db.commit()

    return {"message": "Message marked as read"}
