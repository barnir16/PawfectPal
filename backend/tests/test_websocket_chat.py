"""
Backend Tests for WebSocket Chat Functionality
Tests WebSocket connections, message handling, and real-time features
"""
import pytest
import asyncio
import json
from unittest.mock import Mock, patch, AsyncMock
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.models import UserORM, ServiceRequestORM, ChatMessageORM, FCMTokenORM
from app.dependencies.db import get_db
from app.websocket.connection_manager import ConnectionManager
from app.websocket.chat_router import handle_chat_message, handle_typing_indicator
from app.services.firebase_admin_service import FirebaseAdminService

client = TestClient(app)

@pytest.fixture
def mock_db():
    """Mock database session"""
    return Mock(spec=Session)

@pytest.fixture
def mock_user():
    """Mock user for testing"""
    user = Mock(spec=UserORM)
    user.id = 1
    user.username = "testuser"
    user.is_provider = False
    return user

@pytest.fixture
def mock_service_request():
    """Mock service request for testing"""
    service_request = Mock(spec=ServiceRequestORM)
    service_request.id = 1
    service_request.user_id = 1
    service_request.assigned_provider_id = 2
    service_request.status = "open"
    return service_request

@pytest.fixture
def mock_message():
    """Mock chat message for testing"""
    message = Mock(spec=ChatMessageORM)
    message.id = 1
    message.service_request_id = 1
    message.sender_id = 1
    message.message = "Test message"
    message.message_type = "text"
    message.is_read = False
    message.delivery_status = "sent"
    return message

class TestConnectionManager:
    """Test WebSocket connection manager"""
    
    def test_connection_manager_initialization(self):
        """Test connection manager initializes correctly"""
        manager = ConnectionManager()
        assert manager.active_connections == {}
        assert manager.service_request_connections == {}
    
    @pytest.mark.asyncio
    async def test_connect_user(self):
        """Test connecting a user to WebSocket"""
        manager = ConnectionManager()
        mock_websocket = Mock()
        mock_websocket.accept = AsyncMock()
        
        await manager.connect(mock_websocket, user_id=1, service_request_id=1)
        
        assert 1 in manager.active_connections
        assert 1 in manager.service_request_connections
        assert mock_websocket in manager.active_connections[1]
        assert mock_websocket in manager.service_request_connections[1]
    
    @pytest.mark.asyncio
    async def test_disconnect_user(self):
        """Test disconnecting a user from WebSocket"""
        manager = ConnectionManager()
        mock_websocket = Mock()
        mock_websocket.accept = AsyncMock()
        
        # Connect first
        await manager.connect(mock_websocket, user_id=1, service_request_id=1)
        
        # Then disconnect
        await manager.disconnect(mock_websocket, user_id=1, service_request_id=1)
        
        assert 1 not in manager.active_connections
        assert 1 not in manager.service_request_connections
    
    @pytest.mark.asyncio
    async def test_send_personal_message(self):
        """Test sending message to specific user"""
        manager = ConnectionManager()
        mock_websocket = Mock()
        mock_websocket.accept = AsyncMock()
        mock_websocket.send_text = AsyncMock()
        
        await manager.connect(mock_websocket, user_id=1)
        await manager.send_personal_message("Test message", user_id=1)
        
        mock_websocket.send_text.assert_called_once_with("Test message")
    
    @pytest.mark.asyncio
    async def test_send_to_service_request(self):
        """Test sending message to all users in service request"""
        manager = ConnectionManager()
        mock_websocket1 = Mock()
        mock_websocket2 = Mock()
        mock_websocket1.accept = AsyncMock()
        mock_websocket2.accept = AsyncMock()
        mock_websocket1.send_text = AsyncMock()
        mock_websocket2.send_text = AsyncMock()
        
        await manager.connect(mock_websocket1, user_id=1, service_request_id=1)
        await manager.connect(mock_websocket2, user_id=2, service_request_id=1)
        
        await manager.send_to_service_request("Test message", service_request_id=1)
        
        mock_websocket1.send_text.assert_called_once_with("Test message")
        mock_websocket2.send_text.assert_called_once_with("Test message")
    
    @pytest.mark.asyncio
    async def test_broadcast_message_excludes_sender(self):
        """Test broadcast message excludes the sender"""
        manager = ConnectionManager()
        mock_websocket1 = Mock()
        mock_websocket2 = Mock()
        mock_websocket1.accept = AsyncMock()
        mock_websocket2.accept = AsyncMock()
        mock_websocket1.send_text = AsyncMock()
        mock_websocket2.send_text = AsyncMock()
        
        await manager.connect(mock_websocket1, user_id=1, service_request_id=1)
        await manager.connect(mock_websocket2, user_id=2, service_request_id=1)
        
        message_data = {"type": "new_message", "content": "Test"}
        await manager.broadcast_message(message_data, service_request_id=1, exclude_user_id=1)
        
        # Only websocket2 should receive the message
        mock_websocket1.send_text.assert_not_called()
        mock_websocket2.send_text.assert_called_once_with(json.dumps(message_data))
    
    @pytest.mark.asyncio
    async def test_typing_indicator(self):
        """Test typing indicator functionality"""
        manager = ConnectionManager()
        mock_websocket = Mock()
        mock_websocket.accept = AsyncMock()
        mock_websocket.send_text = AsyncMock()
        
        await manager.connect(mock_websocket, user_id=2, service_request_id=1)
        
        await manager.send_typing_indicator(service_request_id=1, user_id=1, is_typing=True)
        
        # Verify typing message was sent
        call_args = mock_websocket.send_text.call_args[0][0]
        message_data = json.loads(call_args)
        assert message_data["type"] == "typing"
        assert message_data["user_id"] == 1
        assert message_data["is_typing"] is True

