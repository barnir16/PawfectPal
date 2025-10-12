"""
Firebase Admin SDK service for proper authentication
Handles Firebase Remote Config with service account authentication
"""

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
            # Get Firebase API key from Railway environment
            firebase_api_key = os.getenv("FIREBASE_API_KEY")
            
            if not firebase_api_key:
                print("FIREBASE_API_KEY not found in Railway environment")
                return False
            
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
                print(f"Firebase Admin initialized successfully with token: {self.access_token[:20]}...")
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
        """Get Firebase Remote Config with API key authentication"""
        try:
            if not self.initialized:
                if not self.initialize():
                    print("Firebase initialization failed, cannot fetch Remote Config")
                    return {}
            
            # Use Firebase REST API with API key
            url = f"https://firebaseremoteconfig.googleapis.com/v1/projects/{self.project_id}/remoteConfig"
            params = {
                "key": self.access_token  # This is the Firebase API key
            }
            
            print(f"Fetching Remote Config from: {url}")
            print(f"Using API key: {self.access_token[:20]}...")
            
            response = requests.get(url, params=params, timeout=10)
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
    
    def get_gemini_api_key(self) -> Optional[str]:
        """Get Gemini API key from Firebase Remote Config"""
        try:
            # Get the config first
            if not self.config:
                self.get_remote_config()
            
            # For now, use environment variable directly since Firebase Remote Config requires OAuth2
            env_key = os.getenv("GEMINI_API_KEY")
            print(f"GEMINI_API_KEY from env: {env_key[:10] if env_key else 'None'}...")
            if env_key and env_key.startswith("AIza") and not env_key.startswith("AIzaSyDoNs"):  # Valid Gemini API key format, not Firebase key
                print("Using Gemini API key from environment variable")
                return env_key
            elif env_key and env_key.startswith("AIzaSyDoNs"):
                print("Detected Firebase API key instead of Gemini API key")
                print("Please set GEMINI_API_KEY to a valid Gemini API key (not Firebase key)")
                return None
            
            # Try Firebase Remote Config as fallback (if OAuth2 is set up)
            print(f"Available config keys: {list(self.config.keys()) if self.config else 'No config'}")
            gemini_key = self.get_config_value("gemini_api_key")
            print(f"Gemini key from Firebase: {gemini_key[:10] if gemini_key else 'None'}...")
            if gemini_key and gemini_key.startswith("AIza") and not gemini_key.startswith("AIzaSyDoNs"):
                print("Using Gemini API key from Firebase Remote Config")
                return gemini_key
            elif gemini_key and gemini_key.startswith("AIzaSyDoNs"):
                print("Firebase Remote Config contains Firebase API key instead of Gemini API key")
                print("Please update the 'gemini_api_key' in Firebase Remote Config with a valid Gemini API key")
            
            print("Gemini API key not found in Firebase Remote Config or environment")
            print("To fix this immediately:")
            print("   1. Go to Railway dashboard")
            print("   2. Add environment variable: GEMINI_API_KEY = [your_new_gemini_key]")
            print("   3. Or update Firebase Remote Config with proper OAuth2 setup")
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
