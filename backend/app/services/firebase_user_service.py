"""Backend Firebase/Gemini helpers for authenticated user flows."""

import logging
from typing import Dict, Optional

from app.models.user import UserORM
from app.services.firebase_admin import firebase_admin

logger = logging.getLogger(__name__)


class FirebaseUserService:
    def initialize_for_user(self, user: UserORM) -> bool:
        """No user-readable Firebase config is initialized by the backend."""
        _ = user
        return False

    def get_user_config(self, user: UserORM, key: str) -> Optional[str]:
        """User-readable Firebase config is intentionally disabled."""
        _ = (user, key)
        return None

    def get_gemini_api_key_for_user(self, user: UserORM) -> Optional[str]:
        """Get the Gemini API key for an authenticated user flow."""
        _ = user
        try:
            api_key = firebase_admin.get_gemini_api_key()
            if api_key:
                logger.info("Gemini API key resolved for authenticated user flow")
                return api_key

            logger.warning("Gemini API key is not available for authenticated user flow")
            return None
        except Exception:
            logger.exception("Error getting Gemini API key for authenticated user flow")
            return None

    def get_available_configs(self, user: UserORM) -> Dict[str, str]:
        """Return no backend/Firebase config to users."""
        _ = user
        return {}


firebase_user_service = FirebaseUserService()