class TestWebSocketMessageHandlers:
    """Test WebSocket message handlers"""
    
    @pytest.mark.asyncio
    async def test_handle_chat_message_success(self, mock_db, mock_user, mock_service_request):
        """Test successful chat message handling"""
        # Mock database queries
        mock_db.query.return_value.filter.return_value.first.return_value = mock_service_request
        mock_db.add = Mock()
        mock_db.commit = Mock()
        mock_db.refresh = Mock()
        
        # Mock manager
        with patch('app.websocket.chat_router.manager') as mock_manager:
            mock_manager.broadcast_message = AsyncMock()
            mock_manager.send_personal_message = AsyncMock()
            
            message_data = {
                "type": "message",
                "message": "Test message",
                "message_type": "text"
            }
            
            await handle_chat_message(message_data, mock_user, 1, mock_db)
            
            # Verify database operations
            mock_db.add.assert_called_once()
            mock_db.commit.assert_called_once()
            mock_db.refresh.assert_called_once()
            
            # Verify broadcast
            mock_manager.broadcast_message.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_handle_chat_message_empty_message(self, mock_db, mock_user):
        """Test handling empty message"""
        with patch('app.websocket.chat_router.manager') as mock_manager:
            mock_manager.send_personal_message = AsyncMock()
            
            message_data = {
                "type": "message",
                "message": "",
                "message_type": "text"
            }
            
            await handle_chat_message(message_data, mock_user, 1, mock_db)
            
            # Should send error message
            mock_manager.send_personal_message.assert_called_once()
            call_args = mock_manager.send_personal_message.call_args[0][0]
            error_data = json.loads(call_args)
            assert error_data["type"] == "error"
    
    @pytest.mark.asyncio
    async def test_handle_typing_indicator(self, mock_user):
        """Test typing indicator handling"""
        with patch('app.websocket.chat_router.manager') as mock_manager:
            mock_manager.send_typing_indicator = AsyncMock()
            
            message_data = {
                "type": "typing",
                "is_typing": True
            }
            
            await handle_typing_indicator(message_data, mock_user, 1)
            
            mock_manager.send_typing_indicator.assert_called_once_with(1, mock_user.id, True)

