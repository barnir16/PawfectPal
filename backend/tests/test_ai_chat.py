# tests/test_ai_router.py
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from app.main import app  # adjust if your FastAPI app entry point is different
from app.models import UserORM

client = TestClient(app)


# ----------------------------
# Fixtures
# ----------------------------
@pytest.fixture
def mock_user():
    return UserORM(
        id=1, username="testuser", email="test@example.com", is_provider=False
    )


@pytest.fixture
def sample_pet_context():
    return {
        "pets": [
            {
                "name": "Fido",
                "type": "Dog",
                "breed": "Beagle",
                "age": 3,
                "weight": 12,
                "gender": "Male",
                "health_issues": ["allergy"],
                "behavior_issues": ["peeing indoors"],
                "is_vaccinated": True,
                "is_neutered": True,
            },
            {
                "name": "Whiskers",
                "type": "Cat",
                "breed": "Siamese",
                "age": 1,
                "weight": 4,
                "gender": "Female",
                "health_issues": [],
                "behavior_issues": [],
                "is_vaccinated": True,
                "is_neutered": False,
            },
        ]
    }


# ----------------------------
# Unit tests
# ----------------------------
from app.routers import ai_simple as ai


def test_create_simple_prompt_includes_pet_info(sample_pet_context):
    prompt = ai.create_simple_prompt("How is my dog?", sample_pet_context)
    assert "Fido: Dog (Beagle)" in prompt
    assert "Whiskers: Cat (Siamese)" in prompt
    assert "USER QUESTION: How is my dog?" in prompt


def test_generate_simple_actions_returns_expected_keys():
    actions = ai.generate_simple_actions("Hello", {})
    assert any(a["id"] == "health_help" for a in actions)
    assert any(a["id"] == "behavior_help" for a in actions)


def test_handle_simple_fallback_sorting(sample_pet_context):
    request_message = "Can you sort my pets by age?"
    response = ai.handle_simple_fallback(request_message, sample_pet_context)
    assert "Here are your pets sorted from youngest to oldest" in response.message
    assert "Fido" in response.message
    assert "Whiskers" in response.message


def test_handle_simple_fallback_specific_pet(sample_pet_context):
    request_message = "Tell me about Fido"
    response = ai.handle_simple_fallback(request_message, sample_pet_context)
    assert "I can help with Fido's care" in response.message
    assert any(
        "care" in action["label"].lower() for action in response.suggested_actions
    )


def test_handle_simple_fallback_default(sample_pet_context):
    request_message = "Hello AI"
    response = ai.handle_simple_fallback(request_message, sample_pet_context)
    assert "I'd be happy to help with your pet care questions" in response.message
    assert len(response.suggested_actions) > 0


# ----------------------------
# Endpoint tests
# ----------------------------
@patch(
    "services.firebase_user_service.firebase_user_service.get_gemini_api_key_for_user"
)
@patch("google.generativeai.GenerativeModel.generate_content")
def test_chat_with_ai_gemini(mock_generate, mock_key, mock_user, sample_pet_context):
    # Mock Gemini key and response
    mock_key.return_value = "fake-key"
    mock_generate.return_value = MagicMock(text="Gemini mock response")

    # Patch dependency
    app.dependency_overrides[ai.get_current_user] = lambda: mock_user

    response = client.post(
        "/ai/chat", json={"message": "How is Fido?", "pet_context": sample_pet_context}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Gemini mock response"
    assert any(a["id"] == "health_help" for a in data["suggested_actions"])

    app.dependency_overrides = {}


@patch(
    "services.firebase_user_service.firebase_user_service.get_gemini_api_key_for_user"
)
def test_chat_with_ai_no_key_triggers_fallback(mock_key, mock_user, sample_pet_context):
    mock_key.return_value = None
    app.dependency_overrides[ai.get_current_user] = lambda: mock_user

    response = client.post(
        "/ai/chat", json={"message": "Sort my pets", "pet_context": sample_pet_context}
    )

    assert response.status_code == 200
    data = response.json()
    assert "Here are your pets sorted from youngest to oldest" in data["message"]

    app.dependency_overrides = {}


@patch("services.firebase_user_service.firebase_user_service.get_available_configs")
def test_firebase_config_endpoint_success(mock_configs, mock_user):
    mock_configs.return_value = {"feature_x": "enabled"}
    app.dependency_overrides[ai.get_current_user] = lambda: mock_user

    response = client.get("/ai/firebase-config")
    assert response.status_code == 200
    data = response.json()
    assert data["firebase_available"] is True
    assert data["configs"]["feature_x"] == "enabled"

    app.dependency_overrides = {}
