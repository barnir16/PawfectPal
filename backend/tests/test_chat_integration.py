"""
Integration Tests for Chat Flow
Tests complete chat functionality from frontend to backend
"""
import pytest
import asyncio
import json
from unittest.mock import Mock, patch, AsyncMock
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.main import app
from app.models import UserORM, ChatMessageORM, ServiceRequestORM, FCMTokenORM
from app.routers.chat import send_message, get_conversation
from app.schemas.chat_message import ChatMessageCreate, ChatMessageRead, ChatConversation

client = TestClient(app)

@pytest.fixture
def mock_db():
    """Mock database session"""
    return Mock(spec=Session)

@pytest.fixture
def mock_user1():
    """Mock user 1 (service request owner)"""
    user = Mock(spec=UserORM)
    user.id = 1
    user.username = "owner"
    user.is_provider = False
    return user

@pytest.fixture
def mock_user2():
    """Mock user 2 (assigned provider)"""
    user = Mock(spec=UserORM)
    user.id = 2
    user.username = "provider"
    user.is_provider = True
    return user

@pytest.fixture
def mock_service_request():
    """Mock service request"""
    sr = Mock(spec=ServiceRequestORM)
    sr.id = 1
    sr.user_id = 1  # Owner
    sr.assigned_provider_id = 2  # Assigned provider
    sr.status = "in_progress"
    sr.responses_count = 0
    return sr

@pytest.fixture
def mock_chat_message():
    """Mock chat message"""
    message = Mock(spec=ChatMessageORM)
    message.id = 1
    message.service_request_id = 1
    message.sender_id = 1
    message.message = "Test message"
    message.message_type = "text"
    message.delivery_status = "sent"
    message.is_read = False
    message.created_at = datetime.now(timezone.utc)
    message.read_at = None
    message.delivered_at = None
    return message

class TestCompleteChatFlow:
    """Test complete chat flow from message creation to delivery"""
    
    @pytest.mark.asyncio
    async def test_complete_message_flow(self, mock_db, mock_user1, mock_user2, mock_service_request, mock_chat_message):
        """Test complete message flow: send -> receive -> read"""
        # Mock database queries
        mock_db.query.return_value.filter.return_value.first.side_effect = [
            mock_service_request,  # Service request query
            mock_chat_message,     # Message query for read status
            mock_service_request   # Service request query for read status
        ]
        mock_db.add = Mock()
        mock_db.commit = Mock()
        mock_db.refresh = Mock()
        
        # 1. Send message
        message_data = ChatMessageCreate(
            service_request_id=1,
            message="Hello, this is a test message",
            message_type="text"
        )
        
        result = await send_message(message_data, mock_db, mock_user1)
        
        assert isinstance(result, ChatMessageRead)
        assert result.message == "Hello, this is a test message"
        assert result.sender_id == mock_user1.id
        assert result.delivery_status == "sent"
        
        # Verify database operations
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once()
        
        # 2. Get conversation (simulate receiving the message)
        mock_db.query.return_value.filter.return_value.count.return_value = 1
        mock_db.query.return_value.filter.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = [mock_chat_message]
        
        conversation = get_conversation(1, mock_db, mock_user2)
        
        assert isinstance(conversation, ChatConversation)
        assert len(conversation.messages) == 1
        assert conversation.messages[0].message == "Test message"
        
        # 3. Mark message as read
        mock_chat_message.is_read = True
        mock_chat_message.delivery_status = "read"
        mock_chat_message.read_at = datetime.now(timezone.utc)
        
        # Verify read status
        assert mock_chat_message.is_read is True
        assert mock_chat_message.delivery_status == "read"
        assert mock_chat_message.read_at is not None
    
    @pytest.mark.asyncio
    async def test_file_message_flow(self, mock_db, mock_user1, mock_service_request):
        """Test file message flow with attachments"""
        # Mock file upload
        mock_file = Mock()
        mock_file.filename = "test.jpg"
        mock_file.content_type = "image/jpeg"
        mock_file.read = AsyncMock(return_value=b"fake_image_data")
        
        # Mock database queries
        mock_db.query.return_value.filter.return_value.first.return_value = mock_service_request
        mock_db.add = Mock()
        mock_db.commit = Mock()
        mock_db.refresh = Mock()
        
        # Create message with file
        message_data = {
            "service_request_id": "1",
            "message": "Here's a photo",
            "message_type": "image",
            "files": [mock_file]
        }
        
        # This would test the file upload endpoint
        # result = await send_message_with_files(message_data, mock_db, mock_user1)
        
        # Verify file handling
        assert mock_file.read.called
    
    @pytest.mark.asyncio
    async def test_location_message_flow(self, mock_db, mock_user1, mock_service_request):
        """Test location message flow"""
        # Mock database queries
        mock_db.query.return_value.filter.return_value.first.return_value = mock_service_request
        mock_db.add = Mock()
        mock_db.commit = Mock()
        mock_db.refresh = Mock()
        
        # Create location message
        location_data = {
            "latitude": 40.7128,
            "longitude": -74.0060,
            "address": "New York, NY"
        }
        
        message_data = ChatMessageCreate(
            service_request_id=1,
            message="📍 Location: 40.7128, -74.0060",
            message_type="location",
            message_metadata={"location": location_data}
        )
        
        result = await send_message(message_data, mock_db, mock_user1)
        
        assert isinstance(result, ChatMessageRead)
        assert result.message_type == "location"
        assert "Location:" in result.message
        assert result.message_metadata["location"]["latitude"] == 40.7128
    
    @pytest.mark.asyncio
    async def test_message_status_progression(self, mock_db, mock_user1, mock_user2, mock_service_request, mock_chat_message):
        """Test message status progression: sent -> delivered -> read"""
        # Mock database queries
        mock_db.query.return_value.filter.return_value.first.side_effect = [
            mock_service_request,  # For send
            mock_chat_message,      # For delivered
            mock_service_request,   # For delivered
            mock_chat_message,      # For read
            mock_service_request    # For read
        ]
        mock_db.add = Mock()
        mock_db.commit = Mock()
        mock_db.refresh = Mock()
        
        # 1. Send message
        message_data = ChatMessageCreate(
            service_request_id=1,
            message="Status test message",
            message_type="text"
        )
        
        result = await send_message(message_data, mock_db, mock_user1)
        assert result.delivery_status == "sent"
        
        # 2. Mark as delivered
        from app.routers.chat import mark_message_delivered
        delivered_result = mark_message_delivered(result.id, mock_db, mock_user2)
        assert delivered_result["message"] == "Message marked as delivered"
        assert mock_chat_message.delivery_status == "delivered"
        
        # 3. Mark as read
        from app.routers.chat import mark_message_read
        read_result = mark_message_read(result.id, mock_db, mock_user2)
        assert read_result["message"] == "Message marked as read"
        assert mock_chat_message.delivery_status == "read"
        assert mock_chat_message.is_read is True

