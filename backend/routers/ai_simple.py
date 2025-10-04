"""
Simplified AI Chat Route - Inspired by successful PawfectPlanner versions
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import google.generativeai as genai
from datetime import datetime
import json
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import Firebase services with error handling
try:
    from services.firebase_admin import firebase_admin
    from services.firebase_user_service import firebase_user_service
    FIREBASE_AVAILABLE = True
    print("✅ Firebase services imported successfully")
except Exception as e:
    print(f"⚠️ Firebase services not available: {e}")
    FIREBASE_AVAILABLE = False
    # Create dummy classes for fallback
    class DummyFirebaseService:
        def get_gemini_api_key_for_user(self, user): return None
        def get_available_configs(self, user): return {}
    firebase_admin = type('DummyAdmin', (), {'get_gemini_api_key': lambda: None})()
    firebase_user_service = DummyFirebaseService()
from dependencies.auth import get_current_user
from models.user import UserORM

router = APIRouter(prefix="/ai", tags=["AI"])

# Configure Gemini API using Firebase Remote Config with fallback
def get_gemini_model():
    """Get Gemini model instance using Firebase Remote Config"""
    try:
        # Try Firebase first (only if available)
        if FIREBASE_AVAILABLE:
            api_key = firebase_admin.get_gemini_api_key()
            if api_key:
                genai.configure(api_key=api_key)
                return genai.GenerativeModel('gemini-pro')
        
        # Fallback to environment variable
        api_key = os.getenv('GEMINI_API_KEY')
        if api_key:
            genai.configure(api_key=api_key)
            return genai.GenerativeModel('gemini-pro')
        
        print("⚠️ Gemini API key not found in Firebase or environment")
        return None
        
    except Exception as e:
        print(f"❌ Error configuring Gemini: {e}")
        return None

# Initialize model (non-blocking)
try:
    model = get_gemini_model()
    if model:
        print("✅ Gemini model configured successfully")
    else:
        print("⚠️ No Gemini API key available, using fallback AI logic")
except Exception as e:
    model = None
    print(f"⚠️ Gemini model initialization failed: {e}")

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

class AIChatRequest(BaseModel):
    message: str
    pet_context: Dict[str, Any]
    prompt: Optional[str] = None
    conversation_history: Optional[List[Dict[str, str]]] = []

class AIChatResponse(BaseModel):
    message: str
    suggested_actions: List[Dict[str, str]] = []

class FirebaseConfigResponse(BaseModel):
    configs: Dict[str, str]
    user: str
    firebase_available: bool

@router.post("/test", response_model=AIChatResponse)
async def test_ai_chat(request: AIChatRequest):
    """
    Test AI chat endpoint without authentication for development
    """
    try:
        # Use fallback logic for testing
        return handle_simple_fallback(request.message, request.pet_context, request.conversation_history or [])
    except Exception as e:
        print(f"AI Test Error: {str(e)}")
        return AIChatResponse(
            message="Test endpoint is working but AI service is not available.",
            suggested_actions=[]
        )

@router.post("/chat", response_model=AIChatResponse)
async def chat_with_ai(request: AIChatRequest, current_user: UserORM = Depends(get_current_user)):
    """
    Enhanced AI chat endpoint - inspired by successful PawfectPlanner versions
    Production-ready with comprehensive context understanding
    """
    try:
        # Validate request data
        if not request.message or not request.message.strip():
            return AIChatResponse(
                message="Please provide a message so I can help you with your pet care needs.",
                suggested_actions=[
                    {"id": "general_tips", "type": "view_tips", "label": "💡 Pet Care Tips", "description": "Get general pet care advice"}
                ]
            )
        
        # Get Gemini API key for this specific user (works for both Google and email users)
        api_key = None
        if FIREBASE_AVAILABLE:
            api_key = firebase_user_service.get_gemini_api_key_for_user(current_user)
        
        if not api_key:
            # Try environment variable fallback
            api_key = os.getenv('GEMINI_API_KEY')
        
        if not api_key:
            print("⚠️ No Gemini API key available, using fallback")
            return handle_simple_fallback(request.message, request.pet_context or {}, request.conversation_history or [])
        
        try:
            # Configure Gemini with user-specific API key
            genai.configure(api_key=api_key)
            current_model = genai.GenerativeModel('gemini-pro')
            
            if not current_model:
                print("⚠️ Gemini model unavailable, using fallback")
                return handle_simple_fallback(request.message, request.pet_context or {}, request.conversation_history or [])
            
            # Create comprehensive prompt with full context
            prompt = create_comprehensive_prompt(request.message, request.pet_context or {}, request.conversation_history or [])
            
            # Generate response using Gemini with timeout protection
            import asyncio
            response = await asyncio.wait_for(
                current_model.generate_content_async(prompt),
                timeout=30.0  # 30 second timeout
            )
            
            # Parse the response safely
            message = response.text.strip() if response.text else "I apologize, but I couldn't generate a response."
            message = message[:2000] if len(message) > 2000 else message  # Limit response length
            
            # Generate contextual suggested actions based on conversation and pet data
            suggested_actions = generate_contextual_actions(request.message, request.pet_context or {}, conversation_history=request.conversation_history or [])
            
            return AIChatResponse(
                message=message,
                suggested_actions=suggested_actions
            )
            
        except asyncio.TimeoutError:
            print("⚠️ Gemini API timeout, using fallback")
            return handle_simple_fallback(request.message, request.pet_context or {}, request.conversation_history or [])
        
    except Exception as e:
        print(f"AI Chat Error: {str(e)}")
        try:
            # Fallback to simple logic with safe data
            return handle_simple_fallback(request.message, request.pet_context or {}, request.conversation_history or [])
        except Exception as fallback_error:
            print(f"Fallback also failed: {fallback_error}")
            return AIChatResponse(
                message="I'm experiencing technical difficulties. Please try again in a moment.",
                suggested_actions=[
                    {"id": "retry", "type": "retry", "label": "🔄 Try Again", "description": "Retry your request"},
                    {"id": "contact_support", "type": "contact", "label": "💬 Contact Support", "description": "Get help from support team"}
                ]
            )

def create_comprehensive_prompt(user_message: str, pet_context: Dict[str, Any], conversation_history: List[Dict[str, str]] = []) -> str:
    """
    Create a comprehensive prompt inspired by PawfectPlanner - with full context understanding
    Production-ready with error handling and validation
    """
    try:
        pets = pet_context.get('pets', []) or []
        
        # Comprehensive pet information - mimic PawfectPlanner's data injection
        pet_profiles = []
        for pet in pets:
            try:
                # Safe pet data extraction with defaults
                pet_name = pet.get('name', 'unnamed pet')
                pet_type = pet.get('type', 'pet').capitalize()
                pet_breed = pet.get('breed', 'Unknown')
                pet_age = float(pet.get('age', 0))
                pet_weight = pet.get('weight', 0)
                pet_gender = pet.get('gender', 'unknown')
                
                # Health and behavior data
                health_issues = pet.get('health_issues', []) or []
                behavior_issues = pet.get('behavior_issues', []) or []
                medical_history = pet.get('medical_history', []) or []
                recent_tasks = pet.get('recent_tasks', []) or []
                vaccination_status = pet.get('vaccination_status', []) or []
                
                # Create detailed pet profile with safe formatting
                profile_lines = [
                    f"🐾 **{pet_name}** ({pet_type})",
                    f"   • Breed: {pet_breed}",
                    f"   • Age: {pet_age:.1f} years old",
                    f"   • Weight: {pet_weight}kg",
                    f"   • Gender: {pet_gender}"
                ]
                
                # Add health information safely
                if health_issues:
                    profile_lines.append(f"   • Health Issues: {', '.join(str(issue) for issue in health_issues)}")
                if behavior_issues:
                    profile_lines.append(f"   • Behavior Issues: {', '.join(str(issue) for issue in behavior_issues)}")
                if medical_history:
                    profile_lines.append(f"   • Medical History: {', '.join(str(mh) for mh in medical_history)}")
                if vaccination_status:
                    profile_lines.append(f"   • Vaccination Status: {', '.join(str(vs) for vs in vaccination_status)}")
                if recent_tasks:
                    profile_lines.append(f"   • Recent Tasks: {', '.join(str(task) for task in recent_tasks)}")
                
                pet_profiles.append('\n'.join(profile_lines))
                
            except Exception as pet_error:
                print(f"Error processing pet data: {pet_error}")
                # Add minimal pet info even if there's an error
                pet_name = pet.get('name', 'Unknown Pet') if isinstance(pet, dict) else 'Unknown Pet'
                pet_profiles.append(f"🐾 **{pet_name}** (Pet information unavailable)")
        
        pets_section = '\n\n'.join(pet_profiles) if pet_profiles else "No pet information available."
        
        # Enhanced conversation history with safe parsing
        conversation_context = ""
        if conversation_history and isinstance(conversation_history, list):
            try:
                conversation_context = f"""

