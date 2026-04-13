import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

from app.main import app
from app.dependencies.auth import get_current_user
from app.models.user import UserORM

client = TestClient(app)


@pytest.fixture
def test_user():
    return UserORM(
        id=1,
        username="testuser",
        hashed_password="hashedpassword",
        email="test@example.com",
        full_name="Test User",
        is_provider=False,
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
            "next_vet_visit": "2024-07-01",
        }
    ]


class TestAIEndpoints:
    def test_ai_chat_success(self, test_user, mock_pets):
        request_data = {
            "message": "What should I feed my dog?",
            "pet_context": {"pets": mock_pets, "total_pets": 1},
            "prompt_language": "en",
        }

        mock_response = MagicMock()
        mock_response.text = (
            "You should feed your dog high-quality dog food appropriate for their age and size."
        )

        app.dependency_overrides[get_current_user] = lambda: test_user
        try:
            with patch(
                "app.services.firebase_user_service.firebase_user_service.get_gemini_api_key_for_user",
                return_value="test_api_key",
            ), patch(
                "google.generativeai.GenerativeModel.generate_content",
                return_value=mock_response,
            ):
                response = client.post("/ai/chat", json=request_data)
        finally:
            app.dependency_overrides.pop(get_current_user, None)

        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "suggested_actions" in data
        assert (
            "high-quality dog food" in data["message"]
            or "dog food" in data["message"].lower()
        )

    def test_ai_chat_empty_message(self, test_user):
        request_data = {
            "message": "",
            "pet_context": {"pets": [], "total_pets": 0},
            "prompt_language": "en",
        }

        app.dependency_overrides[get_current_user] = lambda: test_user
        try:
            response = client.post("/ai/chat", json=request_data)
        finally:
            app.dependency_overrides.pop(get_current_user, None)

        assert response.status_code == 200
        data = response.json()
        assert "Please provide a message" in data["message"]

    def test_ai_chat_no_api_key(self, test_user, mock_pets):
        request_data = {
            "message": "What should I feed my dog?",
            "pet_context": {"pets": mock_pets, "total_pets": 1},
            "prompt_language": "en",
        }

        app.dependency_overrides[get_current_user] = lambda: test_user
        try:
            with patch(
                "app.services.firebase_user_service.firebase_user_service.get_gemini_api_key_for_user",
                return_value=None,
            ):
                response = client.post("/ai/chat", json=request_data)
        finally:
            app.dependency_overrides.pop(get_current_user, None)

        assert response.status_code == 200
        data = response.json()
        assert "temporarily unavailable" in data["message"].lower()

    def test_ai_chat_unauthorized(self, mock_pets):
        request_data = {
            "message": "What should I feed my dog?",
            "pet_context": {"pets": mock_pets, "total_pets": 1},
            "prompt_language": "en",
        }

        response = client.post("/ai/chat", json=request_data)
        assert response.status_code == 401

    def test_ai_test_endpoint(self):
        response = client.get("/ai/test")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "ok"
