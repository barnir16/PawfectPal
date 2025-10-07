"""
Simplified AI Chat Route - Direct approach inspired by successful PawfectPlanner
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
<<<<<<< HEAD:backend/routers/ai_simple.py
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

=======
import google.generativeai as genai  # type: ignore
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from services.firebase_admin import firebase_admin
from services.firebase_user_service import firebase_user_service
from app.dependencies.auth import get_current_user
from app.models.user import UserORM

router = APIRouter(prefix="/ai", tags=["AI"])


# Configure Gemini API using Firebase Remote Config
def get_gemini_model():
    """Get Gemini model instance using Firebase Remote Config"""
    try:
        api_key = firebase_admin.get_gemini_api_key()

        if api_key:
            genai.configure(api_key=api_key)  # type: ignore
            return genai.get_model("gemini-pro")  # type: ignore
        else:
            print("⚠️ Gemini API key not found in Firebase Remote Config or environment")
            return None
    except Exception as e:
        print(f"❌ Error configuring Gemini: {e}")
        return None


# Initialize model
model = get_gemini_model()


class PetContext(BaseModel):
    name: str
    type: str
    breed: str
    age: float
    weight: float
    gender: str
    health_issues: List[str] = []
    behavior_issues: List[str] = []
    is_vaccinated: bool = False
    is_neutered: bool = False
    last_vet_visit: Optional[str] = None
    next_vet_visit: Optional[str] = None


>>>>>>> origin/merged-zoroflamingo:backend/app/routers/ai_simple.py
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

<<<<<<< HEAD:backend/routers/ai_simple.py
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
        
        # Use the working model from PawfectPlanner
        model_name = 'gemini-2.0-flash'
        print(f"🔍 Using model: {model_name}")
        
        model = genai.GenerativeModel(model_name)
        
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
=======

@router.post("/chat", response_model=AIChatResponse)
async def chat_with_ai(
    request: AIChatRequest, current_user: UserORM = Depends(get_current_user)
):
    """
    Simple AI chat endpoint - inspired by successful PawfectPlanner versions
    """
    try:
        # Get Gemini API key for this specific user (works for both Google and email users)
        api_key = firebase_user_service.get_gemini_api_key_for_user(current_user)

        if not api_key:
            raise HTTPException(
                status_code=503,
                detail="AI service temporarily unavailable. Please try again later.",
            )

        # Configure Gemini with user-specific API key
        genai.configure(api_key=api_key)
        current_model = genai.GenerativeModel("gemini-pro")

        if not current_model:
            return handle_simple_fallback(
                request.message, request.pet_context, request.conversation_history or []
            )

        # Create simple prompt
        prompt = create_simple_prompt(
            request.message, request.pet_context, request.conversation_history or []
        )

        # Generate response using Gemini
        response = current_model.generate_content(prompt)

        # Parse the response
        message = (
            response.text.strip()
            if response.text
            else "I apologize, but I couldn't generate a response."
>>>>>>> origin/merged-zoroflamingo:backend/app/routers/ai_simple.py
        )

        # Generate simple suggested actions
        suggested_actions = generate_simple_actions(
            request.message, request.pet_context
        )

        return AIChatResponse(message=message, suggested_actions=suggested_actions)

    except Exception as e:
        print(f"AI Chat Error: {str(e)}")
<<<<<<< HEAD:backend/routers/ai_simple.py
        
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
=======
        # Fallback to simple logic
        return handle_simple_fallback(
            request.message, request.pet_context, request.conversation_history or []
        )


def create_simple_prompt(
    user_message: str,
    pet_context: Dict[str, Any],
    conversation_history: List[Dict[str, str]] = [],
) -> str:
    """
    Create a simple, effective prompt - inspired by successful PawfectPlanner versions
    """
    pets = pet_context.get("pets", [])

    # Format pet information simply
    pet_info = []
    for pet in pets:
        health_issues = pet.get("health_issues", [])
        behavior_issues = pet.get("behavior_issues", [])
        health_text = f", Health: {', '.join(health_issues)}" if health_issues else ""
        behavior_text = (
            f", Behavior: {', '.join(behavior_issues)}" if behavior_issues else ""
        )

        pet_info.append(
            f"{pet['name']}: {pet['type']} ({pet['breed']}), {pet['age']:.1f} years old, {pet['weight']}kg, {pet['gender']}{health_text}{behavior_text}"
        )

    pet_list = "\n".join(pet_info)

    # Simple conversation history
    conversation_context = ""
    if conversation_history:
        conversation_context = "\n\nRecent conversation:\n"
        for msg in conversation_history[-6:]:  # Keep last 6 messages
            role = "User" if msg.get("isUser") == "true" else "Assistant"
            conversation_context += f"{role}: {msg.get('content', '')}\n"

    # Simple, effective prompt
    prompt = f"""You are a helpful pet care assistant. Here is the user's pet information:

PETS:
{pet_list}{conversation_context}

USER QUESTION: {user_message}

Instructions:
- Answer the user's question about their pets
- If they ask to sort pets by age, list all pets in the requested order
- If they mention specific pets, focus on those pets
- If they use pronouns like "her" or "him", refer to the most recently mentioned pet
- Provide specific, helpful advice based on the pet information
- Be conversational and practical
- If medical advice is needed, recommend consulting a veterinarian