class TestFCMTokenManagement:
    """Test FCM token management endpoints"""
    
    def test_register_fcm_token_success(self, mock_db, mock_user):
        """Test successful FCM token registration"""
        # Mock database query for existing token
        mock_db.query.return_value.filter.return_value.first.return_value = None
        mock_db.add = Mock()
        mock_db.commit = Mock()
        
        token_data = {
            "token": "test_fcm_token_123",
            "device_type": "web"
        }
        
        response = client.post(
            "/fcm/register",
            json=token_data,
            headers={"Authorization": f"Bearer test_token"}
        )
        
        assert response.status_code == 200
        assert response.json()["success"] is True
    
    def test_register_fcm_token_update_existing(self, mock_db, mock_user):
        """Test updating existing FCM token"""
        # Mock existing token
        existing_token = Mock(spec=FCMTokenORM)
        existing_token.token = "test_fcm_token_123"
        existing_token.user_id = 1
        existing_token.device_type = "web"
        existing_token.is_active = "true"
        
        mock_db.query.return_value.filter.return_value.first.return_value = existing_token
        mock_db.commit = Mock()
        
        token_data = {
            "token": "test_fcm_token_123",
            "device_type": "mobile"
        }
        
        response = client.post(
            "/fcm/register",
            json=token_data,
            headers={"Authorization": f"Bearer test_token"}
        )
        
        assert response.status_code == 200
        assert response.json()["success"] is True
    
    def test_unregister_fcm_token(self, mock_db, mock_user):
        """Test FCM token unregistration"""
        # Mock existing token
        existing_token = Mock(spec=FCMTokenORM)
        existing_token.token = "test_fcm_token_123"
        existing_token.user_id = 1
        existing_token.is_active = "true"
        
        mock_db.query.return_value.filter.return_value.first.return_value = existing_token
        mock_db.commit = Mock()
        
        token_data = {
            "token": "test_fcm_token_123",
            "device_type": "web"
        }
        
        response = client.delete(
            "/fcm/unregister",
            json=token_data,
            headers={"Authorization": f"Bearer test_token"}
        )
        
        assert response.status_code == 200
        assert response.json()["success"] is True
        assert existing_token.is_active == "false"

class TestMessageStatusTracking:
    """Test message status tracking endpoints"""
    
    def test_mark_message_delivered(self, mock_db, mock_user, mock_service_request):
        """Test marking message as delivered"""
        # Mock message
        mock_message = Mock(spec=ChatMessageORM)
        mock_message.delivery_status = "sent"
        mock_message.delivered_at = None
        
        # Mock database queries
        mock_db.query.return_value.filter.return_value.first.side_effect = [
            mock_message,  # For message query
            mock_service_request  # For service request query
        ]
        mock_db.commit = Mock()
        
        response = client.put(
            "/chat/messages/1/delivered",
            headers={"Authorization": f"Bearer test_token"}
        )
        
        assert response.status_code == 200
        assert mock_message.delivery_status == "delivered"
        assert mock_message.delivered_at is not None
        mock_db.commit.assert_called_once()
    
    def test_mark_message_read(self, mock_db, mock_user, mock_service_request):
        """Test marking message as read"""
        # Mock message
        mock_message = Mock(spec=ChatMessageORM)
        mock_message.is_read = False
        mock_message.delivery_status = "delivered"
        mock_message.read_at = None
        
        # Mock database queries
        mock_db.query.return_value.filter.return_value.first.side_effect = [
            mock_message,  # For message query
            mock_service_request  # For service request query
        ]
        mock_db.commit = Mock()
        
        response = client.put(
            "/chat/messages/1/read",
            headers={"Authorization": f"Bearer test_token"}
        )
        
        assert response.status_code == 200
        assert mock_message.is_read is True
        assert mock_message.delivery_status == "read"
        assert mock_message.read_at is not None
        mock_db.commit.assert_called_once()

