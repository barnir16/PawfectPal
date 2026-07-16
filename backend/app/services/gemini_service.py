"""Shared Gemini client wrapper.

Centralizes model configuration, prompt execution, and error normalization so
every AI-backed feature (chat, vaccine explainer, marketplace draft, ...)
goes through one tested code path instead of duplicating
genai.configure/GenerativeModel/error-parsing logic per router.

Model name: set GEMINI_MODEL (e.g. gemini-2.5-flash). If unset, DEFAULT_MODEL_NAME
is used. API key: resolved via app.services.firebase_admin.get_gemini_api_key()
(backend environment only) unless an explicit api_key is passed in.
"""

from __future__ import annotations

import logging
import os
import re
from typing import Any, Optional

import google.generativeai as genai  # type: ignore

from app.services.firebase_admin import firebase_admin

logger = logging.getLogger(__name__)

# Default model if GEMINI_MODEL is not set (override in Railway when Google
# deprecates a SKU). Using full 2.5-flash for now per product decision —
# flash-lite is the likely long-term default once quota/cost is validated.
DEFAULT_MODEL_NAME = "gemini-2.5-flash"


class GeminiUnavailableError(Exception):
    """Raised when Gemini cannot be reached: no key, network failure, or a
    non-quota provider error. Callers should fall back to rule-based logic."""


class GeminiRateLimitError(Exception):
    """Raised when the provider signals quota exhaustion (HTTP 429)."""

    def __init__(self, retry_after_seconds: Optional[int] = None):
        self.retry_after_seconds = retry_after_seconds
        super().__init__("Gemini rate limited")


def get_model_name() -> str:
    return os.getenv("GEMINI_MODEL", DEFAULT_MODEL_NAME).strip() or DEFAULT_MODEL_NAME


def get_api_key() -> Optional[str]:
    return firebase_admin.get_gemini_api_key()


def is_available() -> bool:
    return bool(get_api_key())


def extract_response_text(response: Any) -> str:
    """Normalize a Gemini response object into plain text; handles blocked
    or empty candidates without raising."""
    try:
        text = getattr(response, "text", None)
        if text and str(text).strip():
            return str(text).strip()
    except Exception:
        pass
    try:
        cands = getattr(response, "candidates", None) or []
        if cands and getattr(cands[0], "content", None):
            parts = getattr(cands[0].content, "parts", None) or []
            chunks = [getattr(p, "text", "") for p in parts if getattr(p, "text", None)]
            if chunks:
                return "".join(chunks).strip()
    except Exception:
        pass
    return ""


def extract_retry_delay_seconds(error_message: str) -> Optional[int]:
    match = re.search(r"retry in\s+(\d+(?:\.\d+)?)s", error_message, re.IGNORECASE)
    if not match:
        return None
    try:
        return max(1, int(float(match.group(1))))
    except ValueError:
        return None


def generate_text(prompt: str, api_key: Optional[str] = None) -> str:
    """Run a single-turn Gemini generation call and return the response text.

    Raises:
        GeminiUnavailableError: no API key configured, a non-quota provider
            error, or an empty/blocked response.
        GeminiRateLimitError: the provider signaled quota exhaustion (429).
    """
    key = api_key or get_api_key()
    if not key:
        raise GeminiUnavailableError("GEMINI_API_KEY is not configured")

    try:
        genai.configure(api_key=key)
        model = genai.GenerativeModel(get_model_name())
        raw = model.generate_content(prompt)
    except Exception as exc:
        error_message = str(exc)
        logger.warning("Gemini generation failed: %s", error_message)
        if "429" in error_message or "quota" in error_message.lower():
            raise GeminiRateLimitError(extract_retry_delay_seconds(error_message)) from exc
        raise GeminiUnavailableError(error_message) from exc

    text = extract_response_text(raw)
    if not text:
        raise GeminiUnavailableError("Gemini returned an empty response")
    return text