Please provide a helpful response."""

    return prompt


def handle_simple_fallback(
    message: str,
    pet_context: Dict[str, Any],
    conversation_history: List[Dict[str, str]] = [],
) -> AIChatResponse:
    """
    Simple fallback AI logic when Gemini API is not available
    """
    pets = pet_context.get("pets", [])
    message_lower = message.lower()

    # Handle sorting requests - this should be the first check
    if "sort" in message_lower and "pet" in message_lower:
        # Sort pets by age
        sorted_pets = sorted(pets, key=lambda x: x.get("age", 0))

        # Create response for each pet
        pet_responses = []
        for i, pet in enumerate(sorted_pets, 1):
            pet_name = pet["name"]
            pet_age = pet.get("age", 0)
            pet_breed = pet.get("breed", "unknown breed")
            pet_type = pet.get("type", "pet")
            health_issues = pet.get("health_issues", [])
            behavior_issues = pet.get("behavior_issues", [])

            # Age description
            if pet_age < 1:
                age_desc = f"{pet_age:.1f} years old (puppy/kitten)"
            elif pet_age > 7:
                age_desc = f"{pet_age:.1f} years old (senior)"
            else:
                age_desc = f"{pet_age:.1f} years old (adult)"

            # Health and behavior issues
            health_text = (
                f"\n   Health Issues: {', '.join(health_issues)}"
                if health_issues
                else ""
            )
            behavior_text = (
                f"\n   Behavior Issues: {', '.join(behavior_issues)}"
                if behavior_issues
                else ""
            )

            # Simple solutions
            solutions_text = ""
            if behavior_issues:
                solutions = []
                for issue in behavior_issues:
                    if "peeing indoors" in issue.lower():
                        solutions.append(
                            "• House training: Regular schedule, positive reinforcement"
                        )
                    elif "anxiety" in issue.lower():
                        solutions.append(
                            "• Anxiety management: Safe spaces, calming aids"
                        )
                    elif "mistrusts strangers" in issue.lower():
                        solutions.append(
                            "• Socialization: Gradual exposure, positive reinforcement"
                        )

                if solutions:
                    solutions_text = f"\n   Solutions:\n" + "\n".join(solutions)

            pet_responses.append(
                f"{i}. **{pet_name}** - {pet_type} ({pet_breed}), {age_desc}{health_text}{behavior_text}{solutions_text}"
            )

        return AIChatResponse(
            message=f"Here are your pets sorted from youngest to oldest:\n\n"
            + "\n\n".join(pet_responses)
            + "\n\nEach pet has been analyzed with their specific health and behavior issues, along with tailored solutions.",
            suggested_actions=[
                {
                    "id": "pet_care_plan",
                    "type": "create_task",
                    "label": "Create Care Plan",
                    "description": "Set up a comprehensive care plan for your pets",
                }
            ],
        )

    # Handle specific pet mentions
    mentioned_pet = None
    for pet in pets:
        if pet["name"].lower() in message_lower:
            mentioned_pet = pet
            break

    if mentioned_pet:
        pet_name = mentioned_pet["name"]
        pet_age = mentioned_pet.get("age", 0)
        health_issues = mentioned_pet.get("health_issues", [])
        behavior_issues = mentioned_pet.get("behavior_issues", [])

        message = f"I can help with {pet_name}'s care. "

        if health_issues:
            message += f"{pet_name} has health concerns: {', '.join(health_issues)}. "

        if behavior_issues:
            message += f"Behavior issues: {', '.join(behavior_issues)}. "

        message += (
            f"What specific aspect of {pet_name}'s care would you like help with?"
        )

        return AIChatResponse(
            message=message,
            suggested_actions=[
                {
                    "id": f"{pet_name.lower()}_care",
                    "type": "view_tips",
                    "label": f"{pet_name}'s Care",
                    "description": f"Get care advice for {pet_name}",
                }
            ],
        )

    # Default response
    pet_names = [pet["name"] for pet in pets]
    return AIChatResponse(
        message=f"I'd be happy to help with your pet care questions! You have {len(pets)} pets: {', '.join(pet_names)}. What would you like to know about?",
        suggested_actions=[
            {
                "id": "health_help",
                "type": "view_tips",
                "label": "Health Help",
                "description": "Get health advice for your pets",
            },
            {
                "id": "behavior_help",
                "type": "view_tips",
                "label": "Behavior Help",
                "description": "Get behavior advice for your pets",
            },
        ],
    )


def generate_simple_actions(
    user_message: str, pet_context: Dict[str, Any]
) -> List[Dict[str, str]]:
    """
    Generate simple suggested actions
    """
    actions = []

    # Basic actions
    actions.append(
        {
            "id": "health_help",
            "type": "view_tips",
            "label": "Health Help",
            "description": "Get health advice for your pets",
        }
    )

    actions.append(
        {
            "id": "behavior_help",
            "type": "view_tips",
            "label": "Behavior Help",
            "description": "Get behavior advice for your pets",
        }
    )

    return actions
>>>>>>> origin/merged-zoroflamingo:backend/app/routers/ai_simple.py


@router.get("/firebase-config", response_model=FirebaseConfigResponse)
async def get_firebase_config(current_user: UserORM = Depends(get_current_user)):
    """Get Firebase Remote Config"""
    try:
        configs = firebase_user_service.get_available_configs(current_user)
<<<<<<< HEAD:backend/routers/ai_simple.py
=======

>>>>>>> origin/merged-zoroflamingo:backend/app/routers/ai_simple.py
        return FirebaseConfigResponse(
            configs=configs,
            user=current_user.username,
            firebase_available=len(configs) > 0,
        )
<<<<<<< HEAD:backend/routers/ai_simple.py
    except Exception as e:
        print(f"Error getting Firebase config for user {current_user.username}: {str(e)}")
        return FirebaseConfigResponse(
            configs={},
            user=current_user.username,
            firebase_available=False
        )
=======

    except Exception as e:
        print(
            f"❌ Error getting Firebase config for user {current_user.username}: {str(e)}"
        )
        return FirebaseConfigResponse(
            configs={}, user=current_user.username, firebase_available=False
        )
>>>>>>> origin/merged-zoroflamingo:backend/app/routers/ai_simple.py
