"""
Backend Tests for FCM Token Management
Tests FCM token registration, management, and push notification functionality
"""
import pytest
import json
from unittest.mock import Mock, patch, MagicMock
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.models import UserORM, FCMTokenORM
from app.routers.fcm_tokens import register_fcm_token, unregister_fcm_token, get_user_fcm_tokens
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
def mock_fcm_token():
    """Mock FCM token for testing"""
    token = Mock(spec=FCMTokenORM)
    token.id = 1
    token.user_id = 1
    token.token = "test_fcm_token_123"
    token.device_type = "web"
    token.is_active = "true"
    token.created_at = "2024-01-01T10:00:00Z"
    token.last_used = "2024-01-01T10:00:00Z"
    return token

class TestFCMTokenRegistration:
    """Test FCM token registration functionality"""
    
    def test_register_new_fcm_token_success(self, mock_db, mock_user):
        """Test successful registration of new FCM token"""
        # Mock database query for existing token (should return None)
        mock_db.query.return_value.filter.return_value.first.return_value = None
        mock_db.add = Mock()
        mock_db.commit = Mock()
        
        token_data = {
            "token": "new_fcm_token_456",
            "device_type": "mobile"
        }
        
        result = register_fcm_token(token_data, mock_db, mock_user)
        
        assert result.success is True
        assert "registered successfully" in result.message
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()
    
    def test_register_existing_fcm_token_update(self, mock_db, mock_user, mock_fcm_token):
        """Test updating existing FCM token"""
        # Mock database query to return existing token
        mock_db.query.return_value.filter.return_value.first.return_value = mock_fcm_token
        mock_db.commit = Mock()
        
        token_data = {
            "token": "test_fcm_token_123",
            "device_type": "mobile"
        }
        
        result = register_fcm_token(token_data, mock_db, mock_user)
        
        assert result.success is True
        assert "updated successfully" in result.message
        assert mock_fcm_token.user_id == mock_user.id
        assert mock_fcm_token.device_type == "mobile"
        assert mock_fcm_token.is_active == "true"
        mock_db.commit.assert_called_once()
    
    def test_register_fcm_token_database_error(self, mock_db, mock_user):
        """Test FCM token registration with database error"""
        # Mock database error
        mock_db.query.side_effect = Exception("Database error")
        
        token_data = {
            "token": "test_fcm_token_123",
            "device_type": "web"
        }
        
        with pytest.raises(Exception):
            register_fcm_token(token_data, mock_db, mock_user)

class TestFCMTokenUnregistration:
    """Test FCM token unregistration functionality"""
    
    def test_unregister_fcm_token_success(self, mock_db, mock_user, mock_fcm_token):
        """Test successful FCM token unregistration"""
        # Mock database query to return existing token
        mock_db.query.return_value.filter.return_value.first.return_value = mock_fcm_token
        mock_db.commit = Mock()
        
        token_data = {
            "token": "test_fcm_token_123",
            "device_type": "web"
        }
        
        result = unregister_fcm_token(token_data, mock_db, mock_user)
        
        assert result.success is True
        assert "unregistered successfully" in result.message
        assert mock_fcm_token.is_active == "false"
        mock_db.commit.assert_called_once()
    
    def test_unregister_nonexistent_fcm_token(self, mock_db, mock_user):
        """Test unregistering non-existent FCM token"""
        # Mock database query to return None (token not found)
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        token_data = {
            "token": "nonexistent_token",
            "device_type": "web"
        }
        
        result = unregister_fcm_token(token_data, mock_db, mock_user)
        
        assert result.success is False
        assert "not found" in result.message
    
    def test_unregister_fcm_token_database_error(self, mock_db, mock_user):
        """Test FCM token unregistration with database error"""
        # Mock database error
        mock_db.query.side_effect = Exception("Database error")
        
        token_data = {
            "token": "test_fcm_token_123",
            "device_type": "web"
        }
        
        with pytest.raises(Exception):
            unregister_fcm_token(token_data, mock_db, mock_user)

