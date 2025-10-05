import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from unittest.mock import Mock, patch
import tempfile
import os

from main import app
from dependencies.db import get_db
from models.base import Base
from models.user import UserORM
from models.service_request import ServiceRequestORM
from models.chat_message import ChatMessageORM

# Create a test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture(scope="function")
def test_db():
    # Create tables
    Base.metadata.create_all(bind=engine)
    yield
    # Drop tables
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def test_user(test_db):
    user = UserORM(
        username="testuser",
        hashed_password="hashedpassword",
        email="test@example.com",
        full_name="Test User",
        is_provider=False
    )
    db = TestingSessionLocal()
    db.add(user)
    db.commit()
    db.refresh(user)
    yield user
    db.close()

@pytest.fixture
def test_provider(test_db):
    provider = UserORM(
        username="testprovider",
        hashed_password="hashedpassword",
        email="provider@example.com",
        full_name="Test Provider",
        is_provider=True
    )
    db = TestingSessionLocal()
    db.add(provider)
    db.commit()
    db.refresh(provider)
    yield provider
    db.close()

@pytest.fixture
def test_service_request(test_db, test_user):
    service_request = ServiceRequestORM(
        user_id=test_user.id,
        service_type="dog_walking",
        description="Need dog walking service",
        location="Test Location",
        budget=50
    )
    db = TestingSessionLocal()
    db.add(service_request)
    db.commit()
    db.refresh(service_request)
    yield service_request
    db.close()

def create_auth_headers(user):
    """Create authorization headers for a user"""
    # In a real test, you'd create a proper JWT token
    # For now, we'll mock the authentication
    return {"Authorization": f"Bearer mock_token_{user.id}"}

class TestChatEndpoints:
    def test_send_message_success(self, test_user, test_service_request):
        """Test sending a message successfully"""
        headers = create_auth_headers(test_user)
        
        message_data = {
            "service_request_id": test_service_request.id,
            "message": "Hello, I'm interested in your service",
            "message_type": "text"
        }
        
        with patch('dependencies.auth.get_current_user', return_value=test_user):
            response = client.post("/chat/messages", json=message_data, headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == message_data["message"]
        assert data["sender_id"] == test_user.id
        assert data["service_request_id"] == test_service_request.id

    def test_send_message_unauthorized(self, test_service_request):
        """Test sending a message without authentication"""
        message_data = {
            "service_request_id": test_service_request.id,
            "message": "Hello",
            "message_type": "text"
        }
        
        response = client.post("/chat/messages", json=message_data)
        assert response.status_code == 401

    def test_get_conversation_success(self, test_user, test_service_request):
        """Test getting a conversation successfully"""
        headers = create_auth_headers(test_user)
        
        with patch('dependencies.auth.get_current_user', return_value=test_user):
            response = client.get(f"/chat/conversations/{test_service_request.id}", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["service_request_id"] == test_service_request.id
        assert "messages" in data
        assert "unread_count" in data

    def test_get_conversation_access_denied(self, test_user, test_service_request):
        """Test getting a conversation with wrong user"""
        # Create another user
        other_user = UserORM(
            username="otheruser",
            hashed_password="hashedpassword",
            email="other@example.com",
            full_name="Other User",
            is_provider=False
        )
        db = TestingSessionLocal()
        db.add(other_user)
        db.commit()
        db.refresh(other_user)
        
        headers = create_auth_headers(other_user)
        
        with patch('dependencies.auth.get_current_user', return_value=other_user):
            response = client.get(f"/chat/conversations/{test_service_request.id}", headers=headers)
        
        assert response.status_code == 403
        db.close()

    def test_provider_can_access_conversation(self, test_provider, test_service_request):
        """Test that providers can access conversations"""
        headers = create_auth_headers(test_provider)
        
        with patch('dependencies.auth.get_current_user', return_value=test_provider):
            response = client.get(f"/chat/conversations/{test_service_request.id}", headers=headers)
        
        assert response.status_code == 200

    def test_get_my_conversations(self, test_user, test_service_request):
        """Test getting user's conversations"""
        headers = create_auth_headers(test_user)
        
        with patch('dependencies.auth.get_current_user', return_value=test_user):
            response = client.get("/chat/my-conversations", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 1
        assert data[0]["service_request_id"] == test_service_request.id
