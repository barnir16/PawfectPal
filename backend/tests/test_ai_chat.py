# tests/test_ai_router.py
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from app.main import app
from app.models import UserORM
from app.dependencies.auth import get_current_user

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
    prompt = ai.create_simple_prompt("How is my dog?", sample_pet_context, None, "en")
    assert "Fido: Dog (Beagle)" in prompt
    assert "Whiskers: Cat (Siamese)" in prompt
    assert "USER QUESTION: How is my dog?" in prompt


def test_generate_simple_actions_returns_expected_keys():
    actions = ai.generate_simple_actions("Hello", {})
    assert any(a["id"] == "health_help" for a in actions)
    assert any(a["id"] == "behavior_help" for a in actions)


def test_generate_simple_actions_detects_emergency(sample_pet_context):
    actions = ai.generate_simple_actions("My dog is bleeding and unconscious!", sample_pet_context)
    assert any(a["id"] == "emergency_help" and a["type"] == "emergency" for a in actions)
    # Baseline actions should still be present alongside the detected intent.
    assert any(a["id"] == "health_help" for a in actions)


def test_generate_simple_actions_detects_schedule_vet(sample_pet_context):
    actions = ai.generate_simple_actions("I need to schedule a vet appointment", sample_pet_context)
    assert any(a["id"] == "schedule_vet_visit" and a["type"] == "schedule_vet" for a in actions)


def test_generate_simple_actions_detects_diet(sample_pet_context):
    actions = ai.generate_simple_actions("What should I feed my dog for his diet?", sample_pet_context)
    assert any(a["id"] == "nutrition_tips" and a["type"] == "nutrition_tips" for a in actions)


def test_generate_simple_actions_detects_exercise(sample_pet_context):
    actions = ai.generate_simple_actions("How much exercise does he need?", sample_pet_context)
    assert any(a["id"] == "exercise_plan" and a["type"] == "exercise_plan" for a in actions)


def test_generate_simple_actions_suggests_add_pet_when_no_pets():
    actions = ai.generate_simple_actions("Hello", {"pets": []})
    assert any(a["id"] == "add_pet" and a["type"] == "add_pet" for a in actions)


