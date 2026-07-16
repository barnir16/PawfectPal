from unittest.mock import MagicMock, patch

import pytest

from app.services import gemini_service


def test_get_model_name_defaults(monkeypatch):
    monkeypatch.delenv("GEMINI_MODEL", raising=False)
    assert gemini_service.get_model_name() == gemini_service.DEFAULT_MODEL_NAME


def test_get_model_name_respects_env_override(monkeypatch):
    monkeypatch.setenv("GEMINI_MODEL", "gemini-2.5-pro")
    assert gemini_service.get_model_name() == "gemini-2.5-pro"


def test_extract_response_text_prefers_direct_text_attr():
    response = MagicMock(text="Hello there")
    assert gemini_service.extract_response_text(response) == "Hello there"


def test_extract_response_text_falls_back_to_candidates():
    response = MagicMock(text=None)
    part = MagicMock(text="From candidate parts")
    content = MagicMock(parts=[part])
    candidate = MagicMock(content=content)
    response.candidates = [candidate]
    # Simulate `.text` raising, forcing the candidate-parts fallback path.
    type(response).text = property(lambda self: (_ for _ in ()).throw(ValueError()))
    assert gemini_service.extract_response_text(response) == "From candidate parts"


def test_extract_response_text_returns_empty_on_total_failure():
    response = MagicMock()
    type(response).text = property(lambda self: (_ for _ in ()).throw(ValueError()))
    response.candidates = None
    assert gemini_service.extract_response_text(response) == ""


def test_extract_retry_delay_seconds_parses_message():
    assert gemini_service.extract_retry_delay_seconds("please retry in 12.5s") == 12
    assert gemini_service.extract_retry_delay_seconds("no delay info here") is None


def test_generate_text_raises_unavailable_without_key():
    with pytest.raises(gemini_service.GeminiUnavailableError):
        gemini_service.generate_text("hello", api_key=None)


@patch("app.services.gemini_service.genai.GenerativeModel")
@patch("app.services.gemini_service.genai.configure")
def test_generate_text_success(mock_configure, mock_model_cls):
    mock_model = MagicMock()
    mock_model.generate_content.return_value = MagicMock(text="Gemini says hi")
    mock_model_cls.return_value = mock_model

    result = gemini_service.generate_text("hello", api_key="fake-key")

    assert result == "Gemini says hi"
    mock_configure.assert_called_once_with(api_key="fake-key")


@patch("app.services.gemini_service.genai.GenerativeModel")
@patch("app.services.gemini_service.genai.configure")
def test_generate_text_raises_rate_limit_on_quota_error(mock_configure, mock_model_cls):
    mock_model = MagicMock()
    mock_model.generate_content.side_effect = Exception("429 quota exceeded, retry in 5s")
    mock_model_cls.return_value = mock_model

    with pytest.raises(gemini_service.GeminiRateLimitError) as exc_info:
        gemini_service.generate_text("hello", api_key="fake-key")

    assert exc_info.value.retry_after_seconds == 5


@patch("app.services.gemini_service.genai.GenerativeModel")
@patch("app.services.gemini_service.genai.configure")
def test_generate_text_raises_unavailable_on_empty_response(mock_configure, mock_model_cls):
    mock_model = MagicMock()
    mock_model.generate_content.return_value = MagicMock(text="", candidates=None)
    mock_model_cls.return_value = mock_model

    with pytest.raises(gemini_service.GeminiUnavailableError):
        gemini_service.generate_text("hello", api_key="fake-key")


@patch("app.services.gemini_service.genai.GenerativeModel")
@patch("app.services.gemini_service.genai.configure")
def test_generate_text_raises_unavailable_on_other_errors(mock_configure, mock_model_cls):
    mock_model = MagicMock()
    mock_model.generate_content.side_effect = Exception("network unreachable")
    mock_model_cls.return_value = mock_model

    with pytest.raises(gemini_service.GeminiUnavailableError):
        gemini_service.generate_text("hello", api_key="fake-key")


def test_is_available_reflects_api_key_presence(monkeypatch):
    monkeypatch.setattr(gemini_service, "get_api_key", lambda: None)
    assert gemini_service.is_available() is False
    monkeypatch.setattr(gemini_service, "get_api_key", lambda: "AIzaFakeKey")
    assert gemini_service.is_available() is True
