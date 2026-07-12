from unittest.mock import MagicMock

from fastapi.testclient import TestClient

from app.main import app
from app.routers import references

client = TestClient(app)


def test_search_dog_breeds_uses_backend_provider_key(monkeypatch):
    monkeypatch.setenv("DOG_API_KEY", "test-dog-key")

    response_payload = [{"name": "Labrador Retriever"}]
    provider_response = MagicMock()
    provider_response.json.return_value = response_payload
    provider_response.raise_for_status.return_value = None

    requests_get = MagicMock(return_value=provider_response)
    monkeypatch.setattr(references.requests, "get", requests_get)

    response = client.get("/breeds/dog", params={"q": "lab"})

    assert response.status_code == 200
    assert response.json() == ["Labrador Retriever"]
    requests_get.assert_called_once()
    assert requests_get.call_args.kwargs["headers"] == {"x-api-key": "test-dog-key"}
    assert requests_get.call_args.kwargs["params"] == {"q": "lab"}


def test_get_cat_breed_info_returns_normalized_shape(monkeypatch):
    provider_response = MagicMock()
    provider_response.json.return_value = [
        {
            "name": "Persian",
            "weight": {"metric": "3 - 5"},
            "life_span": "12 - 16 years",
            "temperament": "Quiet, affectionate",
            "origin": "Iran",
            "energy_level": 2,
            "grooming": 5,
            "intelligence": 3,
            "child_friendly": 4,
            "dog_friendly": 2,
        }
    ]
    provider_response.raise_for_status.return_value = None

    monkeypatch.setattr(references.requests, "get", MagicMock(return_value=provider_response))

    response = client.get("/breeds/cat/info", params={"name": "persian"})

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Persian"
    assert data["averageWeight"] == {"min": 3.0, "max": 5.0, "unit": "kg"}
    assert data["lifeExpectancy"] == {"min": 12, "max": 16, "unit": "years"}
    assert data["characteristics"]["groomingNeeds"] == "high"
