from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from app.models import ChatMessageORM, ServiceRequestORM, UserORM, FCMTokenORM
from app.schemas import ChatMessageCreate, ChatMessageRead, ChatConversation
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.services.firebase_admin_service import firebase_admin_service
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

    # Industry standard access control: Owner OR Assigned Provider
    is_owner = service_request.user_id == current_user.id
    is_assigned_provider = service_request.assigned_provider_id == current_user.id
    
    if not (is_owner or is_assigned_provider):
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
async def send_message(
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

    # Industry standard access control: Owner OR Assigned Provider OR Provider who has sent messages
    is_owner = service_request.user_id == current_user.id
    is_assigned_provider = service_request.assigned_provider_id == current_user.id
    
    # For providers, also check if they've sent messages in this conversation
    has_sent_messages = False
    if current_user.is_provider and not is_assigned_provider:
        message_count = (
            db.query(ChatMessageORM)
            .filter(
                ChatMessageORM.service_request_id == message.service_request_id,
                ChatMessageORM.sender_id == current_user.id
            )
            .count()
        )
        has_sent_messages = message_count > 0
    
    if not (is_owner or is_assigned_provider or has_sent_messages):
        raise HTTPException(status_code=403, detail="Access denied")

    # Prepare message metadata
    message_metadata = {}
    
    # Handle attachments if present
    if message.attachments:
        print(f"💬 Processing {len(message.attachments)} attachments")
        message_metadata['attachments'] = [
            {
                'id': str(uuid.uuid4()),
                'file_name': att.file_name,
                'file_url': att.file_url,
                'file_type': att.file_type,
                'file_size': att.file_size,
                'created_at': att.created_at
            }
            for att in message.attachments
        ]
    
    # Handle reply context if present
    if message.reply_to:
        print(f"💬 Processing reply to message {message.reply_to.message_id}")
        message_metadata['reply_to'] = {
            'message_id': message.reply_to.message_id,
            'sender_name': message.reply_to.sender_name,
            'message_preview': message.reply_to.message_preview,
            'message_type': message.reply_to.message_type
        }

    # Create the message
    db_message = ChatMessageORM(
        service_request_id=message.service_request_id,
        sender_id=current_user.id,
        message=message.message,
        message_type=message.message_type,
        message_metadata=message_metadata if message_metadata else None,
    )

    db.add(db_message)

    # Update response count on service request
    if current_user.is_provider and service_request.user_id != current_user.id:
        service_request.responses_count += 1

    db.commit()
    db.refresh(db_message)

    print(f"💬 Chat message created: {db_message.id}")
    print(f"💬 Message timestamp: {db_message.created_at}")
    print(f"💬 Message timestamp type: {type(db_message.created_at)}")

    # Send push notification to the other user
    await send_push_notification_for_message(db_message, service_request, current_user, db)

    # Convert to response model with proper serialization
    return ChatMessageRead.model_validate(db_message)


def _get_conversation_data(service_request_id: int, db: Session, current_user: UserORM, limit: int = 50, offset: int = 0) -> ChatConversation:
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
    print(f"  Service Request Assigned Provider ID: {service_request.assigned_provider_id}")
    print(f"  Current User ID: {current_user.id}")
    print(f"  Current User Username: {current_user.username}")
    print(f"  Current User Is Provider: {current_user.is_provider}")

    # Industry standard access control: Owner OR Assigned Provider OR Provider who has sent messages
    is_owner = service_request.user_id == current_user.id
    is_assigned_provider = service_request.assigned_provider_id == current_user.id
    
    # For providers, also check if they've sent messages in this conversation
    has_sent_messages = False
    if current_user.is_provider and not is_assigned_provider:
        message_count = (
            db.query(ChatMessageORM)
            .filter(
                ChatMessageORM.service_request_id == service_request_id,
                ChatMessageORM.sender_id == current_user.id
            )
            .count()
        )
        has_sent_messages = message_count > 0
    
    print(f"  Is Owner: {is_owner}")
    print(f"  Is Assigned Provider: {is_assigned_provider}")
    print(f"  Has Sent Messages: {has_sent_messages}")
    
    if not (is_owner or is_assigned_provider or has_sent_messages):
        print(f"❌ Access denied for user {current_user.username} (ID: {current_user.id}) to service request {service_request_id}")
        raise HTTPException(status_code=403, detail="Access denied")
    
    print(f"✅ Access granted for user {current_user.username} (ID: {current_user.id}) to service request {service_request_id}")

    # Get total message count for pagination info
    total_messages = (
        db.query(ChatMessageORM)
        .filter(ChatMessageORM.service_request_id == service_request_id)
        .count()
    )
    
    # Get messages for this service request with pagination
    messages = (
        db.query(ChatMessageORM)
        .filter(ChatMessageORM.service_request_id == service_request_id)
        .order_by(ChatMessageORM.created_at.desc())  # Get newest messages first
        .offset(offset)
        .limit(limit)
        .all()
    )
    
    # Reverse to show oldest first in the UI
    messages = list(reversed(messages))

    # Mark messages as read for the current user
    unread_count = 0
    for message in messages:
        if message.sender_id != current_user.id and not message.is_read:
            message.is_read = True
            unread_count += 1

    db.commit()

    # Convert messages to proper response format
    serialized_messages = []
    for msg in messages:
        try:
            serialized_msg = ChatMessageRead.model_validate(msg)
            serialized_messages.append(serialized_msg)
        except Exception as e:
            print(f"❌ Error serializing message {msg.id}: {e}")
            print(f"❌ Message data: {msg.__dict__}")
            # Skip this message and continue
            continue

    conversation = ChatConversation(
        service_request_id=service_request_id,
        messages=serialized_messages,
        unread_count=unread_count,
        total_messages=total_messages,
        has_more=offset + len(messages) < total_messages,
        current_offset=offset,
        limit=limit,
    )
    
    print(f"🔍 Chat Response Debug:")
    print(f"  Service Request ID: {service_request_id}")
    print(f"  Messages Count: {len(serialized_messages)}")
    print(f"  Unread Count: {unread_count}")
    print(f"  Conversation Object: {conversation}")
    
    return conversation


@router.get("/conversations/{service_request_id}", response_model=ChatConversation)
def get_conversation(
    service_request_id: int,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Get conversation for a service request with pagination"""
    return _get_conversation_data(service_request_id, db, current_user, limit, offset)


@router.get("/my-conversations", response_model=List[ChatConversation])
def get_my_conversations(
    db: Session = Depends(get_db), current_user: UserORM = Depends(get_current_user)
):
    """Get all conversations for the current user"""
    conversations = []
    
    if current_user.is_provider:
        # For providers, get conversations where they are assigned OR have sent messages
        # First, get service requests where they are assigned
        assigned_requests = (
            db.query(ServiceRequestORM.id)
            .filter(ServiceRequestORM.assigned_provider_id == current_user.id)
            .all()
        )
        assigned_ids = [req_id[0] for req_id in assigned_requests]
        
        # Then, get service requests where they've sent messages (but aren't assigned)
        message_requests = (
            db.query(ChatMessageORM.service_request_id)
            .filter(ChatMessageORM.sender_id == current_user.id)
            .distinct()
            .all()
        )
        message_ids = [req_id[0] for req_id in message_requests]
        
        # Combine both lists and remove duplicates
        service_request_ids = list(set(assigned_ids + message_ids))
        
        print(f"🔍 Provider {current_user.username} conversations:")
        print(f"  Assigned requests: {assigned_ids}")
        print(f"  Message requests: {message_ids}")
        print(f"  Combined: {service_request_ids}")
        
    else:
        # For regular users, get their service requests (regardless of messages)
        service_request_ids = (
            db.query(ServiceRequestORM.id)
            .filter(ServiceRequestORM.user_id == current_user.id)
            .all()
        )
        service_request_ids = [req_id[0] for req_id in service_request_ids]
        
        print(f"🔍 User {current_user.username} conversations:")
        print(f"  Service requests: {service_request_ids}")

    # Create conversations for each service request
    for request_id in service_request_ids:
        try:
            conversation = _get_conversation_data(request_id, db, current_user)
            conversations.append(conversation)
        except HTTPException as e:
            # Skip conversations user doesn't have access to
            if e.status_code == 403:
                print(f"⚠️ Skipping conversation {request_id} - access denied")
                continue
            raise e

    print(f"🔍 Returning {len(conversations)} conversations")
    return conversations


@router.put("/messages/{message_id}/delivered")
def mark_message_delivered(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Mark a message as delivered"""
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

    # Industry standard access control: Owner OR Assigned Provider
    is_owner = service_request.user_id == current_user.id
    is_assigned_provider = service_request.assigned_provider_id == current_user.id
    
    if not (is_owner or is_assigned_provider):
        raise HTTPException(status_code=403, detail="Access denied")

    # Only mark as delivered if not already read
    if message.delivery_status != "read":
        message.delivery_status = "delivered"
        message.delivered_at = datetime.utcnow()
        db.commit()

    return {"message": "Message marked as delivered"}


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

    # Industry standard access control: Owner OR Assigned Provider
    is_owner = service_request.user_id == current_user.id
    is_assigned_provider = service_request.assigned_provider_id == current_user.id
    
    if not (is_owner or is_assigned_provider):
        raise HTTPException(status_code=403, detail="Access denied")

    # Update read status
    message.is_read = True
    message.delivery_status = "read"
    message.read_at = datetime.utcnow()
    db.commit()

    return {"message": "Message marked as read"}


async def send_push_notification_for_message(
    message: ChatMessageORM,
    service_request: ServiceRequestORM,
    sender: UserORM,
    db: Session
):
    """Send push notification for a new chat message"""
    try:
        # Determine the recipient (the other user in the conversation)
        recipient_id = None
        if service_request.user_id == sender.id:
            # Sender is the owner, notify the assigned provider
            recipient_id = service_request.assigned_provider_id
        elif service_request.assigned_provider_id == sender.id:
            # Sender is the provider, notify the owner
            recipient_id = service_request.user_id
            
        if not recipient_id:
            print("⚠️ No recipient found for push notification")
            return
            
        # Get recipient's FCM tokens
        fcm_tokens = (
            db.query(FCMTokenORM)
            .filter(
                FCMTokenORM.user_id == recipient_id,
                FCMTokenORM.is_active == "true"
            )
            .all()
        )
        
        if not fcm_tokens:
            print(f"⚠️ No FCM tokens found for user {recipient_id}")
            return
            
        # Prepare message preview
        message_preview = message.message
        if len(message_preview) > 100:
            message_preview = message_preview[:100] + "..."
            
        # Send notification to each token
        for fcm_token in fcm_tokens:
            success = firebase_admin_service.send_chat_notification(
                fcm_token=fcm_token.token,
                service_request_id=service_request.id,
                sender_username=sender.username,
                message_preview=message_preview,
                notification_type="new_message"
            )
            
            if success:
                print(f"✅ Push notification sent to user {recipient_id}")
            else:
                print(f"❌ Failed to send push notification to user {recipient_id}")
                
    except Exception as e:
        print(f"❌ Error sending push notification: {e}")
