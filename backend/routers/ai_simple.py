"""
Simplified AI Chat Route - Direct approach inspired by successful PawfectPlanner
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import google.generativeai as genai
from datetime import datetime, timezone
import asyncio

# Import Firebase services with error handling
try:
    from services.firebase_admin import firebase_admin
    from services.firebase_user_service import firebase_user_service
    FIREBASE_AVAILABLE = True
    print("Firebase services imported successfully")
except Exception as e:
    print(f"Firebase services not available: {e}")
    FIREBASE_AVAILABLE = False
    # Create dummy classes for fallback
    class DummyFirebaseService:
        def get_gemini_api_key_for_user(self, user): return None
        def get_available_configs(self, user): return {}
    firebase_admin = type('DummyAdmin', (), {'get_gemini_api_key': lambda: None})()
    firebase_user_service = DummyFirebaseService()

from dependencies.auth import get_current_user
from dependencies.db import get_db
from models.user import UserORM
from sqlalchemy.orm import Session

router = APIRouter(prefix="/ai", tags=["AI"])

class AIChatRequest(BaseModel):
    message: str
    pet_context: Dict[str, Any]
    prompt_language: str = "en"  # 'en' or 'he'

class AIChatResponse(BaseModel):
    message: str
    suggested_actions: List[Dict[str, str]] = []

class FirebaseConfigResponse(BaseModel):
    configs: Dict[str, str]
    user: str
    firebase_available: bool

def detect_language(message: str) -> str:
    """Detect if message is primarily English or Hebrew"""
    hebrew_chars = sum(1 for char in message if '\u0590' <= char <= '\u05FF')
    total_chars = len([char for char in message if char.isalpha()])
    
    if total_chars == 0:
        return "en"  # Default to English
    
    hebrew_ratio = hebrew_chars / total_chars
    return "he" if hebrew_ratio > 0.3 else "en"

def create_simple_prompt(message: str, pet_context: Dict[str, Any], language: str) -> str:
    """Create a simple, direct prompt based on language"""
    
    # Language-specific instructions  
    if language == "he":
        instructions = """אתה עוזר AI ידידותי וחכם לטיפול בחיות מחמד (אנגלית ועברית). ענה תמיד באותה השפה שהמשתמש משתמש בה הכי הרבה - אל תערבב בין אנגלית לעברית. אם אתה צריך להזכיר שם או ביטוי במקור בשפה האחרת, תרגם אותו לגמרי לשפה של המשתמש אם אפשר.
- אם המשתמש רק מברך אותך - ברך בחזרה באדיבות ושאל איך אתה יכול לעזור עם חיות המחמד שלו
• כשהמשתמש שואל שאלה הקשורה לחיות מחמד (טיפול, אימון, בריאות, התנהגות), ענה בהרחבה באותה השפה.
• לכל נושא אחר, אמור בנימוס שאתה יכול לענות רק על שאלות הקשורות לטיפול בחיות מחמד.
- שאילתות נשלחות עם רשימת חיות מחמד והמידע החשוב שלהן (נתונים רפואיים והתנהגותיים) שאיתם תשתמש כדי לסייע למשתמשים בקבלת הצרכים שלהם."""
    else:
        instructions = """You are a pet care platform AI friendly bilingual assistant (English and Hebrew). Always reply entirely in the same language the user uses the most - do not mix English and Hebrew. If you need to mention a name or phrase originally in the other language, translate it fully into the user's language if possible.
- if user only greets you - greet back politely and ask how you can help with their pets
• When user asks a pet-related question (care, training, health, behavior), answer thoroughly in that same language.
• For any other topic, politely say you can only answer pet-care relate questions.
- queries are sent with a list of pets and their important data (medical and behavior data) which you will use to assist the users with their needs."""

    # Format pet data simply
    pets_data = pet_context.get('pets', [])
    pets_section = ""
    
    if pets_data:
        pets_section = "\n\nPET DATA:\n"
        for pet in pets_data:
            pet_info = []
            pet_info.append(f"• Name: {pet.get('name', 'Unknown')}")
            pet_info.append(f"• Type: {pet.get('type', 'Unknown')}")
            pet_info.append(f"• Breed: {pet.get('breed', 'Unknown')}")
            pet_info.append(f"• Age: {pet.get('age', 'Unknown')}")
            pet_info.append(f"• Weight: {pet.get('weight', 'Unknown')}")
            pet_info.append(f"• Gender: {pet.get('gender', 'Unknown')}")
            
            # Add health/behavior issues if present
            health_issues = pet.get('health_issues', [])
            if health_issues:
                pet_info.append(f"• Health Issues: {', '.join(health_issues)}")
            
            behavior_issues = pet.get('behavior_issues', [])
            if behavior_issues:
                pet_info.append(f"• Behavior Issues: {', '.join(behavior_issues)}")
            
            pets_section += "\n".join(pet_info) + "\n\n"
    else:
        pets_section = "\n\nNo pet data provided.\n\n"
    
    # Simple prompt template
    prompt = f"""{instructions}

{pets_section}

USER MESSAGE: {message}