class TestMessagePagination:
    """Test message pagination functionality"""
    
    def test_get_conversation_with_pagination(self, mock_db, mock_user, mock_service_request):
        """Test getting conversation with pagination parameters"""
        # Mock messages
        mock_messages = [Mock(spec=ChatMessageORM) for _ in range(5)]
        for i, msg in enumerate(mock_messages):
            msg.id = i + 1
            msg.service_request_id = 1
            msg.sender_id = 1
            msg.message = f"Message {i + 1}"
            msg.message_type = "text"
            msg.is_read = False
            msg.delivery_status = "sent"
            msg.created_at = f"2024-01-{i+1:02d}T10:00:00Z"
        
        # Mock database queries
        mock_query = Mock()
        mock_query.filter.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = mock_messages
        mock_query.count.return_value = 10  # Total messages
        mock_db.query.return_value = mock_query
        
        response = client.get(
            "/chat/conversations/1?limit=5&offset=0",
            headers={"Authorization": f"Bearer test_token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["messages"]) == 5
        assert data["total_messages"] == 10
        assert data["has_more"] is True
        assert data["current_offset"] == 0
        assert data["limit"] == 5
    
    def test_get_conversation_pagination_no_more_messages(self, mock_db, mock_user, mock_service_request):
        """Test pagination when no more messages available"""
        # Mock empty messages
        mock_messages = []
        
        # Mock database queries
        mock_query = Mock()
        mock_query.filter.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = mock_messages
        mock_query.count.return_value = 5  # Total messages
        mock_db.query.return_value = mock_query
        
        response = client.get(
            "/chat/conversations/1?limit=10&offset=5",
            headers={"Authorization": f"Bearer test_token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["messages"]) == 0
        assert data["total_messages"] == 5
        assert data["has_more"] is False

class TestFirebaseAdminService:
    """Test Firebase Admin service"""
    
    def test_firebase_admin_initialization_success(self):
        """Test successful Firebase Admin initialization"""
        with patch('app.services.firebase_admin_service.initialize_app') as mock_init:
            with patch('app.services.firebase_admin_service.credentials.Certificate') as mock_cred:
                mock_app = Mock()
                mock_init.return_value = mock_app
                
                service = FirebaseAdminService()
                result = service.initialize()
                
                assert result is True
                assert service.is_initialized is True
    
    def test_firebase_admin_initialization_no_credentials(self):
        """Test Firebase Admin initialization without credentials"""
        with patch.dict('os.environ', {}, clear=True):
            service = FirebaseAdminService()
            result = service.initialize()
            
            assert result is False
            assert service.is_initialized is False
    
    @patch('app.services.firebase_admin_service.messaging.send')
    def test_send_chat_notification_success(self, mock_send, mock_user):
        """Test successful chat notification sending"""
        mock_send.return_value = "test_message_id"
        
        service = FirebaseAdminService()
        service.is_initialized = True
        
        result = service.send_chat_notification(
            fcm_token="test_token",
            service_request_id=1,
            sender_username="testuser",
            message_preview="Test message"
        )
        
        assert result is True
        mock_send.assert_called_once()
    
    def test_send_chat_notification_not_initialized(self):
        """Test sending notification when not initialized"""
        service = FirebaseAdminService()
        service.is_initialized = False
        
        result = service.send_chat_notification(
            fcm_token="test_token",
            service_request_id=1,
            sender_username="testuser",
            message_preview="Test message"
        )
        
        assert result is False

class TestAccessControl:
    """Test access control for chat endpoints"""
    
    def test_chat_access_owner_allowed(self, mock_db, mock_user, mock_service_request):
        """Test chat access for service request owner"""
        mock_service_request.user_id = mock_user.id
        mock_service_request.assigned_provider_id = 2
        
        mock_db.query.return_value.filter.return_value.first.return_value = mock_service_request
        
        response = client.get(
            "/chat/conversations/1",
            headers={"Authorization": f"Bearer test_token"}
        )
        
        # Should not raise 403 error
        assert response.status_code != 403
    
    def test_chat_access_assigned_provider_allowed(self, mock_db, mock_user, mock_service_request):
        """Test chat access for assigned provider"""
        mock_service_request.user_id = 1
        mock_service_request.assigned_provider_id = mock_user.id
        
        mock_db.query.return_value.filter.return_value.first.return_value = mock_service_request
        
        response = client.get(
            "/chat/conversations/1",
            headers={"Authorization": f"Bearer test_token"}
        )
        
        # Should not raise 403 error
        assert response.status_code != 403
    
    def test_chat_access_unauthorized_user_denied(self, mock_db, mock_user, mock_service_request):
        """Test chat access denied for unauthorized user"""
        mock_service_request.user_id = 1
        mock_service_request.assigned_provider_id = 2
        
        mock_db.query.return_value.filter.return_value.first.return_value = mock_service_request
        
        response = client.get(
            "/chat/conversations/1",
            headers={"Authorization": f"Bearer test_token"}
        )
        
        # Should raise 403 error
        assert response.status_code == 403

# Integration tests
class TestChatIntegration:
    """Integration tests for complete chat flow"""
    
    @pytest.mark.asyncio
    async def test_complete_chat_flow(self, mock_db, mock_user, mock_service_request):
        """Test complete chat flow from connection to message delivery"""
        # This would test the full flow:
        # 1. WebSocket connection
        # 2. Message sending
        # 3. Message broadcasting
        # 4. Status updates
        # 5. Push notifications
        
        # Implementation would depend on specific test setup
        pass

if __name__ == "__main__":
    pytest.main([__file__])

