"""Backend-only Firebase/Gemini configuration helpers."""

import logging
import os
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)


class FirebaseAdminService:
    def __init__(self):
        self.initialized = False
        self.config: Dict[str, Any] = {}
        self.access_token = None

    def initialize(self) -> bool:
        """Mark backend Firebase credentials as available when configured."""
        self.initialized = bool(os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON"))
        if not self.initialized:
            logger.warning("FIREBASE_SERVICE_ACCOUNT_JSON is not configured")
        return self.initialized

    def get_remote_config(self) -> Dict[str, Any]:
        """Remote Config is intentionally disabled as an application config source."""
        return {}

    def _looks_like_firebase_web_key(self, candidate: Optional[str]) -> bool:
        firebase_api_key = os.getenv("FIREBASE_API_KEY")
        return bool(candidate and firebase_api_key and candidate == firebase_api_key)

    def _is_valid_gemini_key(self, candidate: Optional[str]) -> bool:
        return bool(
            candidate
            and candidate.startswith("AIza")
            and not self._looks_like_firebase_web_key(candidate)
        )

    def get_gemini_api_key(self) -> Optional[str]:
        """Get the Gemini API key from the backend environment only."""
        try:
            env_key = os.getenv("GEMINI_API_KEY")
            if self._is_valid_gemini_key(env_key):
                logger.info("Using Gemini API key from backend environment")
                return env_key
            if self._looks_like_firebase_web_key(env_key):
                logger.warning(
                    "GEMINI_API_KEY matches the Firebase web API key and will be ignored"
                )
                return None

            logger.warning("GEMINI_API_KEY is not configured")
            return None

        except Exception:
            logger.exception("Error getting Gemini API key")
            return None

    def get_config_value(self, key: str) -> Optional[str]:
        """Remote Config values are not exposed through backend app code."""
        _ = key
        return None


firebase_admin = FirebaseAdminService()
