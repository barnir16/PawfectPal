"""Firebase Remote Config access via service-account OAuth2."""

import os
import json
import requests
from typing import Optional, Dict, Any
from google.oauth2 import service_account
from google.auth.transport.requests import Request
import google.auth

class FirebaseAdminService:
    def __init__(self):
        self.initialized = False
        self.config = {}
        self.project_id = "pawfectpal-ac5d7"
        self.credentials = None
        self.access_token = None
        
    def initialize(self):
        """Initialize Firebase Admin with service account from Railway environment"""
        try:
            # Get service account JSON from Railway environment
            service_account_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
            
            if not service_account_json:
                print("FIREBASE_SERVICE_ACCOUNT_JSON not found in Railway environment")
                return False
            
            # Parse and use the service account credentials
            try:
                service_account_info = json.loads(service_account_json)
                self.credentials = service_account.Credentials.from_service_account_info(
                    service_account_info,
                    scopes=[
                        'https://www.googleapis.com/auth/firebase.remoteconfig',
                        'https://www.googleapis.com/auth/cloud-platform',
                        'https://www.googleapis.com/auth/firebase.messaging'
                    ]
                )
                print("Firebase Admin: Using service account from Railway environment")
                
                # Get access token for API calls
                if not self.credentials.valid:
                    self.credentials.refresh(Request())
                
                self.access_token = self.credentials.token
                self.initialized = True
                print("Firebase Admin initialized successfully")
                return True
                
            except json.JSONDecodeError as e:
                print(f"Invalid JSON in Railway FIREBASE_SERVICE_ACCOUNT_JSON: {e}")
                return False
            except Exception as e:
                print(f"Error creating credentials from Railway environment: {e}")
                return False
            
        except Exception as e:
            print(f"Failed to initialize Firebase Admin: {str(e)}")
            return False
    
    def get_remote_config(self) -> Dict[str, Any]:
        """Get Firebase Remote Config with service-account OAuth2 authentication."""
        try:
            if not self.initialized:
                if not self.initialize():
                    print("Firebase initialization failed, cannot fetch Remote Config")
                    return {}
            
            # Use Firebase REST API with OAuth2 Bearer Token
            url = f"https://firebaseremoteconfig.googleapis.com/v1/projects/{self.project_id}/remoteConfig"
            headers = {
                "Authorization": f"Bearer {self.access_token}"
            }
            
            print(f"Fetching Remote Config from: {url}")
            
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            self.config = data.get("parameters", {})
            
            print(f"Firebase Remote Config fetched successfully: {len(self.config)} parameters")
            print(f"Available config keys: {list(self.config.keys())}")
            return self.config
            
        except requests.exceptions.RequestException as e:
            print(f"Network error fetching Firebase Remote Config: {str(e)}")
            return {}
        except Exception as e:
            print(f"Failed to fetch Firebase Remote Config: {str(e)}")
            return {}
    
    def _get_remote_config_with_api_key(self) -> Dict[str, Any]:
        """Fallback method using Firebase API key (limited functionality)"""
        firebase_api_key = os.getenv("FIREBASE_API_KEY")
        
        if not firebase_api_key:
            print("No Firebase API key available for fallback")
            print("To fix this, you need to:")
            print("   1. Create a Firebase service account")
            print("   2. Download the service account JSON file")
            print("   3. Set FIREBASE_SERVICE_ACCOUNT_JSON environment variable")
            print("   4. Or set FIREBASE_API_KEY for basic API access")
            return {}
        
        print("Using Firebase API key fallback (limited functionality)")
        print("For full Remote Config access, use service account authentication")
        
        # Note: Firebase Remote Config API doesn't support API key authentication
        # This is just a placeholder for future implementation
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
        """Get Gemini API key from Firebase Remote Config"""
        try:
            # Get the config first
            if not self.config:
                self.get_remote_config()
            
            env_key = os.getenv("GEMINI_API_KEY")
            if self._is_valid_gemini_key(env_key):
                print("Using Gemini API key from environment variable")
                return env_key
            elif self._looks_like_firebase_web_key(env_key):
                print("Detected Firebase API key instead of Gemini API key")
                return None
            
            gemini_key = self.get_config_value("gemini_api_key")
            if self._is_valid_gemini_key(gemini_key):
                print("Using Gemini API key from Firebase Remote Config")
                return gemini_key
            elif self._looks_like_firebase_web_key(gemini_key):
                print("Firebase Remote Config contains Firebase API key instead of Gemini API key")
            
            print("Gemini API key not found in Firebase Remote Config or environment")
            return None
            
        except Exception as e:
            print(f"Error getting Gemini API key: {str(e)}")
            return None
    
    def get_config_value(self, key: str) -> Optional[str]:
        """Get any config value from Firebase Remote Config"""
        try:
            if not self.config:
                self.get_remote_config()
            
            config_item = self.config.get(key, {})
            return config_item.get("defaultValue", {}).get("value")
            
        except Exception as e:
            print(f"Error getting config value for {key}: {str(e)}")
            return None

# Global instance
firebase_admin = FirebaseAdminService()