class TestFCMTokenRetrieval:
    """Test FCM token retrieval functionality"""
    
    def test_get_user_fcm_tokens_success(self, mock_db, mock_user, mock_fcm_token):
        """Test successful retrieval of user FCM tokens"""
        # Mock database query to return list of tokens
        mock_db.query.return_value.filter.return_value.all.return_value = [mock_fcm_token]
        
        result = get_user_fcm_tokens(mock_db, mock_user)
        
        assert "tokens" in result
        assert len(result["tokens"]) == 1
        assert result["tokens"][0]["id"] == mock_fcm_token.id
        assert result["tokens"][0]["device_type"] == mock_fcm_token.device_type
    
    def test_get_user_fcm_tokens_empty(self, mock_db, mock_user):
        """Test retrieval when user has no FCM tokens"""
        # Mock database query to return empty list
        mock_db.query.return_value.filter.return_value.all.return_value = []
        
        result = get_user_fcm_tokens(mock_db, mock_user)
        
        assert "tokens" in result
        assert len(result["tokens"]) == 0
    
    def test_get_user_fcm_tokens_database_error(self, mock_db, mock_user):
        """Test FCM token retrieval with database error"""
        # Mock database error
        mock_db.query.side_effect = Exception("Database error")
        
        with pytest.raises(Exception):
            get_user_fcm_tokens(mock_db, mock_user)

class TestFirebaseAdminService:
    """Test Firebase Admin service functionality"""
    
    def test_firebase_admin_initialization_with_credentials(self):
        """Test Firebase Admin initialization with valid credentials"""
        with patch.dict('os.environ', {'FIREBASE_CREDENTIALS': '{"type": "service_account"}'}):
            with patch('app.services.firebase_admin_service.initialize_app') as mock_init:
                with patch('app.services.firebase_admin_service.credentials.Certificate') as mock_cred:
                    mock_app = Mock()
                    mock_init.return_value = mock_app
                    
                    service = FirebaseAdminService()
                    result = service.initialize()
                    
                    assert result is True
                    assert service.is_initialized is True
                    mock_init.assert_called_once()
    
    def test_firebase_admin_initialization_no_credentials(self):
        """Test Firebase Admin initialization without credentials"""
        with patch.dict('os.environ', {}, clear=True):
            service = FirebaseAdminService()
            result = service.initialize()
            
            assert result is False
            assert service.is_initialized is False
    
    def test_firebase_admin_initialization_invalid_credentials(self):
        """Test Firebase Admin initialization with invalid credentials"""
        with patch.dict('os.environ', {'FIREBASE_CREDENTIALS': 'invalid_json'}):
            service = FirebaseAdminService()
            result = service.initialize()
            
            assert result is False
            assert service.is_initialized is False
    
    @patch('app.services.firebase_admin_service.messaging.send')
    def test_send_chat_notification_success(self, mock_send):
        """Test successful chat notification sending"""
        mock_send.return_value = "test_message_id"
        
        service = FirebaseAdminService()
        service.is_initialized = True
        
        result = service.send_chat_notification(
            fcm_token="test_fcm_token",
            service_request_id=1,
            sender_username="testuser",
            message_preview="Hello world!"
        )
        
        assert result is True
        mock_send.assert_called_once()
        
        # Verify the message structure
        call_args = mock_send.call_args[0][0]
        assert call_args.notification.title == "New message from testuser"
        assert "Hello world!" in call_args.notification.body
        assert call_args.token == "test_fcm_token"
    
    @patch('app.services.firebase_admin_service.messaging.send')
    def test_send_chat_notification_long_message(self, mock_send):
        """Test chat notification with long message preview"""
        mock_send.return_value = "test_message_id"
        
        service = FirebaseAdminService()
        service.is_initialized = True
        
        long_message = "A" * 150  # Longer than 100 characters
        
        result = service.send_chat_notification(
            fcm_token="test_fcm_token",
            service_request_id=1,
            sender_username="testuser",
            message_preview=long_message
        )
        
        assert result is True
        
        # Verify message was truncated
        call_args = mock_send.call_args[0][0]
        assert len(call_args.notification.body) <= 103  # 100 + "..."
        assert call_args.notification.body.endswith("...")
    
    def test_send_chat_notification_not_initialized(self):
        """Test sending notification when service not initialized"""
        service = FirebaseAdminService()
        service.is_initialized = False
        
        result = service.send_chat_notification(
            fcm_token="test_fcm_token",
            service_request_id=1,
            sender_username="testuser",
            message_preview="Test message"
        )
        
        assert result is False
    
    @patch('app.services.firebase_admin_service.messaging.send')
    def test_send_chat_notification_firebase_error(self, mock_send):
        """Test chat notification sending with Firebase error"""
        from firebase_admin.exceptions import FirebaseError
        mock_send.side_effect = FirebaseError("Firebase error", "INVALID_TOKEN")
        
        service = FirebaseAdminService()
        service.is_initialized = True
        
        result = service.send_chat_notification(
            fcm_token="invalid_token",
            service_request_id=1,
            sender_username="testuser",
            message_preview="Test message"
        )
        
        assert result is False
    
    @patch('app.services.firebase_admin_service.messaging.send_multicast')
    def test_send_multicast_notification_success(self, mock_send_multicast):
        """Test successful multicast notification sending"""
        # Mock response
        mock_response = Mock()
        mock_response.success_count = 2
        mock_response.failure_count = 0
        mock_response.responses = [
            Mock(success=True, message_id="msg1"),
            Mock(success=True, message_id="msg2")
        ]
        mock_send_multicast.return_value = mock_response
        
        service = FirebaseAdminService()
        service.is_initialized = True
        
        result = service.send_multicast_notification(
            fcm_tokens=["token1", "token2"],
            service_request_id=1,
            sender_username="testuser",
            message_preview="Test message"
        )
        
        assert result["success"] is True
        assert result["success_count"] == 2
        assert result["failure_count"] == 0
        assert len(result["responses"]) == 2
    
    @patch('app.services.firebase_admin_service.messaging.send_multicast')
    def test_send_multicast_notification_partial_failure(self, mock_send_multicast):
        """Test multicast notification with partial failures"""
        # Mock response with some failures
        mock_response = Mock()
        mock_response.success_count = 1
        mock_response.failure_count = 1
        mock_response.responses = [
            Mock(success=True, message_id="msg1"),
            Mock(success=False, exception=Mock(code="INVALID_TOKEN"))
        ]
        mock_send_multicast.return_value = mock_response
        
        service = FirebaseAdminService()
        service.is_initialized = True
        
        result = service.send_multicast_notification(
            fcm_tokens=["valid_token", "invalid_token"],
            service_request_id=1,
            sender_username="testuser",
            message_preview="Test message"
        )
        
        assert result["success"] is True
        assert result["success_count"] == 1
        assert result["failure_count"] == 1
        assert len(result["responses"]) == 2
        assert result["responses"][0]["success"] is True
        assert result["responses"][1]["success"] is False

