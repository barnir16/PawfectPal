"""
WebSocket Router for Real-time Chat
Provides WebSocket endpoints for real-time messaging
"""
import json
import asyncio
from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user_websocket
from app.models import UserORM, ServiceRequestORM, ChatMessageORM
from app.schemas import ChatMessageCreate, ChatMessageRead
from app.websocket.connection_manager import manager
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ws", tags=["websocket"])

@router.websocket("/chat/{service_request_id}")
async def websocket_chat_endpoint(
    websocket: WebSocket,
    service_request_id: int,
    token: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """WebSocket endpoint for real-time chat"""
    
    try:
        # Authenticate user using token
        if not token:
            await websocket.close(code=1008, reason="Authentication required")
            return
            
        # Get current user from token
        current_user = await get_current_user_websocket(token, db)
        if not current_user:
            await websocket.close(code=1008, reason="Invalid authentication")
            return
            
        # Verify service request exists and user has access
        service_request = (
            db.query(ServiceRequestORM)
            .filter(ServiceRequestORM.id == service_request_id)
            .first()
        )
        
        if not service_request:
            await websocket.close(code=1008, reason="Service request not found")
            return
            
        # Check access control: Owner OR Assigned Provider
        is_owner = service_request.user_id == current_user.id
        is_assigned_provider = service_request.assigned_provider_id == current_user.id
        
        if not (is_owner or is_assigned_provider):
            await websocket.close(code=1008, reason="Access denied")
            return
            
        # Connect to WebSocket
        await manager.connect(websocket, current_user.id, service_request_id)
        
        # Send connection confirmation
        await websocket.send_text(json.dumps({
            "type": "connection_established",
            "service_request_id": service_request_id,
            "user_id": current_user.id,
            "username": current_user.username,
            "timestamp": datetime.utcnow().isoformat()
        }))
        
        logger.info(f"User {current_user.username} connected to chat {service_request_id}")
        
        # Listen for messages
        while True:
            try:
                # Receive message from client
                data = await websocket.receive_text()
                message_data = json.loads(data)
                
                # Handle different message types
                if message_data.get("type") == "message":
                    await handle_chat_message(message_data, current_user, service_request_id, db)
                elif message_data.get("type") == "typing":
                    await handle_typing_indicator(message_data, current_user, service_request_id)
                elif message_data.get("type") == "message_read":
                    await handle_message_read(message_data, current_user, service_request_id, db)
                elif message_data.get("type") == "message_delivered":
                    await handle_message_delivered(message_data, current_user, service_request_id, db)
                else:
                    logger.warning(f"Unknown message type: {message_data.get('type')}")
                    
            except WebSocketDisconnect:
                logger.info(f"User {current_user.username} disconnected from chat {service_request_id}")
                break
            except json.JSONDecodeError:
                logger.error("Invalid JSON received from WebSocket")
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": "Invalid JSON format"
                }))
            except Exception as e:
                logger.error(f"Error processing WebSocket message: {e}")
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": "Internal server error"
                }))
                
    except Exception as e:
        logger.error(f"WebSocket connection error: {e}")
        try:
            await websocket.close(code=1011, reason="Internal server error")
        except:
            pass
    finally:
        # Clean up connection
        if 'current_user' in locals():
            await manager.disconnect(websocket, current_user.id, service_request_id)