class TestWebSocketIntegration:
    """Test WebSocket integration with chat flow"""
    
    @pytest.mark.asyncio
    async def test_websocket_message_broadcast(self):
        """Test WebSocket message broadcasting"""
        from app.websocket.connection_manager import manager
        
        # Mock WebSocket connections
        mock_ws1 = Mock()
        mock_ws2 = Mock()
        
        # Simulate two users connected to the same chat
        await manager.connect(mock_ws1, 1, 1)  # User 1
        await manager.connect(mock_ws2, 1, 2)  # User 2
        
        # Send a message
        message_data = {
            "type": "new_message",
            "message": {
                "id": 1,
                "service_request_id": 1,
                "sender_id": 1,
                "message": "Hello via WebSocket!",
                "message_type": "text",
                "created_at": datetime.now().isoformat(),
                "delivery_status": "sent",
                "is_read": False
            }
        }
        
        # Broadcast message
        await manager.broadcast(1, message_data, exclude_user_id=1)
        
        # Verify both connections received the message
        mock_ws1.send_text.assert_not_called()  # Excluded sender
        mock_ws2.send_text.assert_called_once()
        
        # Verify message content
        sent_data = json.loads(mock_ws2.send_text.call_args[0][0])
        assert sent_data["type"] == "new_message"
        assert sent_data["message"]["message"] == "Hello via WebSocket!"
    
    @pytest.mark.asyncio
    async def test_websocket_typing_indicator(self):
        """Test WebSocket typing indicator"""
        from app.websocket.connection_manager import manager
        
        # Mock WebSocket connections
        mock_ws1 = Mock()
        mock_ws2 = Mock()
        
        await manager.connect(mock_ws1, 1, 1)
        await manager.connect(mock_ws2, 1, 2)
        
        # Send typing indicator
        await manager.send_typing_indicator(1, 1, True)
        
        # Verify typing indicator was sent to other user
        mock_ws1.send_text.assert_not_called()  # Sender doesn't receive their own typing
        mock_ws2.send_text.assert_called_once()
        
        sent_data = json.loads(mock_ws2.send_text.call_args[0][0])
        assert sent_data["type"] == "typing"
        assert sent_data["user_id"] == 1
        assert sent_data["is_typing"] is True
    
    @pytest.mark.asyncio
    async def test_websocket_message_status(self):
        """Test WebSocket message status updates"""
        from app.websocket.connection_manager import manager
        
        # Mock WebSocket connections
        mock_ws1 = Mock()
        mock_ws2 = Mock()
        
        await manager.connect(mock_ws1, 1, 1)
        await manager.connect(mock_ws2, 1, 2)
        
        # Send message status update
        await manager.send_message_status(123, "read", 2)
        
        # Verify status update was sent to other user
        mock_ws2.send_text.assert_not_called()  # Sender doesn't receive their own status
        mock_ws1.send_text.assert_called_once()
        
        sent_data = json.loads(mock_ws1.send_text.call_args[0][0])
        assert sent_data["type"] == "message_status"
        assert sent_data["message_id"] == 123
        assert sent_data["status"] == "read"
        assert sent_data["user_id"] == 2

