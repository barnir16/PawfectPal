"""Firebase Remote Config access via service-account OAuth2."""

import json
import logging
import os
from typing import Any, Dict, Optional

import requests
from google.auth.transport.requests import Request
from google.oauth2 import service_account

logger = logging.getLogger(__name__)


class FirebaseAdminService:
    def __init__(self):
        self.initialized = False
        self.config: Dict[str, Any] = {}
        self.project_id = "pawfectpal-ac5d7"
        self.credentials = None
        self.access_token = None

    def initialize(self):
        """Initialize Firebase Admin with the Railway service account."""
        try:
            service_account_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")

            if not service_account_json:
                logger.warning(
                    "FIREBASE_SERVICE_ACCOUNT_JSON is not configured; Firebase Admin is unavailable"
                )
                return False

            try:
                service_account_info = json.loads(service_account_json)
                self.credentials = service_account.Credentials.from_service_account_info(
                    service_account_info,
                    scopes=[
                        "https://www.googleapis.com/auth/firebase.remoteconfig",
                        "https://www.googleapis.com/auth/cloud-platform",
                        "https://www.googleapis.com/auth/firebase.messaging",
                    ],
                )

                if not self.credentials.valid:
                    self.credentials.refresh(Request())

                self.access_token = self.credentials.token
                self.initialized = True
                logger.info("Firebase Admin initialized successfully")
                return True

            except json.JSONDecodeError:
                logger.exception("FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON")
                return False
            except Exception:
                logger.exception(
                    "Failed to create Firebase credentials from Railway environment"
                )
                return False

        except Exception:
            logger.exception("Failed to initialize Firebase Admin")
            return False

    def get_remote_config(self) -> Dict[str, Any]:
        """Get Firebase Remote Config with service-account OAuth2 authentication."""
        try:
            if not self.initialized and not self.initialize():
                logger.warning(
                    "Firebase initialization failed; Remote Config could not be fetched"
                )
                return {}

            url = (
                f"https://firebaseremoteconfig.googleapis.com/v1/projects/"
                f"{self.project_id}/remoteConfig"
            )
            headers = {"Authorization": f"Bearer {self.access_token}"}

            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()

            data = response.json()
            self.config = data.get("parameters", {})

            logger.info(
                "Firebase Remote Config fetched successfully with %s parameters",
                len(self.config),
            )
            logger.debug("Available Remote Config keys: %s", list(self.config.keys()))
            return self.config

        except requests.exceptions.RequestException:
            logger.exception("Network error fetching Firebase Remote Config")
            return {}
        except Exception:
            logger.exception("Failed to fetch Firebase Remote Config")
            return {}

    def _get_remote_config_with_api_key(self) -> Dict[str, Any]:
        """Fallback method using a Firebase API key placeholder."""
        firebase_api_key = os.getenv("FIREBASE_API_KEY")

        if not firebase_api_key:
            logger.warning(
                "Firebase API key fallback is unavailable because FIREBASE_API_KEY is missing"
            )
            return {}

        logger.info(
            "Using Firebase API key fallback path; full Remote Config access still requires a service account"
        )
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
        """Get the Gemini API key from Railway first, then Remote Config."""
        try:
            if not self.config:
                self.get_remote_config()

            env_key = os.getenv("GEMINI_API_KEY")
            if self._is_valid_gemini_key(env_key):
                logger.info("Using Gemini API key from Railway environment")
                return env_key
            if self._looks_like_firebase_web_key(env_key):
                logger.warning(
                    "GEMINI_API_KEY currently matches the Firebase web API key and will be ignored"
                )
                return None

            gemini_key = self.get_config_value("gemini_api_key")
            if self._is_valid_gemini_key(gemini_key):
                logger.info("Using Gemini API key from Firebase Remote Config")
                return gemini_key
            if self._looks_like_firebase_web_key(gemini_key):
                logger.warning(
                    "Remote Config gemini_api_key matches the Firebase web API key and will be ignored"
                )

            logger.warning("Gemini API key is not available in Railway or Remote Config")
            return None

        except Exception:
            logger.exception("Error getting Gemini API key")
            return None

    def get_config_value(self, key: str) -> Optional[str]:
        """Get a config value from Firebase Remote Config."""
        try:
            if not self.config:
                self.get_remote_config()

            config_item = self.config.get(key, {})
            return config_item.get("defaultValue", {}).get("value")

        except Exception:
            logger.exception("Error getting config value for %s", key)
            return None


firebase_admin = FirebaseAdminService()