📝 **CONVERSATION HISTORY:**
"""
                # Safely process last 10 messages for context
                safe_history = conversation_history[-10:] if len(conversation_history) > 10 else conversation_history
                
                for msg in safe_history:
                    try:
                        if isinstance(msg, dict):
                            role = "👤 USER" if msg.get('isUser') == "true" else "🤖 ASSISTANT"
                            content = msg.get('content', str(msg.get('message', ''))) or 'No content'
                            conversation_context += f"{role}: {content}\n"
                        else:
                            conversation_context += f"🤖 ASSISTANT: {str(msg)}\n"
                    except Exception as msg_error:
                        print(f"Error processing message: {msg_error}")
                        conversation_context += f"🤖 ASSISTANT: [Message unavailable]\n"
                        
            except Exception as conv_error:
                print(f"Error processing conversation history: {conv_error}")
                conversation_context = ""
        
        # Create comprehensive prompt with safe string formatting
        safe_message = str(user_message)[:1000] if user_message else "No message provided"  # Limit message length
        
        prompt = f"""🤖 **PAWFECT PAL AI ASSISTANT**

I am your intelligent pet care assistant with access to detailed information about your pets. I provide personalized, context-aware advice based on your pet's specific needs, health conditions, and care history.

📋 **PET PROFILES:**
{pets_section}{conversation_context}

