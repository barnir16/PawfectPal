"""
Simple Firebase config that doesn't fail
"""
import os
from typing import Optional

class SimpleFirebaseConfig:
    def __init__(self):
        self.initialized = True
        self.config = {}
    
    def get_gemini_api_key(self) -> Optional[str]:
        """Get Gemini API key from environment variable"""
        return os.getenv("GEMINI_API_KEY")
    
    def get_dog_api_key(self) -> Optional[str]:
        """Get Dog API key from environment variable"""
        return os.getenv("DOG_API_KEY")

# Use simple config instead of complex Firebase
firebase_config = SimpleFirebaseConfig()