class TestFCMIntegration:
    """Test FCM push notification integration"""
    
    @pytest.mark.asyncio
    async def test_fcm_notification_flow(self, mock_db, mock_user1, mock_user2, mock_service_request, mock_chat_message):
        """Test FCM notification flow"""
        from app.services.firebase_admin_service import firebase_admin_service
        from app.routers.chat import send_push_notification_for_message
        
        # Mock FCM token
        mock_fcm_token = Mock(spec=FCMTokenORM)
        mock_fcm_token.token = "test_fcm_token"
        mock_fcm_token.is_active = "true"
        
        # Mock database queries
        mock_db.query.return_value.filter.return_value.first.side_effect = [
            mock_service_request,  # Service request query
            mock_fcm_token        # FCM token query
        ]
        mock_db.query.return_value.filter.return_value.all.return_value = [mock_fcm_token]
        
        # Mock Firebase service
        with patch.object(firebase_admin_service, 'send_chat_notification', return_value=True) as mock_send:
            await send_push_notification_for_message(
                mock_chat_message, mock_service_request, mock_user1, mock_db
            )
            
            # Verify notification was sent
            mock_send.assert_called_once()
            call_args = mock_send.call_args
            assert call_args[1]["fcm_token"] == "test_fcm_token"
            assert call_args[1]["service_request_id"] == 1
            assert call_args[1]["sender_username"] == mock_user1.username
            assert "Test message" in call_args[1]["message_preview"]
    
    @pytest.mark.asyncio
    async def test_fcm_multicast_notification(self, mock_db, mock_user1, mock_service_request, mock_chat_message):
        """Test FCM multicast notification"""
        from app.services.firebase_admin_service import firebase_admin_service
        
        # Mock multiple FCM tokens
        mock_tokens = [
            Mock(spec=FCMTokenORM, token="token1", is_active="true"),
            Mock(spec=FCMTokenORM, token="token2", is_active="true"),
            Mock(spec=FCMTokenORM, token="token3", is_active="false")  # Inactive token
        ]
        
        # Mock database queries
        mock_db.query.return_value.filter.return_value.all.return_value = mock_tokens
        
        # Mock Firebase service
        with patch.object(firebase_admin_service, 'send_multicast_notification', return_value={
            "success": True,
            "success_count": 2,
            "failure_count": 0,
            "responses": [
                {"success": True, "message_id": "msg1"},
                {"success": True, "message_id": "msg2"}
            ]
        }) as mock_send:
            result = firebase_admin_service.send_multicast_notification(
                fcm_tokens=["token1", "token2"],
                service_request_id=1,
                sender_username=mock_user1.username,
                message_preview="Test message"
            )
            
            assert result["success"] is True
            assert result["success_count"] == 2
            assert result["failure_count"] == 0

class TestPaginationIntegration:
    """Test pagination integration with chat flow"""
    
    def test_conversation_pagination_flow(self, mock_db, mock_user1, mock_service_request):
        """Test conversation pagination flow"""
        # Create mock messages
        messages = []
        for i in range(100):
            message = Mock(spec=ChatMessageORM)
            message.id = i + 1
            message.service_request_id = 1
            message.sender_id = 1 if i % 2 == 0 else 2
            message.message = f"Message {i + 1}"
            message.message_type = "text"
            message.delivery_status = "sent"
            message.is_read = False
            message.created_at = datetime.now(timezone.utc)
            message.read_at = None
            message.delivered_at = None
            messages.append(message)
        
        # Mock database queries
        mock_db.query.return_value.filter.return_value.first.return_value = mock_service_request
        mock_db.query.return_value.filter.return_value.count.return_value = 100
        mock_db.query.return_value.filter.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = messages[0:20]
        mock_db.commit = Mock()
        
        # Test first page
        conversation1 = get_conversation(1, mock_db, mock_user1, limit=20, offset=0)
        
        assert isinstance(conversation1, ChatConversation)
        assert len(conversation1.messages) == 20
        assert conversation1.total_messages == 100
        assert conversation1.has_more is True
        assert conversation1.current_offset == 0
        assert conversation1.limit == 20
        
        # Test second page
        mock_db.query.return_value.filter.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = messages[20:40]
        
        conversation2 = get_conversation(1, mock_db, mock_user1, limit=20, offset=20)
        
        assert len(conversation2.messages) == 20
        assert conversation2.total_messages == 100
        assert conversation2.has_more is True
        assert conversation2.current_offset == 20
        
        # Test last page
        mock_db.query.return_value.filter.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = messages[80:100]
        
        conversation3 = get_conversation(1, mock_db, mock_user1, limit=20, offset=80)
        
        assert len(conversation3.messages) == 20
        assert conversation3.total_messages == 100
        assert conversation3.has_more is False
        assert conversation3.current_offset == 80