🎯 **CURRENT QUERY:** {safe_message}

📚 **MY CAPABILITIES:**
I can help with: Health monitoring, Behavior analysis, Diet planning, Exercise routines, Grooming advice, Medical scheduling, Vaccination reminders, Emergency care guidance, Comfort measures, Training tips.

💡 **RESPONSE GUIDELINES:**
1. **Context Awareness**: Always reference the specific pet mentioned and their unique characteristics
2. **Health Focus**: Prioritize safety and recommend veterinary consultation for medical concerns
3. **Practical Advice**: Provide actionable, specific recommendations based on the pet's breed, age, and conditions
4. **Comfort & Care**: Suggest comfort measures for pets with health issues or behavioral problems
5. **Task Integration**: Suggest creating reminders or tasks when appropriate
6. **Conversation Continuity**: Reference previous topics to maintain meaningful dialogue
7. **Safety First**: Always prioritize pet safety and recommend professional veterinary care when needed

🎪 **TEMPERAMENT:** Be friendly, empathetic, and knowledgeable. Use emojis sparingly for warmth. Focus on being helpful rather than just informative. Always encourage professional veterinary consultation for health concerns.

Please provide personalized advice for this specific situation."""

        return prompt
        
    except Exception as e:
        print(f"Error creating comprehensive prompt: {e}")
        # Return a minimal but safe prompt
        safe_message = str(user_message)[:500] if user_message else "Hello"
        return f"""🤖 **PAWFECT PAL AI ASSISTANT**

