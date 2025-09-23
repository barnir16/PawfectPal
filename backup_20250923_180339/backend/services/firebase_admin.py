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
        """Initialize Firebase Admin with service account or default credentials"""
        try:
            # Try to get service account from environment variable
            service_account_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
            
            if service_account_json:
                # Parse JSON from environment variable
                try:
                    service_account_info = json.loads(service_account_json)
                    self.credentials = service_account.Credentials.from_service_account_info(
                        service_account_info,
                        scopes=['https://www.googleapis.com/auth/firebase.remoteconfig']
                    )
                    print("✅ Firebase Admin: Using service account from environment")
                except json.JSONDecodeError:
                    print("❌ Invalid JSON in FIREBASE_SERVICE_ACCOUNT_JSON")
                    return False
            else:
                # Try to use default credentials (for local development)
                try:
                    self.credentials, _ = google.auth.default(
                        scopes=['https://www.googleapis.com/auth/firebase.remoteconfig']
                    )
                    print("✅ Firebase Admin: Using default credentials")
                except Exception as e:
                    print(f"❌ No default credentials available: {e}")
                    return False
            
            # Get access token
            if not self.credentials.valid:
                self.credentials.refresh(Request())
            
            self.access_token = self.credentials.token
            self.initialized = True
            
            print("✅ Firebase Admin initialized successfully")
            return True
            
        except Exception as e:
            print(f"❌ Failed to initialize Firebase Admin: {str(e)}")
            return False
    
    def get_remote_config(self) -> Dict[str, Any]:
        """Get Firebase Remote Config with proper authentication"""
        try:
            if not self.initialized:
                if not self.initialize():
                    return {}
            
            # Use correct Firebase Remote Config API endpoint
            url = f"https://firebaseremoteconfig.googleapis.com/v1/projects/{self.project_id}/remoteConfig"
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": "application/json"
            }
            
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            
            data = response.json()
            self.config = data.get("parameters", {})
            
            print(f"✅ Firebase Remote Config fetched successfully: {len(self.config)} parameters")
            return self.config
            
        except Exception as e:
            print(f"❌ Failed to fetch Firebase Remote Config: {str(e)}")
            return {}
    
    def get_gemini_api_key(self) -> Optional[str]:
        """Get Gemini API key from Firebase Remote Config or environment"""
        try:
            # First try environment variable
            env_key = os.getenv("GEMINI_API_KEY")
            if env_key:
                print("✅ Using Gemini API key from environment variable")
                return env_key
            
            # Try Firebase Remote Config
            if not self.config:
                self.get_remote_config()
            
            # Get the Gemini API key from config
            gemini_config = self.config.get("gemini_api_key", {})
            if gemini_config.get("defaultValue", {}).get("value"):
                api_key = gemini_config["defaultValue"]["value"]
                print(f"✅ Firebase Config: Found Gemini API key (length: {len(api_key)})")
                return api_key
            
            print("⚠️ Gemini API key not found in Firebase Remote Config or environment")
            print(f"🔍 Available config keys: {list(self.config.keys())}")
            return None
            
        except Exception as e:
            print(f"❌ Error getting Gemini API key: {str(e)}")
            return None
    
    def get_config_value(self, key: str) -> Optional[str]:
        """Get any config value from Firebase Remote Config"""
        try:
            if not self.config:
                self.get_remote_config()
            
            config_item = self.config.get(key, {})
            return config_item.get("defaultValue", {}).get("value")
            
        except Exception as e:
            print(f"❌ Error getting config value for {key}: {str(e)}")
            return None

# Global instance
firebase_admin = FirebaseAdminService()
