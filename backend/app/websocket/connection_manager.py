"""
WebSocket Connection Manager for Real-time Chat
Handles WebSocket connections and message broadcasting
"""
import json
import asyncio
from typing import Dict, List, Set
from fastapi import WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from app.dependencies.db import get_db
from app.models import UserORM, ServiceRequestORM, ChatMessageORM
from app.schemas import ChatMessageRead
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class ConnectionManager:
    """Manages WebSocket connections for real-time chat"""
    
    def __init__(self):
        # Store active connections by user_id
        self.active_connections: Dict[int, Set[WebSocket]] = {}
        # Store connections by service_request_id for targeted messaging
        self.service_request_connections: Dict[int, Set[WebSocket]] = {}
        
    async def connect(self, websocket: WebSocket, user_id: int, service_request_id: int = None):
        """Connect a user to WebSocket"""
        await websocket.accept()
        
        # Add to user connections
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
        
        # Add to service request connections if specified
        if service_request_id:
            if service_request_id not in self.service_request_connections:
                self.service_request_connections[service_request_id] = set()
            self.service_request_connections[service_request_id].add(websocket)
            
        logger.info(f"User {user_id} connected to WebSocket. Service Request: {service_request_id}")
        
    async def disconnect(self, websocket: WebSocket, user_id: int, service_request_id: int = None):
        """Disconnect a user from WebSocket"""
        # Remove from user connections
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
                
        # Remove from service request connections
        if service_request_id and service_request_id in self.service_request_connections:
            self.service_request_connections[service_request_id].discard(websocket)
            if not self.service_request_connections[service_request_id]:
                del self.service_request_connections[service_request_id]
                
        logger.info(f"User {user_id} disconnected from WebSocket. Service Request: {service_request_id}")
        
    async def send_personal_message(self, message: str, user_id: int):
        """Send a message to a specific user"""
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id].copy():
                try:
                    await connection.send_text(message)
                except Exception as e:
                    logger.error(f"Error sending message to user {user_id}: {e}")
                    await self.disconnect(connection, user_id)
                    
    async def send_to_service_request(self, message: str, service_request_id: int):
        """Send a message to all users connected to a service request"""
        if service_request_id in self.service_request_connections:
            for connection in self.service_request_connections[service_request_id].copy():
                try:
                    await connection.send_text(message)
                except Exception as e:
                    logger.error(f"Error sending message to service request {service_request_id}: {e}")
                    # Find user_id for this connection to properly disconnect
                    user_id = self._find_user_for_connection(connection)
                    if user_id:
                        await self.disconnect(connection, user_id, service_request_id)
                        
    def _find_user_for_connection(self, websocket: WebSocket) -> int:
        """Find user_id for a given WebSocket connection"""
        for user_id, connections in self.active_connections.items():
            if websocket in connections:
                return user_id
        return None
        
    async def broadcast_message(self, message: dict, service_request_id: int, exclude_user_id: int = None):
        """Broadcast a message to all users in a service request conversation"""
        message_json = json.dumps(message)
        
        if service_request_id in self.service_request_connections:
            for connection in self.service_request_connections[service_request_id].copy():
                try:
                    # Skip sending to the user who sent the message
                    user_id = self._find_user_for_connection(connection)
                    if exclude_user_id and user_id == exclude_user_id:
                        continue
                        
                    await connection.send_text(message_json)
                except Exception as e:
                    logger.error(f"Error broadcasting message: {e}")
                    if user_id:
                        await self.disconnect(connection, user_id, service_request_id)
                        
    async def send_typing_indicator(self, service_request_id: int, user_id: int, is_typing: bool):
        """Send typing indicator to other users in the conversation"""
        typing_message = {
            "type": "typing",
            "service_request_id": service_request_id,
            "user_id": user_id,
            "is_typing": is_typing,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        await self.broadcast_message(typing_message, service_request_id, exclude_user_id=user_id)
        
    async def send_message_status(self, message_id: int, status: str, user_id: int):
        """Send message status update (delivered, read)"""
        status_message = {
            "type": "message_status",
            "message_id": message_id,
            "status": status,
            "user_id": user_id,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Find service_request_id for this message
        db = next(get_db())
        try:
            message = db.query(ChatMessageORM).filter(ChatMessageORM.id == message_id).first()
            if message:
                await self.broadcast_message(status_message, message.service_request_id)
        finally:
            db.close()

# Global connection manager instance
manager = ConnectionManager()