def test_generate_simple_actions_hebrew_labels(sample_pet_context):
    actions = ai.generate_simple_actions("שלום", sample_pet_context, "he")
    health_action = next(a for a in actions if a["id"] == "health_help")
    assert health_action["label"] == "עזרה בריאותית"


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
    "app.services.firebase_user_service.firebase_user_service.get_gemini_api_key_for_user"
)
@patch("google.generativeai.GenerativeModel.generate_content")
def test_chat_with_ai_gemini(mock_generate, mock_key, mock_user, sample_pet_context):
    mock_key.return_value = "fake-key"
    mock_generate.return_value = MagicMock(text="Gemini mock response")

    app.dependency_overrides[get_current_user] = lambda: mock_user

    response = client.post(
        "/ai/chat", json={"message": "How is Fido?", "pet_context": sample_pet_context}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Gemini mock response"
    assert any(a["id"] == "health_help" for a in data["suggested_actions"])

    app.dependency_overrides.clear()


@patch(
    "app.services.firebase_user_service.firebase_user_service.get_gemini_api_key_for_user"
)
def test_chat_with_ai_no_key_triggers_fallback(mock_key, mock_user, sample_pet_context):
    mock_key.return_value = None
    app.dependency_overrides[get_current_user] = lambda: mock_user

    response = client.post(
        "/ai/chat", json={"message": "Sort my pets", "pet_context": sample_pet_context}
    )

    assert response.status_code == 200
    data = response.json()
    assert "Here are your pets sorted from youngest to oldest" in data["message"]

    app.dependency_overrides.clear()


@patch(
    "app.services.firebase_user_service.firebase_user_service.get_available_configs"
)
def test_firebase_config_endpoint_success(mock_configs, mock_user):
    mock_configs.return_value = {
        "enable_ai_chatbot": "true",
        "gemini_api_key": "should-not-be-exposed",
    }
    app.dependency_overrides[get_current_user] = lambda: mock_user

    response = client.get("/ai/firebase-config")
    assert response.status_code == 200
    data = response.json()
    assert data["firebase_available"] is True
    assert data["configs"]["enable_ai_chatbot"] == "true"
    assert "gemini_api_key" not in data["configs"]

    app.dependency_overrides.clear()


# ----------------------------
# Vaccine explainer endpoint tests
# ----------------------------
@pytest.fixture
def vaccine_explainer_payload():
    return {
        "pet_name": "Fido",
        "pet_type": "dog",
        "pet_age_weeks": 52,
        "suggestions": [
            {
                "vaccine_name": "Rabies",
                "category": "mandatory",
                "priority": "high",
                "is_overdue": True,
                "due_date": "2026-01-01",
                "reason": "Required by law",
            },
            {
                "vaccine_name": "Bordetella",
                "category": "recommended",
                "priority": "medium",
                "is_overdue": False,
                "due_date": "2026-09-01",
            },
        ],
    }


@patch("app.services.gemini_service.get_api_key")
def test_vaccine_explainer_falls_back_without_key(mock_get_key, mock_user, vaccine_explainer_payload):
    mock_get_key.return_value = None
    app.dependency_overrides[get_current_user] = lambda: mock_user

    response = client.post("/ai/vaccine-explainer", json=vaccine_explainer_payload)

    assert response.status_code == 200
    data = response.json()
    assert data["ai_generated"] is False
    assert "Fido" in data["explanation"]
    assert "Rabies" in data["explanation"]

    app.dependency_overrides.clear()


@patch("app.services.gemini_service.genai.GenerativeModel")
@patch("app.services.gemini_service.genai.configure")
@patch("app.services.gemini_service.get_api_key")
def test_vaccine_explainer_uses_gemini_when_available(
    mock_get_key, mock_configure, mock_model_cls, mock_user, vaccine_explainer_payload
):
    mock_get_key.return_value = "fake-key"
    mock_model = MagicMock()
    mock_model.generate_content.return_value = MagicMock(
        text="Fido is overdue for rabies — book a vet visit soon."
    )
    mock_model_cls.return_value = mock_model
    app.dependency_overrides[get_current_user] = lambda: mock_user

    response = client.post("/ai/vaccine-explainer", json=vaccine_explainer_payload)

    assert response.status_code == 200
    data = response.json()
    assert data["ai_generated"] is True
    assert "rabies" in data["explanation"].lower()

    app.dependency_overrides.clear()


@patch("app.services.gemini_service.genai.GenerativeModel")
@patch("app.services.gemini_service.genai.configure")
@patch("app.services.gemini_service.get_api_key")
def test_vaccine_explainer_falls_back_on_gemini_error(
    mock_get_key, mock_configure, mock_model_cls, mock_user, vaccine_explainer_payload
):
    mock_get_key.return_value = "fake-key"
    mock_model = MagicMock()
    mock_model.generate_content.side_effect = Exception("network unreachable")
    mock_model_cls.return_value = mock_model
    app.dependency_overrides[get_current_user] = lambda: mock_user

    response = client.post("/ai/vaccine-explainer", json=vaccine_explainer_payload)

    assert response.status_code == 200
    data = response.json()
    assert data["ai_generated"] is False
    assert "Fido" in data["explanation"]

    app.dependency_overrides.clear()


def test_vaccine_explainer_fallback_handles_no_outstanding_vaccines(mock_user):
    app.dependency_overrides[get_current_user] = lambda: mock_user

    response = client.post(
        "/ai/vaccine-explainer",
        json={"pet_name": "Whiskers", "pet_type": "cat", "suggestions": []},
    )

    assert response.status_code == 200
    data = response.json()
    assert "Whiskers" in data["explanation"]

    app.dependency_overrides.clear()


# ----------------------------
# Marketplace draft endpoint tests
# ----------------------------
@pytest.fixture
def marketplace_draft_payload():
    return {
        "service_type": "dog walking",
        "pets": [{"name": "Fido", "type": "dog", "breed": "Beagle"}],
        "location": "Tel Aviv",
        "is_urgent": False,
        "extra_context": "Needs walks twice a day",
    }


@patch("app.services.gemini_service.get_api_key")
def test_marketplace_draft_falls_back_without_key(mock_get_key, mock_user, marketplace_draft_payload):
    mock_get_key.return_value = None
    app.dependency_overrides[get_current_user] = lambda: mock_user

    response = client.post("/ai/marketplace-draft", json=marketplace_draft_payload)

    assert response.status_code == 200
    data = response.json()
    assert data["ai_generated"] is False
    assert "Fido" in data["title"]
    assert "dog walking" in data["title"]
    assert "Tel Aviv" in data["description"]

    app.dependency_overrides.clear()


@patch("app.services.gemini_service.genai.GenerativeModel")
@patch("app.services.gemini_service.genai.configure")
@patch("app.services.gemini_service.get_api_key")
def test_marketplace_draft_parses_gemini_title_description(
    mock_get_key, mock_configure, mock_model_cls, mock_user, marketplace_draft_payload
):
    mock_get_key.return_value = "fake-key"
    mock_model = MagicMock()
    mock_model.generate_content.return_value = MagicMock(
        text="TITLE: Daily walks needed for Fido\nDESCRIPTION: Looking for a reliable dog walker for Fido, twice a day in Tel Aviv."
    )
    mock_model_cls.return_value = mock_model
    app.dependency_overrides[get_current_user] = lambda: mock_user

    response = client.post("/ai/marketplace-draft", json=marketplace_draft_payload)

    assert response.status_code == 200
    data = response.json()
    assert data["ai_generated"] is True
    assert data["title"] == "Daily walks needed for Fido"
    assert "Fido" in data["description"]

    app.dependency_overrides.clear()


@patch("app.services.gemini_service.genai.GenerativeModel")
@patch("app.services.gemini_service.genai.configure")
@patch("app.services.gemini_service.get_api_key")
def test_marketplace_draft_handles_unformatted_gemini_response(
    mock_get_key, mock_configure, mock_model_cls, mock_user, marketplace_draft_payload
):
    mock_get_key.return_value = "fake-key"
    mock_model = MagicMock()
    # Model ignored the TITLE:/DESCRIPTION: format — first line becomes the title.
    mock_model.generate_content.return_value = MagicMock(
        text="Reliable dog walker wanted\nWe need someone to walk Fido daily."
    )
    mock_model_cls.return_value = mock_model
    app.dependency_overrides[get_current_user] = lambda: mock_user

    response = client.post("/ai/marketplace-draft", json=marketplace_draft_payload)

    assert response.status_code == 200
    data = response.json()
    assert data["ai_generated"] is True
    assert data["title"] == "Reliable dog walker wanted"
    assert "Fido" in data["description"]

    app.dependency_overrides.clear()


@patch("app.services.gemini_service.genai.GenerativeModel")
@patch("app.services.gemini_service.genai.configure")
@patch("app.services.gemini_service.get_api_key")
def test_marketplace_draft_falls_back_on_gemini_error(
    mock_get_key, mock_configure, mock_model_cls, mock_user, marketplace_draft_payload
):
    mock_get_key.return_value = "fake-key"
    mock_model = MagicMock()
    mock_model.generate_content.side_effect = Exception("network unreachable")
    mock_model_cls.return_value = mock_model
    app.dependency_overrides[get_current_user] = lambda: mock_user

    response = client.post("/ai/marketplace-draft", json=marketplace_draft_payload)

    assert response.status_code == 200
    data = response.json()
    assert data["ai_generated"] is False
    assert "Fido" in data["title"]

    app.dependency_overrides.clear()


def test_marketplace_draft_fallback_handles_no_pets(mock_user):
    app.dependency_overrides[get_current_user] = lambda: mock_user

    response = client.post(
        "/ai/marketplace-draft",
        json={"service_type": "pet sitting", "pets": []},
    )

    assert response.status_code == 200
    data = response.json()
    assert "pet sitting" in data["title"].lower()

    app.dependency_overrides.clear()


def test_marketplace_draft_hebrew_fallback(mock_user):
    app.dependency_overrides[get_current_user] = lambda: mock_user

    response = client.post(
        "/ai/marketplace-draft",
        json={
            "service_type": "הליכה עם כלבים",
            "pets": [{"name": "רקס", "type": "dog"}],
            "prompt_language": "he",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert "רקס" in data["title"]

    app.dependency_overrides.clear()
