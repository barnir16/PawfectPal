"""
Firebase Remote Config service for backend
Handles API key retrieval from Firebase Remote Config
"""

import os
import json
import requests
from typing import Optional

class FirebaseConfigService:
    def __init__(self):
        self.initialized = False
        self.config = {}
        self.project_id = "pawfectpal-ac5d7"  # Your Firebase project ID
        self.api_key = "AIzaSyDoNsVE_ZmgBBuVJ3IKZpAAZRz9HS-67s8"  # Your Firebase API key
        
    def initialize(self):
        """Initialize Firebase Remote Config"""
        try:
            # Get Firebase Remote Config
            url = f"https://firebaseremoteconfig.googleapis.com/v1/projects/{self.project_id}/namespaces/firebase:fetch"
            params = {"key": self.api_key}
            
            response = requests.get(url, params=params)
            response.raise_for_status()
            
            data = response.json()
            self.config = data.get("parameters", {})
            self.initialized = True
            
            print("✅ Firebase Remote Config initialized successfully")
            return True
            
        except Exception as e:
            print(f"❌ Failed to initialize Firebase Remote Config: {str(e)}")
            return False
    
    def get_gemini_api_key(self) -> Optional[str]:
        """Get Gemini API key from Firebase Remote Config"""
        try:
            if not self.initialized:
                print("🔄 Firebase Config: Initializing...")
                self.initialize()
            
            # Get the Gemini API key from config
            gemini_config = self.config.get("gemini_api_key", {})
            if gemini_config.get("value"):
                api_key = gemini_config["value"]
                print(f"✅ Firebase Config: Found Gemini API key (length: {len(api_key)})")
                return api_key
            
            print("⚠️ Gemini API key not found in Firebase Remote Config")
            print(f"🔍 Available config keys: {list(self.config.keys())}")
            return None
            
        except Exception as e:
            print(f"❌ Error getting Gemini API key: {str(e)}")
            return None
    
    def get_dog_api_key(self) -> Optional[str]:
        """Get Dog API key from Firebase Remote Config"""
        try:
            if not self.initialized:
                self.initialize()
            
            # Get the Dog API key from config
            dog_config = self.config.get("dog_api_key", {})
            if dog_config.get("value"):
                return dog_config["value"]
            
            print("⚠️ Dog API key not found in Firebase Remote Config")
            return None
            
        except Exception as e:
            print(f"❌ Error getting Dog API key: {str(e)}")
            return None

# Global instance
firebase_config = FirebaseConfigService()
