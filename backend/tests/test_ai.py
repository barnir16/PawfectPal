import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, Mock
import os

from main import app
from dependencies.auth import get_current_user
from models.user import UserORM

client = TestClient(app)

@pytest.fixture
def test_user():
    return UserORM(
        id=1,
        username="testuser",
        hashed_password="hashedpassword",
        email="test@example.com",
        full_name="Test User",
        is_provider=False
    )

@pytest.fixture
def mock_pets():
    return [
        {
            "name": "Buddy",
            "type": "dog",
            "breed": "Golden Retriever",
            "age": 3,
            "weight": 25.5,
            "gender": "male",
            "health_issues": [],
            "behavior_issues": [],
            "is_vaccinated": True,
            "is_neutered": True,
            "last_vet_visit": "2024-01-01",
            "next_vet_visit": "2024-07-01"
        }
    ]

class TestAIEndpoints:
    def test_ai_chat_success(self, test_user, mock_pets):
        """Test AI chat endpoint with valid request"""
        headers = {"Authorization": "Bearer mock_token"}
        
        request_data = {
            "message": "What should I feed my dog?",
            "pet_context": {
                "pets": mock_pets,
                "total_pets": 1
            },
            "prompt_language": "en"
        }
        
        with patch('dependencies.auth.get_current_user', return_value=test_user), \
             patch('services.firebase_user_service.firebase_user_service.get_gemini_api_key_for_user', return_value="test_api_key"), \
             patch('routers.ai_simple.call_gemini_api') as mock_gemini:
            
            mock_gemini.return_value = "You should feed your dog high-quality dog food appropriate for their age and size."
            
            response = client.post("/ai/chat", json=request_data, headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "suggested_actions" in data
        assert data["message"] == "You should feed your dog high-quality dog food appropriate for their age and size."

    def test_ai_chat_empty_message(self, test_user):
        """Test AI chat with empty message"""
        headers = {"Authorization": "Bearer mock_token"}
        
        request_data = {
            "message": "",
            "pet_context": {"pets": [], "total_pets": 0},
            "prompt_language": "en"
        }
        
        with patch('dependencies.auth.get_current_user', return_value=test_user):
            response = client.post("/ai/chat", json=request_data, headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "Please provide a message" in data["message"]

    def test_ai_chat_no_api_key(self, test_user, mock_pets):
        """Test AI chat when no API key is available"""
        headers = {"Authorization": "Bearer mock_token"}
        
        request_data = {
            "message": "What should I feed my dog?",
            "pet_context": {
                "pets": mock_pets,
                "total_pets": 1
            },
            "prompt_language": "en"
        }
        
        with patch('dependencies.auth.get_current_user', return_value=test_user), \
             patch('services.firebase_user_service.firebase_user_service.get_gemini_api_key_for_user', return_value=None), \
             patch.dict(os.environ, {}, clear=True):
            
            response = client.post("/ai/chat", json=request_data, headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "temporarily unavailable" in data["message"]

    def test_ai_chat_unauthorized(self, mock_pets):
        """Test AI chat without authentication"""
        request_data = {
            "message": "What should I feed my dog?",
            "pet_context": {
                "pets": mock_pets,
                "total_pets": 1
            },
            "prompt_language": "en"
        }
        
        response = client.post("/ai/chat", json=request_data)
        assert response.status_code == 401

    def test_ai_test_endpoint(self, mock_pets):
        """Test the AI test endpoint (no auth required)"""
        request_data = {
            "message": "Hello",
            "pet_context": {
                "pets": mock_pets,
                "total_pets": 1
            },
            "prompt_language": "en"
        }
        
        with patch('routers.ai_simple.call_gemini_api') as mock_gemini:
            mock_gemini.return_value = "Hello! How can I help you with your pet?"
            
            response = client.post("/ai/test", json=request_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["message"] == "Hello! How can I help you with your pet?"