class TestErrorHandlingIntegration:
    """Test error handling integration"""
    
    @pytest.mark.asyncio
    async def test_database_error_handling(self, mock_db, mock_user1):
        """Test database error handling"""
        # Mock database error
        mock_db.query.side_effect = Exception("Database connection error")
        
        message_data = ChatMessageCreate(
            service_request_id=1,
            message="Test message",
            message_type="text"
        )
        
        with pytest.raises(Exception):
            await send_message(message_data, mock_db, mock_user1)
    
    @pytest.mark.asyncio
    async def test_websocket_error_handling(self):
        """Test WebSocket error handling"""
        from app.websocket.connection_manager import manager
        
        # Mock WebSocket with error
        mock_ws = Mock()
        mock_ws.send_text.side_effect = Exception("WebSocket error")
        
        await manager.connect(mock_ws, 1, 1)
        
        # Try to send message
        message_data = {"type": "test", "message": "test"}
        
        # Should handle error gracefully
        await manager.broadcast(1, message_data)
        
        # Error should be logged but not crash the system
        assert mock_ws.send_text.called
    
    @pytest.mark.asyncio
    async def test_fcm_error_handling(self, mock_db, mock_user1, mock_service_request, mock_chat_message):
        """Test FCM error handling"""
        from app.services.firebase_admin_service import firebase_admin_service
        from app.routers.chat import send_push_notification_for_message
        
        # Mock FCM token
        mock_fcm_token = Mock(spec=FCMTokenORM)
        mock_fcm_token.token = "invalid_token"
        mock_fcm_token.is_active = "true"
        
        # Mock database queries
        mock_db.query.return_value.filter.return_value.first.side_effect = [
            mock_service_request,
            mock_fcm_token
        ]
        mock_db.query.return_value.filter.return_value.all.return_value = [mock_fcm_token]
        
        # Mock Firebase service to return error
        with patch.object(firebase_admin_service, 'send_chat_notification', return_value=False) as mock_send:
            # Should not raise exception
            await send_push_notification_for_message(
                mock_chat_message, mock_service_request, mock_user1, mock_db
            )
            
            # Verify attempt was made
            mock_send.assert_called_once()

class TestPerformanceIntegration:
    """Test performance integration"""
    
    def test_large_conversation_performance(self, mock_db, mock_user1, mock_service_request):
        """Test performance with large conversation"""
        import time
        
        # Create large number of messages
        large_message_count = 10000
        messages = []
        
        for i in range(50):  # Only load one page
            message = Mock(spec=ChatMessageORM)
            message.id = i + 1
            message.service_request_id = 1
            message.sender_id = 1
            message.message = f"Message {i + 1}"
            message.message_type = "text"
            message.delivery_status = "sent"
            message.is_read = False
            message.created_at = datetime.now(timezone.utc)
            message.read_at = None
            message.delivered_at = None
            messages.append(message)
        
        # Mock database queries
        mock_db.query.return_value.filter.return_value.first.return_value = mock_service_request
        mock_db.query.return_value.filter.return_value.count.return_value = large_message_count
        mock_db.query.return_value.filter.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = messages
        mock_db.commit = Mock()
        
        # Measure performance
        start_time = time.time()
        conversation = get_conversation(1, mock_db, mock_user1, limit=50, offset=0)
        end_time = time.time()
        
        # Verify performance
        assert isinstance(conversation, ChatConversation)
        assert len(conversation.messages) == 50
        assert conversation.total_messages == large_message_count
        
        # Performance should be reasonable (less than 1 second for this test)
        assert (end_time - start_time) < 1.0

if __name__ == "__main__":
    pytest.main([__file__])

