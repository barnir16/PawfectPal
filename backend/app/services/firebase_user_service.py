"""
Firebase User Service - Provides Firebase features to all authenticated users
Not just Google OAuth users, but also email/password users
"""

import os
import json
from typing import Optional, Dict, Any
from models.user import UserORM
from services.firebase_admin import firebase_admin

class FirebaseUserService:
    def __init__(self):
        self.firebase_config = {}
        
    def initialize_for_user(self, user: UserORM) -> bool:
        """Initialize Firebase services for any authenticated user"""
        try:
            # Get Firebase Remote Config for this user
            self.firebase_config = firebase_admin.get_remote_config()
            
            if self.firebase_config:
                print(f"✅ Firebase initialized for user: {user.username}")
                return True
            else:
                print(f"⚠️ Firebase config empty for user: {user.username}")
                return False
                
        except Exception as e:
            print(f"❌ Failed to initialize Firebase for user {user.username}: {str(e)}")
            return False
    
    def get_user_config(self, user: UserORM, key: str) -> Optional[str]:
        """Get Firebase config value for any authenticated user"""
        try:
            # Initialize if not already done
            if not self.firebase_config:
                self.initialize_for_user(user)
            
            # Get the config value
            value = firebase_admin.get_config_value(key)
            
            if value:
                print(f"✅ Config '{key}' retrieved for user: {user.username}")
                return value
            else:
                print(f"⚠️ Config '{key}' not found for user: {user.username}")
                return None
                
        except Exception as e:
            print(f"❌ Error getting config '{key}' for user {user.username}: {str(e)}")
            return None
    
    def get_gemini_api_key_for_user(self, user: UserORM) -> Optional[str]:
        """Get Gemini API key for any authenticated user"""
        try:
            # Initialize Firebase for this user
            if not self.firebase_config:
                self.initialize_for_user(user)
            
            # Get Gemini API key
            api_key = firebase_admin.get_gemini_api_key()
            
            if api_key:
                print(f"✅ Gemini API key retrieved for user: {user.username}")
                return api_key
            else:
                print(f"⚠️ Gemini API key not available for user: {user.username}")
                return None
                
        except Exception as e:
            print(f"❌ Error getting Gemini API key for user {user.username}: {str(e)}")
            return None
    
    def get_available_configs(self, user: UserORM) -> Dict[str, str]:
        """Get all available Firebase configs for a user"""
        try:
            # Initialize Firebase for this user
            if not self.firebase_config:
                self.initialize_for_user(user)
            
            configs = {}
            for key in self.firebase_config.keys():
                value = firebase_admin.get_config_value(key)
                if value:
                    configs[key] = value
            
            print(f"✅ Retrieved {len(configs)} configs for user: {user.username}")
            return configs
            
        except Exception as e:
            print(f"❌ Error getting configs for user {user.username}: {str(e)}")
            return {}

# Global instance
firebase_user_service = FirebaseUserService()
