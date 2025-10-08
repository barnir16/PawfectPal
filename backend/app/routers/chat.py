from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.models import ChatMessageORM, ServiceRequestORM, UserORM
from app.schemas import ChatMessageCreate, ChatMessageRead, ChatConversation
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
import json
import os
import uuid
import re
from datetime import datetime
from pathlib import Path

router = APIRouter(prefix="/chat", tags=["chat"])

# Security constants
ALLOWED_FILE_TYPES = {
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'text/plain', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
MAX_FILES_PER_MESSAGE = 5
MAX_MESSAGE_LENGTH = 2000
RATE_LIMIT_MESSAGES_PER_MINUTE = 30

def validate_file(file: UploadFile) -> bool:
    """Validate file type and size"""
    if not file.filename:
        return False
    
    # Check file type
    if file.content_type not in ALLOWED_FILE_TYPES:
        return False
    
    # Check file extension
    file_extension = os.path.splitext(file.filename)[1].lower()
    allowed_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.txt', '.doc', '.docx'}
    if file_extension not in allowed_extensions:
        return False
    
    return True

def sanitize_message(message: str) -> str:
    """Sanitize message content"""
    # Remove potential XSS attempts
    message = re.sub(r'<script.*?</script>', '', message, flags=re.IGNORECASE | re.DOTALL)
    message = re.sub(r'javascript:', '', message, flags=re.IGNORECASE)
    message = re.sub(r'on\w+\s*=', '', message, flags=re.IGNORECASE)
    
    # Limit message length
    return message[:MAX_MESSAGE_LENGTH]

def validate_message_type(message_type: str) -> bool:
    """Validate message type"""
    allowed_types = {'text', 'image', 'file', 'system', 'location'}
    return message_type in allowed_types

def sanitize_filename(filename: str) -> str:
    """Sanitize filename for safe storage"""
    import re
    # Remove or replace unsafe characters
    filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
    # Remove leading/trailing dots and spaces
    filename = filename.strip('. ')
    # Ensure filename is not empty
    if not filename:
        filename = 'file'
    return filename


@router.post("/messages-with-files", response_model=ChatMessageRead)
async def send_message_with_files(
    service_request_id: str = Form(...),
    message: str = Form(...),
    message_type: str = Form("text"),
    files: List[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Send a message with file attachments"""
    # Convert service_request_id to int
    try:
        service_request_id_int = int(service_request_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid service_request_id")
    
    # Verify the service request exists and user has access
    service_request = (
        db.query(ServiceRequestORM)
        .filter(ServiceRequestORM.id == service_request_id_int)
        .first()
    )

    if not service_request:
        raise HTTPException(status_code=404, detail="Service request not found")

    # Check if user is either the request owner or a provider
    if service_request.user_id != current_user.id and not current_user.is_provider:
        raise HTTPException(status_code=403, detail="Access denied")

    # Validate inputs
    if not message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    
    if not validate_message_type(message_type):
        raise HTTPException(status_code=400, detail="Invalid message type")
    
    # Sanitize message
    sanitized_message = sanitize_message(message)
    
    # Process file uploads
    attachments_info = []
    if files:
        # Validate file count
        if len(files) > MAX_FILES_PER_MESSAGE:
            raise HTTPException(
                status_code=400, 
                detail=f"Too many files. Maximum {MAX_FILES_PER_MESSAGE} files allowed."
            )
        
        for file in files:
            if file.filename:
                # Validate file
                if not validate_file(file):
                    raise HTTPException(
                        status_code=400,
                        detail=f"Invalid file type or extension: {file.filename}"
                    )
                
                # Read file content to check size
                content = await file.read()
                if len(content) > MAX_FILE_SIZE:
                    raise HTTPException(
                        status_code=400,
                        detail=f"File too large: {file.filename}. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB"
                    )
                
                # Reset file pointer
                await file.seek(0)
                
                # Sanitize filename
                safe_filename = sanitize_filename(file.filename)
                file_extension = os.path.splitext(safe_filename)[1]
                unique_filename = f"{uuid.uuid4()}{file_extension}"
                
                # Create uploads directory if it doesn't exist
                upload_dir = Path("uploads/chat")
                upload_dir.mkdir(parents=True, exist_ok=True)
                
                # Save file
                file_path = upload_dir / unique_filename
                with open(file_path, "wb") as buffer:
                    buffer.write(content)
                
                # Store attachment info
                attachments_info.append({
                    "id": str(uuid.uuid4()),
                    "file_name": safe_filename,
                    "file_url": f"/uploads/chat/{unique_filename}",
                    "file_type": file.content_type or "application/octet-stream",
                    "file_size": len(content),
                    "created_at": datetime.now().isoformat()
                })
                
                print(f"💬 File uploaded: {safe_filename} -> {file_path}")

    # Create the message with proper metadata
    db_message = ChatMessageORM(
        service_request_id=service_request_id_int,
        sender_id=current_user.id,
        message=sanitized_message,
        message_type="image" if files else message_type,
        message_metadata={
            "attachments": attachments_info,
            "original_message": sanitized_message
        } if attachments_info else None
    )

    db.add(db_message)

    # Update response count on service request
    if current_user.is_provider and service_request.user_id != current_user.id:
        service_request.responses_count += 1

    db.commit()
    db.refresh(db_message)

    print(f"💬 Chat message with files created: {db_message.id}")
    return ChatMessageRead.model_validate(db_message)


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
        # For now, we'll skip storing attachments since we don't have the column
        print(f"💬 Attachments received but not stored (no metadata column)")

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


def _get_conversation_data(service_request_id: int, db: Session, current_user: UserORM) -> ChatConversation:
    """Helper function to get conversation data without FastAPI dependencies"""
    # Verify the service request exists and user has access
    service_request = (
        db.query(ServiceRequestORM)
        .filter(ServiceRequestORM.id == service_request_id)
        .first()
    )

    if not service_request:
        raise HTTPException(status_code=404, detail="Service request not found")

    # Debug logging for access control
    print(f"🔍 Chat Access Debug:")
    print(f"  Service Request ID: {service_request_id}")
    print(f"  Service Request User ID: {service_request.user_id}")
    print(f"  Current User ID: {current_user.id}")
    print(f"  Current User Username: {current_user.username}")
    print(f"  Current User Is Provider: {current_user.is_provider}")
    print(f"  Access Check: {service_request.user_id} != {current_user.id} and not {current_user.is_provider}")

    # Check if user is either the request owner or a provider
    if service_request.user_id != current_user.id and not current_user.is_provider:
        print(f"❌ Access denied for user {current_user.username} (ID: {current_user.id}) to service request {service_request_id}")
        raise HTTPException(status_code=403, detail="Access denied")
    
    print(f"✅ Access granted for user {current_user.username} (ID: {current_user.id}) to service request {service_request_id}")

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


@router.get("/conversations/{service_request_id}", response_model=ChatConversation)
def get_conversation(
    service_request_id: int,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Get conversation for a service request"""
    return _get_conversation_data(service_request_id, db, current_user)


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
        try:
            conversation = _get_conversation_data(request_id, db, current_user)
            conversations.append(conversation)
        except HTTPException as e:
            # Skip conversations user doesn't have access to
            if e.status_code == 403:
                continue
            raise e

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