async def handle_chat_message(message_data: dict, current_user: UserORM, service_request_id: int, db: Session):
    """Handle incoming chat message via WebSocket"""
    try:
        # Create message object
        message_create = ChatMessageCreate(
            service_request_id=service_request_id,
            message=message_data.get("message", ""),
            message_type=message_data.get("message_type", "text")
        )
        
        # Validate message
        if not message_create.message.strip():
            await manager.send_personal_message(json.dumps({
                "type": "error",
                "message": "Message cannot be empty"
            }), current_user.id)
            return
            
        # Create message in database
        db_message = ChatMessageORM(
            service_request_id=service_request_id,
            sender_id=current_user.id,
            message=message_create.message,
            message_type=message_create.message_type,
            is_read=False
        )
        
        db.add(db_message)
        db.commit()
        db.refresh(db_message)
        
        # Convert to response format
        message_response = ChatMessageRead.model_validate(db_message)
        
        # Broadcast to all users in the conversation
        broadcast_data = {
            "type": "new_message",
            "message": message_response.model_dump(),
            "service_request_id": service_request_id,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        await manager.broadcast_message(broadcast_data, service_request_id, exclude_user_id=current_user.id)
        
        # Send confirmation to sender
        await manager.send_personal_message(json.dumps({
            "type": "message_sent",
            "message_id": db_message.id,
            "timestamp": datetime.utcnow().isoformat()
        }), current_user.id)
        
        logger.info(f"Message {db_message.id} sent by {current_user.username} in chat {service_request_id}")
        
    except Exception as e:
        logger.error(f"Error handling chat message: {e}")
        await manager.send_personal_message(json.dumps({
            "type": "error",
            "message": "Failed to send message"
        }), current_user.id)

async def handle_typing_indicator(message_data: dict, current_user: UserORM, service_request_id: int):
    """Handle typing indicator"""
    is_typing = message_data.get("is_typing", False)
    await manager.send_typing_indicator(service_request_id, current_user.id, is_typing)

async def handle_message_delivered(message_data: dict, current_user: UserORM, service_request_id: int, db: Session):
    """Handle message delivered status"""
    try:
        message_id = message_data.get("message_id")
        if not message_id:
            return
            
        # Update message as delivered
        message = db.query(ChatMessageORM).filter(ChatMessageORM.id == message_id).first()
        if message and message.sender_id != current_user.id:  # Don't mark own messages as delivered
            if message.delivery_status != "read":
                message.delivery_status = "delivered"
                message.delivered_at = datetime.utcnow()
                db.commit()
                
                # Broadcast delivered status
                await manager.send_message_status(message_id, "delivered", current_user.id)
                
    except Exception as e:
        logger.error(f"Error handling message delivered: {e}")

async def handle_message_read(message_data: dict, current_user: UserORM, service_request_id: int, db: Session):
    """Handle message read status"""
    try:
        message_id = message_data.get("message_id")
        if not message_id:
            return
            
        # Update message as read
        message = db.query(ChatMessageORM).filter(ChatMessageORM.id == message_id).first()
        if message and message.sender_id != current_user.id:  # Don't mark own messages as read
            message.is_read = True
            db.commit()
            
            # Broadcast read status
            await manager.send_message_status(message_id, "read", current_user.id)
            
    except Exception as e:
        logger.error(f"Error handling message read: {e}")

@router.get("/chat/{service_request_id}/online-users")
async def get_online_users(service_request_id: int, db: Session = Depends(get_db)):
    """Get list of users currently online in a chat"""
    try:
        # Get service request
        service_request = (
            db.query(ServiceRequestORM)
            .filter(ServiceRequestORM.id == service_request_id)
            .first()
        )
        
        if not service_request:
            raise HTTPException(status_code=404, detail="Service request not found")
            
        # Get online user IDs
        online_user_ids = set()
        if service_request_id in manager.service_request_connections:
            for connection in manager.service_request_connections[service_request_id]:
                user_id = manager._find_user_for_connection(connection)
                if user_id:
                    online_user_ids.add(user_id)
                    
        # Get user details
        online_users = []
        for user_id in online_user_ids:
            user = db.query(UserORM).filter(UserORM.id == user_id).first()
            if user:
                online_users.append({
                    "id": user.id,
                    "username": user.username,
                    "is_provider": user.is_provider
                })
                
        return {
            "service_request_id": service_request_id,
            "online_users": online_users,
            "count": len(online_users)
        }
        
    except Exception as e:
        logger.error(f"Error getting online users: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