I'm here to help with your pet care needs.

🎯 **QUERY:** {safe_message}

Please ask me anything about pet care, health, nutrition, behavior, or general pet advice. I'll do my best to help while always recommending professional veterinary consultation for health concerns."""

def handle_simple_fallback(message: str, pet_context: Dict[str, Any], conversation_history: List[Dict[str, str]] = []) -> AIChatResponse:
    """
    Enhanced fallback AI logic when Gemini API is not available
    """
    pets = pet_context.get('pets', [])
    
    # Enhanced fallback responses based on message content
    message_lower = message.lower()
    
    # Greeting responses
    if any(word in message_lower for word in ['hello', 'hi', 'hey', 'good morning', 'good afternoon']):
        if pets:
            pet_names = [pet.get('name', 'your pet') for pet in pets]
            pet_list = ', '.join(pet_names) if len(pet_names) == 1 else ', '.join(pet_names[:-1]) + f' and {pet_names[-1]}'
            return AIChatResponse(
                message=f"Hello! I'm here to help you with {pet_list}. How can I assist you with their care today?",
                suggested_actions=[
                    {"id": "care_tips", "type": "view_tips", "label": "Care Tips", "description": "Get general care advice"},
                    {"id": "health_check", "type": "health_check", "label": "Health Check", "description": "Check pet health status"},
                    {"id": "schedule_task", "type": "create_task", "label": "Schedule Task", "description": "Create a reminder"}
                ]
            )
        else:
            return AIChatResponse(
                message="Hello! I'm your pet care assistant. I'd be happy to help you with any pet-related questions or tasks.",
                suggested_actions=[
                    {"id": "add_pet", "type": "add_pet", "label": "Add Pet", "description": "Add a new pet to your profile"},
                    {"id": "general_tips", "type": "view_tips", "label": "Pet Care Tips", "description": "Get general pet care advice"}
                ]
            )
    
    # Feeding questions
    if any(word in message_lower for word in ['feed', 'food', 'eating', 'diet', 'nutrition']):
        if pets:
            pet_name = pets[0].get('name', 'your pet')
            pet_type = pets[0].get('type', 'pet')
            return AIChatResponse(
                message=f"For {pet_name}'s feeding, I recommend consulting with your veterinarian for a personalized diet plan. Generally, {pet_type}s need balanced nutrition with appropriate portions based on their age, weight, and activity level.",
                suggested_actions=[
                    {"id": "feeding_schedule", "type": "create_task", "label": "Set Feeding Schedule", "description": "Create feeding reminders"},
                    {"id": "diet_consultation", "type": "vet_consultation", "label": "Diet Consultation", "description": "Schedule vet consultation"}
                ]
            )
    
    # Health questions (expanded keywords)
    if any(word in message_lower for word in ['sick', 'ill', 'health', 'vet', 'doctor', 'medicine', 'bad eye', 'incontinence', 'pee', 'urinate', 'comfortable', 'comfort']):
        if pets:
            pet_name = pets[0].get('name', 'your pet')
            health_issues = pets[0].get('health_issues', [])
            
            # Specific advice for common health issues
            specific_advice = ""
            if 'bad eye' in message_lower or 'bad eye' in str(health_issues).lower():
                specific_advice += f"For {pet_name}'s eye condition, keep the area clean and avoid irritants. "
            if 'incontinence' in message_lower or 'pee' in message_lower or 'incontinence' in str(health_issues).lower():
                specific_advice += f"For incontinence issues, consider more frequent bathroom breaks and waterproof bedding. "
            
            return AIChatResponse(
                message=f"If you're concerned about {pet_name}'s health, I recommend contacting your veterinarian immediately. {specific_advice}I can help you schedule appointments or create health monitoring tasks.",
                suggested_actions=[
                    {"id": "emergency_vet", "type": "emergency", "label": "Emergency Vet", "description": "Find emergency veterinary care"},
                    {"id": "schedule_checkup", "type": "create_task", "label": "Schedule Checkup", "description": "Create vet appointment reminder"},
                    {"id": "health_monitoring", "type": "health_tracking", "label": "Health Tracking", "description": "Track health symptoms"},
                    {"id": "comfort_care", "type": "comfort_care", "label": "Comfort Care", "description": "Set up comfort measures"}
                ]
            )
        else:
            return AIChatResponse(
                message="If you're concerned about your pet's health, I recommend contacting your veterinarian immediately. I can help you schedule appointments or create health monitoring tasks.",
                suggested_actions=[
                    {"id": "emergency_vet", "type": "emergency", "label": "Emergency Vet", "description": "Find emergency veterinary care"},
                    {"id": "schedule_checkup", "type": "create_task", "label": "Schedule Checkup", "description": "Create vet appointment reminder"},
                    {"id": "health_monitoring", "type": "health_tracking", "label": "Health Tracking", "description": "Track health symptoms"}
                ]
            )
    
    # Exercise/activity questions
    if any(word in message_lower for word in ['exercise', 'walk', 'play', 'activity', 'energy']):
        if pets:
            pet_name = pets[0].get('name', 'your pet')
            pet_type = pets[0].get('type', 'pet')
            return AIChatResponse(
                message=f"{pet_name} needs regular exercise appropriate for their age and breed. For {pet_type}s, daily walks and playtime are essential for physical and mental health.",
                suggested_actions=[
                    {"id": "walk_reminder", "type": "create_task", "label": "Walk Reminder", "description": "Set daily walk reminders"},
                    {"id": "playtime", "type": "create_task", "label": "Playtime", "description": "Schedule play sessions"}
                ]
            )
    
    # Default response
    if pets:
        pet_name = pets[0].get('name', 'your pet')
        return AIChatResponse(
            message=f"I understand you're asking about {pet_name}. While I'm currently using basic responses, I can help you with pet care tasks, reminders, and general advice. What specific aspect of {pet_name}'s care would you like help with?",
            suggested_actions=[
                {"id": "general_care", "type": "view_tips", "label": "General Care", "description": "Get care advice"},
                {"id": "create_task", "type": "create_task", "label": "Create Task", "description": "Set up a reminder"},
                {"id": "health_tracking", "type": "health_tracking", "label": "Health Tracking", "description": "Track health metrics"}
            ]
        )
    else:
        return AIChatResponse(
            message="I'm here to help with pet care! I can assist with feeding schedules, health monitoring, exercise routines, and general pet care advice. What would you like to know?",
            suggested_actions=[
                {"id": "add_pet", "type": "add_pet", "label": "Add Pet", "description": "Add a new pet"},
                {"id": "general_tips", "type": "view_tips", "label": "Pet Care Tips", "description": "Get general advice"},
                {"id": "emergency_info", "type": "emergency", "label": "Emergency Info", "description": "Emergency pet care"}
            ]
        )
        # Sort pets by age
        sorted_pets = sorted(pets, key=lambda x: x.get('age', 0))
        
        # Create response for each pet
        pet_responses = []
        for i, pet in enumerate(sorted_pets, 1):
            pet_name = pet['name']
            pet_age = pet.get('age', 0)
            pet_breed = pet.get('breed', 'unknown breed')
            pet_type = pet.get('type', 'pet')
            health_issues = pet.get('health_issues', [])
            behavior_issues = pet.get('behavior_issues', [])
            
            # Age description
            if pet_age < 1:
                age_desc = f"{pet_age:.1f} years old (puppy/kitten)"
            elif pet_age > 7:
                age_desc = f"{pet_age:.1f} years old (senior)"
            else:
                age_desc = f"{pet_age:.1f} years old (adult)"
            
            # Health and behavior issues
            health_text = f"\n   Health Issues: {', '.join(health_issues)}" if health_issues else ""
            behavior_text = f"\n   Behavior Issues: {', '.join(behavior_issues)}" if behavior_issues else ""
            
            # Simple solutions
            solutions_text = ""
            if behavior_issues:
                solutions = []
                for issue in behavior_issues:
                    if 'peeing indoors' in issue.lower():
                        solutions.append("• House training: Regular schedule, positive reinforcement")
                    elif 'anxiety' in issue.lower():
                        solutions.append("• Anxiety management: Safe spaces, calming aids")
                    elif 'mistrusts strangers' in issue.lower():
                        solutions.append("• Socialization: Gradual exposure, positive reinforcement")
                
                if solutions:
                    solutions_text = f"\n   Solutions:\n" + "\n".join(solutions)
            
            pet_responses.append(f"{i}. **{pet_name}** - {pet_type} ({pet_breed}), {age_desc}{health_text}{behavior_text}{solutions_text}")
        
        return AIChatResponse(
            message=f"Here are your pets sorted from youngest to oldest:\n\n" + "\n\n".join(pet_responses) + "\n\nEach pet has been analyzed with their specific health and behavior issues, along with tailored solutions.",
            suggested_actions=[
                {
                    "id": "pet_care_plan",
                    "type": "create_task",
                    "label": "Create Care Plan",
                    "description": "Set up a comprehensive care plan for your pets"
                }
            ]
        )
    
    # Handle specific pet mentions
    mentioned_pet = None
    for pet in pets:
        if pet['name'].lower() in message_lower:
            mentioned_pet = pet
            break
    
    if mentioned_pet:
        pet_name = mentioned_pet['name']
        pet_age = mentioned_pet.get('age', 0)
        health_issues = mentioned_pet.get('health_issues', [])
        behavior_issues = mentioned_pet.get('behavior_issues', [])
        
        message = f"I can help with {pet_name}'s care. "
        
        if health_issues:
            message += f"{pet_name} has health concerns: {', '.join(health_issues)}. "
        
        if behavior_issues:
            message += f"Behavior issues: {', '.join(behavior_issues)}. "
        
        message += f"What specific aspect of {pet_name}'s care would you like help with?"
        
        return AIChatResponse(
            message=message,
            suggested_actions=[
                {
                    "id": f"{pet_name.lower()}_care",
                    "type": "view_tips",
                    "label": f"{pet_name}'s Care",
                    "description": f"Get care advice for {pet_name}"
                }
            ]
        )
    
    # Default response
    pet_names = [pet['name'] for pet in pets]
    return AIChatResponse(
        message=f"I'd be happy to help with your pet care questions! You have {len(pets)} pets: {', '.join(pet_names)}. What would you like to know about?",
        suggested_actions=[
            {
                "id": "health_help",
                "type": "view_tips",
                "label": "Health Help",
                "description": "Get health advice for your pets"
            },
            {
                "id": "behavior_help",
                "type": "view_tips",
                "label": "Behavior Help",
                "description": "Get behavior advice for your pets"
            }
        ]
    )