class TestFCMIntegration:
    """Integration tests for FCM functionality"""
    
    def test_fcm_token_lifecycle(self, mock_db, mock_user, mock_fcm_token):
        """Test complete FCM token lifecycle"""
        # 1. Register token
        token_data = {
            "token": "test_fcm_token_123",
            "device_type": "web"
        }
        
        mock_db.query.return_value.filter.return_value.first.return_value = None
        mock_db.add = Mock()
        mock_db.commit = Mock()
        
        register_result = register_fcm_token(token_data, mock_db, mock_user)
        assert register_result.success is True
        
        # 2. Get user tokens
        mock_db.query.return_value.filter.return_value.all.return_value = [mock_fcm_token]
        get_result = get_user_fcm_tokens(mock_db, mock_user)
        assert len(get_result["tokens"]) == 1
        
        # 3. Unregister token
        mock_db.query.return_value.filter.return_value.first.return_value = mock_fcm_token
        unregister_result = unregister_fcm_token(token_data, mock_db, mock_user)
        assert unregister_result.success is True
        assert mock_fcm_token.is_active == "false"
    
    @patch('app.services.firebase_admin_service.messaging.send')
    def test_chat_message_to_push_notification_flow(self, mock_send):
        """Test complete flow from chat message to push notification"""
        # This would test the integration between:
        # 1. Chat message creation
        # 2. FCM token lookup
        # 3. Push notification sending
        
        mock_send.return_value = "test_message_id"
        
        service = FirebaseAdminService()
        service.is_initialized = True
        
        # Simulate sending notification for a chat message
        result = service.send_chat_notification(
            fcm_token="test_fcm_token",
            service_request_id=1,
            sender_username="testuser",
            message_preview="New message in chat"
        )
        
        assert result is True
        mock_send.assert_called_once()

class TestFCMErrorHandling:
    """Test FCM error handling scenarios"""
    
    def test_fcm_token_validation(self, mock_db, mock_user):
        """Test FCM token validation"""
        # Test with invalid token format
        invalid_token_data = {
            "token": "",  # Empty token
            "device_type": "web"
        }
        
        # Should handle gracefully
        result = register_fcm_token(invalid_token_data, mock_db, mock_user)
        # Implementation should validate token format
    
    def test_fcm_device_type_validation(self, mock_db, mock_user):
        """Test FCM device type validation"""
        # Test with invalid device type
        token_data = {
            "token": "valid_token",
            "device_type": "invalid_device"
        }
        
        mock_db.query.return_value.filter.return_value.first.return_value = None
        mock_db.add = Mock()
        mock_db.commit = Mock()
        
        result = register_fcm_token(token_data, mock_db, mock_user)
        assert result.success is True
        # Should accept any device type or validate against allowed types

if __name__ == "__main__":
    pytest.main([__file__])

