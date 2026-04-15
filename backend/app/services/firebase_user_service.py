"""
Firebase features exposed to authenticated users.

This service wraps Remote Config access so the routers do not have to deal with
Firebase initialization details directly.
"""

from typing import Dict, Optional

from app.models.user import UserORM
from app.services.firebase_admin import firebase_admin


class FirebaseUserService:
    def __init__(self):
        self.firebase_config = {}

    def initialize_for_user(self, user: UserORM) -> bool:
        """Initialize Firebase services for any authenticated user."""
        _ = user
        try:
            self.firebase_config = firebase_admin.get_remote_config()

            if self.firebase_config:
                print("Firebase config initialized for the authenticated user")
                return True

            print("Firebase config is empty for the authenticated user")
            return False
        except Exception as e:
            print(f"Failed to initialize Firebase for the authenticated user: {str(e)}")
            return False

    def get_user_config(self, user: UserORM, key: str) -> Optional[str]:
        """Get a Firebase config value for the current authenticated user."""
        try:
            if not self.firebase_config:
                self.initialize_for_user(user)

            value = firebase_admin.get_config_value(key)

            if value:
                print(f"Firebase config '{key}' retrieved")
                return value

            print(f"Firebase config '{key}' not found")
            return None
        except Exception as e:
            print(f"Error getting Firebase config '{key}': {str(e)}")
            return None

    def get_gemini_api_key_for_user(self, user: UserORM) -> Optional[str]:
        """Get the Gemini API key for the current authenticated user."""
        try:
            if not self.firebase_config:
                self.initialize_for_user(user)

            api_key = firebase_admin.get_gemini_api_key()

            if api_key:
                print("Gemini API key retrieved for the authenticated user")
                return api_key

            print("Gemini API key not available for the authenticated user")
            return None
        except Exception as e:
            print(f"Error getting Gemini API key: {str(e)}")
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

            print(f"Retrieved {len(configs)} Firebase config values")
            return configs
        except Exception as e:
            print(f"Error getting Firebase configs: {str(e)}")
            return {}


firebase_user_service = FirebaseUserService()