def generate_contextual_actions(message: str, pet_context: Dict[str, Any], conversation_history: List[Dict[str, str]] = []) -> List[Dict[str, str]]:
    """
    Generate contextual suggested actions based on message content, pet data, and conversation history
    Production-ready with safe data handling
    """
    try:
        pets = pet_context.get('pets', []) or []
        message_lower = str(message).lower() if message else ""
        actions = []
        
        # Health-related actions
        if any(word in message_lower for word in ['sick', 'ill', 'health', 'vet', 'doctor', 'medicine', 'comfortable', 'comfort', 'pain', 'hurt', 'bad eye', 'pee', 'incontinence']):
            actions.extend([
            {"id": "emergency_vet", "type": "emergency", "label": "🚨 Emergency Vet", "description": "Find emergency veterinary care"},
            {"id": "health_tracking", "type": "health_tracking", "label": "📊 Health Tracking", "description": "Track health symptoms"},
            {"id": "comfort_care", "type": "comfort_care", "label": "💕 Comfort Care", "description": "Set up comfort measures"},
            {"id": "schedule_checkup", "type": "create_task", "label": "📅 Schedule Checkup", "description": "Create vet appointment reminder"}
        ])
        
        # Feeding/nutrition actions
        elif any(word in message_lower for word in ['feed', 'food', 'eating', 'diet', 'nutrition', 'hungry']):
            actions.extend([
                {"id": "feeding_schedule", "type": "create_task", "label": "🍽️ Feeding Schedule", "description": "Create feeding reminders"},
                {"id": "diet_consultation", "type": "vet_consultation", "label": "👨‍⚕️ Diet Consultation", "description": "Schedule vet consultation"},
                {"id": "nutrition_tips", "type": "view_tips", "label": "💡 Nutrition Tips", "description": "Get feeding recommendations"}
            ])
        
        # Exercise/activity actions
        elif any(word in message_lower for word in ['exercise', 'walk', 'play', 'activity', 'energy']):
            actions.extend([
                {"id": "walk_reminder", "type": "create_task", "label": "🚶 Walk Reminder", "description": "Set daily walk reminders"},
                {"id": "playtime", "type": "create_task", "label": "🎾 Playtime", "description": "Schedule play sessions"},
                {"id": "exercise_plan", "type": "view_tips", "label": "💪 Exercise Plan", "description": "Get exercise recommendations"}
            ])
        
        # Default actions if no specific category detected
        else:
            if pets:
                pet_name = pets[0].get('name', 'your pet')
                actions.extend([
                    {"id": "care_tips", "type": "view_tips", "label": f"🐾 {pet_name}'s Care", "description": "Get personalized care advice"},
                    {"id": "create_task", "type": "create_task", "label": "📝 Create Task", "description": "Set up a reminder or task"},
                    {"id": "health_monitoring", "type": "health_tracking", "label": "📊 Health Monitoring", "description": "Monitor health metrics"}
                ])
            else:
                actions.extend([
                    {"id": "add_pet", "type": "add_pet", "label": "🐾 Add Pet", "description": "Add a new pet to your profile"},
                    {"id": "general_tips", "type": "view_tips", "label": "💡 Pet Care Tips", "description": "Get general pet care advice"},
                    {"id": "emergency_info", "type": "emergency", "label": "🚨 Emergency Info", "description": "Emergency pet care"}
                ])
    
        return actions
        
    except Exception as e:
        print(f"Error generating contextual actions: {e}")
        # Return safe default actions
        return [
            {"id": "health_help", "type": "view_tips", "label": "💡 Health Tips", "description": "Get health advice"},
            {"id": "general_care", "type": "view_tips", "label": "🐾 General Care", "description": "Get pet care tips"},
            {"id": "emergency_info", "type": "emergency", "label": "🚨 Emergency Info", "description": "Emergency pet care"}
        ]

def generate_simple_actions(user_message: str, pet_context: Dict[str, Any]) -> List[Dict[str, str]]:
    """
    Generate simple suggested actions
    """
    actions = []
    
    # Basic actions
    actions.append({
        "id": "health_help",
        "type": "view_tips",
        "label": "Health Help",
        "description": "Get health advice for your pets"
    })
    
    actions.append({
        "id": "behavior_help",
        "type": "view_tips",
        "label": "Behavior Help",
        "description": "Get behavior advice for your pets"
    })
    
    return actions

@router.get("/firebase-config", response_model=FirebaseConfigResponse)
async def get_firebase_config(current_user: UserORM = Depends(get_current_user)):
    """
    Get Firebase Remote Config for any authenticated user (Google or email/password)
    """
    try:
        # Get Firebase configs for this user
        configs = firebase_user_service.get_available_configs(current_user)
        
        return FirebaseConfigResponse(
            configs=configs,
            user=current_user.username,
            firebase_available=len(configs) > 0
        )
        
    except Exception as e:
        print(f"❌ Error getting Firebase config for user {current_user.username}: {str(e)}")
        return FirebaseConfigResponse(
            configs={},
            user=current_user.username,
            firebase_available=False
        )
