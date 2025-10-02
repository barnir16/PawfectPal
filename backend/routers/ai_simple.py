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
from services.firebase_admin import firebase_admin
from services.firebase_user_service import firebase_user_service
from dependencies.auth import get_current_user
from models.user import UserORM

router = APIRouter(prefix="/ai", tags=["AI"])

# Configure Gemini API using Firebase Remote Config
def get_gemini_model():
    """Get Gemini model instance using Firebase Remote Config"""
    try:
        api_key = firebase_admin.get_gemini_api_key()
        
        if api_key:
            genai.configure(api_key=api_key)
            return genai.GenerativeModel('gemini-pro')
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
    Simple AI chat endpoint - inspired by successful PawfectPlanner versions
    """
    try:
        # Get Gemini API key for this specific user (works for both Google and email users)
        api_key = firebase_user_service.get_gemini_api_key_for_user(current_user)
        
        if not api_key:
            raise HTTPException(
                status_code=503, 
                detail="AI service temporarily unavailable. Please try again later."
            )
        
        # Configure Gemini with user-specific API key
        genai.configure(api_key=api_key)
        current_model = genai.GenerativeModel('gemini-pro')
        
        if not current_model:
            return handle_simple_fallback(request.message, request.pet_context, request.conversation_history or [])
        
        
        # Create simple prompt
        prompt = create_simple_prompt(request.message, request.pet_context, request.conversation_history or [])
        
        # Generate response using Gemini
        response = current_model.generate_content(prompt)
        
        # Parse the response
        message = response.text.strip() if response.text else "I apologize, but I couldn't generate a response."
        
        # Generate simple suggested actions
        suggested_actions = generate_simple_actions(request.message, request.pet_context)
        
        return AIChatResponse(
            message=message,
            suggested_actions=suggested_actions
        )
        
    except Exception as e:
        print(f"AI Chat Error: {str(e)}")
        # Fallback to simple logic
        return handle_simple_fallback(request.message, request.pet_context, request.conversation_history or [])

def create_simple_prompt(user_message: str, pet_context: Dict[str, Any], conversation_history: List[Dict[str, str]] = []) -> str:
    """
    Create a simple, effective prompt - inspired by successful PawfectPlanner versions
    """
    pets = pet_context.get('pets', [])
    
    # Enhanced pet information with medical history and tasks
    pet_info = []
    for pet in pets:
        health_issues = pet.get('health_issues', [])
        behavior_issues = pet.get('behavior_issues', [])
        medical_history = pet.get('medical_history', [])
        recent_tasks = pet.get('recent_tasks', [])
        vaccination_status = pet.get('vaccination_status', [])
        
        health_text = f", Health Issues: {', '.join(health_issues)}" if health_issues else ""
        behavior_text = f", Behavior Issues: {', '.join(behavior_issues)}" if behavior_issues else ""
        medical_text = f", Medical History: {', '.join(medical_history)}" if medical_history else ""
        tasks_text = f", Recent Tasks: {', '.join(recent_tasks)}" if recent_tasks else ""
        vaccine_text = f", Vaccination Status: {', '.join(vaccination_status)}" if vaccination_status else ""
        
        pet_info.append(f"{pet['name']}: {pet['type']} ({pet['breed']}), {pet['age']:.1f} years old, {pet['weight']}kg, {pet['gender']}{health_text}{behavior_text}{medical_text}{tasks_text}{vaccine_text}")
    
    pet_list = "\n".join(pet_info)
    
    # Enhanced conversation history (no limit)
    conversation_context = ""
    if conversation_history:
        conversation_context = "\n\nConversation history:\n"
        for msg in conversation_history:  # Keep all messages for better context
            role = "User" if msg.get('isUser') == "true" else "Assistant"
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
    
    # Health questions
    if any(word in message_lower for word in ['sick', 'ill', 'health', 'vet', 'doctor', 'medicine']):
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