Please provide helpful advice based on the pet information provided."""
    
    return prompt

async def call_gemini_api(api_key: str, prompt: str) -> str:
    """Call Gemini API with timeout"""
    try:
        genai.configure(api_key=api_key)
        
        # First, let's list available models to see what's actually available
        try:
            models = genai.list_models()
            print(f"🔍 Available models: {[model.name for model in models]}")
            
            # Look for any model that supports generateContent
            available_model = None
            for model in models:
                if 'generateContent' in model.supported_generation_methods:
                    available_model = model.name
                    print(f"✅ Found model with generateContent: {available_model}")
                    break
            
            if not available_model:
                print("❌ No models found that support generateContent")
                return "No suitable AI models are currently available."
                
        except Exception as e:
            print(f"❌ Error listing models: {e}")
            # Fallback to trying common model names
            available_model = 'gemini-pro'
        
        model = genai.GenerativeModel(available_model)
        
        response = await asyncio.wait_for(
            model.generate_content_async(prompt),
            timeout=20.0
        )
        
        return response.text.strip() if response.text else "I apologize, but I couldn't generate a response."
    
    except asyncio.TimeoutError:
        raise Exception("AI request timed out")
    except Exception as e:
        raise Exception(f"AI request failed: {str(e)}")

@router.post("/test", response_model=AIChatResponse)
async def test_ai_chat(request: AIChatRequest):
    """Test AI chat endpoint without authentication"""
    try:
        # For testing, just return the detected language and prompt preview
        detected_lang = detect_language(request.message)
        prompt_preview = create_simple_prompt(request.message, request.pet_context, detected_lang)[:200]
        
        return AIChatResponse(
            message=f"Test endpoint working. Detected language: {detected_lang}. Prompt preview: {prompt_preview}...",
            suggested_actions=[]
        )
    except Exception as e:
        return AIChatResponse(
            message=f"Test endpoint error: {str(e)}",
            suggested_actions=[]
        )

@router.post("/chat", response_model=AIChatResponse)
async def chat_with_ai(request: AIChatRequest, current_user: UserORM = Depends(get_current_user)):
    """Simplified AI chat endpoint"""
    try:
        # Validate input
        if not request.message or not request.message.strip():
            return AIChatResponse(
                message="Please provide a message so I can help you with your pet care needs.",
                suggested_actions=[]
            )
        
        # Detect language if not provided
        language = request.prompt_language or detect_language(request.message)
        
        # Get Gemini API key from Firebase Remote Config
        api_key = None
        if FIREBASE_AVAILABLE:
            api_key = firebase_user_service.get_gemini_api_key_for_user(current_user)
        
        # Fallback to environment variable for local development
        if not api_key:
            api_key = os.getenv('GEMINI_API_KEY')
        
        if not api_key:
            print("No Gemini API key found")
            return AIChatResponse(
                message="AI chat is temporarily unavailable. Please try again later.",
                suggested_actions=[
                    {"id": "retry", "type": "retry", "label": "Try Again", "description": "Retry your request"}
                ]
            )
        
        print(f"Using Gemini API key: {api_key[:10]}...")
        
        # Create prompt and call AI
        prompt = create_simple_prompt(request.message, request.pet_context, language)
        ai_response = await call_gemini_api(api_key, prompt)
        
        # Generate simple suggested actions
        suggested_actions = []
        message_lower = request.message.lower()
        if any(word in message_lower for word in ['health', 'sick', 'vet', 'doctor']):
            suggested_actions.extend([
                {"id": "schedule_vet", "type": "schedule_vet", "label": "Schedule Vet Visit", "description": "Schedule a vet appointment"},
                {"id": "health_tracking", "type": "health_tracking", "label": "Health Tracking", "description": "Track health symptoms"}
            ])
        elif any(word in message_lower for word in ['food', 'feed', 'eating', 'diet']):
            suggested_actions.extend([
                {"id": "feeding_schedule", "type": "feeding_schedule", "label": "Feeding Schedule", "description": "Create feeding reminders"},
                {"id": "diet_consultation", "type": "diet_consultation", "label": "Diet Consultation", "description": "Get diet advice"}
            ])
        elif any(word in message_lower for word in ['exercise', 'walk', 'play', 'activity']):
            suggested_actions.extend([
                {"id": "exercise_plan", "type": "exercise_plan", "label": "Exercise Plan", "description": "Get exercise recommendations"},
                {"id": "walk_reminder", "type": "walk_reminder", "label": "Walk Reminder", "description": "Set walk reminders"}
            ])
        else:
            suggested_actions.extend([
                {"id": "general_tips", "type": "general_tips", "label": "Pet Care Tips", "description": "Get general pet care advice"},
                {"id": "create_task", "type": "create_task", "label": "Create Task", "description": "Create a reminder"}
            ])
        
        return AIChatResponse(
            message=ai_response,
            suggested_actions=suggested_actions
        )
        
    except Exception as e:
        print(f"AI Chat Error: {str(e)}")
        
        # Determine error type
        if "timed out" in str(e).lower():
            error_message = "Request timed out. Please try again with a shorter message."
        elif "connection" in str(e).lower() or "network" in str(e).lower():
            error_message = "Connection lost. Please check your internet connection and try again."
        else:
            error_message = "AI service is temporarily unavailable. Please try again later."
        
        return AIChatResponse(
            message=error_message,
            suggested_actions=[
                {"id": "retry", "type": "retry", "label": "Try Again", "description": "Retry your request"},
                {"id": "contact_support", "type": "contact_support", "label": "Contact Support", "description": "Get help from support team"}
            ]
        )

@router.get("/firebase-config", response_model=FirebaseConfigResponse)
async def get_firebase_config(current_user: UserORM = Depends(get_current_user)):
    """Get Firebase Remote Config"""
    try:
        configs = firebase_user_service.get_available_configs(current_user)
        return FirebaseConfigResponse(
            configs=configs,
            user=current_user.username,
            firebase_available=len(configs) > 0
        )
    except Exception as e:
        print(f"Error getting Firebase config for user {current_user.username}: {str(e)}")
        return FirebaseConfigResponse(
            configs={},
            user=current_user.username,
            firebase_available=False
        )