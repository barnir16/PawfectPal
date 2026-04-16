"""
Firebase features exposed to authenticated users.

This service wraps Remote Config access so the routers do not have to deal with
Firebase initialization details directly.
"""

import logging
from typing import Dict, Optional

from app.models.user import UserORM
from app.services.firebase_admin import firebase_admin

logger = logging.getLogger(__name__)


class FirebaseUserService:
    def __init__(self):
        self.firebase_config = {}

    def initialize_for_user(self, user: UserORM) -> bool:
        """Initialize Firebase services for any authenticated user."""
        _ = user
        try:
            self.firebase_config = firebase_admin.get_remote_config()

            if self.firebase_config:
                logger.info("Firebase config initialized for authenticated user access")
                return True

            logger.warning("Firebase config is empty for authenticated user access")
            return False
        except Exception:
            logger.exception("Failed to initialize Firebase for an authenticated user")
            return False

    def get_user_config(self, user: UserORM, key: str) -> Optional[str]:
        """Get a Firebase config value for the current authenticated user."""
        try:
            if not self.firebase_config:
                self.initialize_for_user(user)

            value = firebase_admin.get_config_value(key)
            if value:
                logger.debug("Firebase config '%s' retrieved", key)
                return value

            logger.debug("Firebase config '%s' not found", key)
            return None
        except Exception:
            logger.exception("Error getting Firebase config '%s'", key)
            return None

    def get_gemini_api_key_for_user(self, user: UserORM) -> Optional[str]:
        """Get the Gemini API key for the current authenticated user."""
        try:
            if not self.firebase_config:
                self.initialize_for_user(user)

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
        """Get all available Firebase configs for a user."""
        try:
            if not self.firebase_config:
                self.initialize_for_user(user)

            configs = {}
            for key in self.firebase_config.keys():
                value = firebase_admin.get_config_value(key)
                if value:
                    configs[key] = value

            logger.debug("Retrieved %s Firebase config values", len(configs))
            return configs
        except Exception:
            logger.exception("Error getting Firebase configs")
            return {}


firebase_user_service = FirebaseUserService()
