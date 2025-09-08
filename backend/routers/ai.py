"""
AI Chat Route - Simplified approach inspired by PawfectPlanner Python version
Direct integration with Gemini API without complex state management
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
from services.firebase_config import firebase_config

router = APIRouter(prefix="/ai", tags=["AI"])

# Configure Gemini API using Firebase Remote Config
def get_gemini_model():
    """Get Gemini model instance using Firebase Remote Config"""
    try:
        # Initialize Firebase config if not already done
        if not firebase_config.initialized:
            firebase_config.initialize()
        
        # Get API key from Firebase Remote Config
        api_key = firebase_config.get_gemini_api_key()
        
        if api_key:
            genai.configure(api_key=api_key)
            return genai.GenerativeModel('gemini-pro')
        else:
            print("⚠️ Gemini API key not found in Firebase Remote Config")
            return None
    except Exception as e:
        print(f"❌ Error getting Gemini API key from Firebase: {str(e)}")
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

@router.post("/chat", response_model=AIChatResponse)
async def chat_with_ai(request: AIChatRequest):
    """
    Simple AI chat endpoint - inspired by PawfectPlanner Python version
    Direct integration with Gemini API
    """
    try:
        print(f"🤖 AI Chat: Received message: '{request.message}'")
        print(f"🤖 AI Chat: Pet context: {len(request.pet_context.get('pets', []))} pets")
        
        # Try to get model, refresh if needed
        current_model = model
        if not current_model:
            print("🔄 AI Chat: Model not initialized, attempting to get Gemini model...")
            current_model = get_gemini_model()
        
        if not current_model:
            print("⚠️ AI Chat: Using fallback AI logic (Gemini not available)")
            # Fallback response if Gemini is not available - use local AI logic
            return handle_local_ai_fallback(request.message, request.pet_context)
        
        print("✅ AI Chat: Using Gemini API for response generation")
        
        # Use the provided prompt or create a simple one
        prompt = request.prompt or create_simple_prompt(request.message, request.pet_context, request.conversation_history or [])
        
        # Generate response using Gemini
        response = current_model.generate_content(prompt)
        
        # Parse the response
        message = response.text.strip() if response.text else "I apologize, but I couldn't generate a response."
        
        # Generate suggested actions based on the message content
        suggested_actions = generate_suggested_actions(request.message, request.pet_context)
        
        return AIChatResponse(
            message=message,
            suggested_actions=suggested_actions
        )
        
    except Exception as e:
        print(f"AI Chat Error: {str(e)}")
        raise HTTPException(status_code=500, detail="AI service error")

def create_simple_prompt(user_message: str, pet_context: Dict[str, Any], conversation_history: List[Dict[str, str]] = []) -> str:
    """
    Create a simple prompt with pet data injected - similar to Python version
    """
    pets = pet_context.get('pets', [])
    selected_pet = pet_context.get('selected_pet')
    
    # Format pet information
    pet_info = []
    for pet in pets:
        pet_info.append(f"- {pet['name']}: {pet['type']} ({pet['breed']}), {pet['age']:.1f} years old, {pet['weight']}kg, {pet['gender']}")
    
    pet_list = "\n".join(pet_info)
    
    # Fixed f-string formatting - separate the logic to avoid backslash issues
    current_focus = ""
    if selected_pet:
        current_focus = f"\nCURRENT FOCUS: {selected_pet['name']} ({selected_pet['type']})\n"
    
    # Format conversation history
    conversation_context = ""
    if conversation_history:
        conversation_context = "\n\nCONVERSATION HISTORY:\n"
        for msg in conversation_history[-6:]:  # Keep last 6 messages for context
            role = "User" if msg.get('isUser') else "Assistant"
            conversation_context += f"{role}: {msg.get('content', '')}\n"
    
    prompt = f"""You are a helpful pet care assistant. Here is the user's pet information:

PETS:
{pet_list}{current_focus}{conversation_context}
USER QUESTION: {user_message}

Please provide helpful, specific advice based on the pet information provided. Be conversational and practical. Keep responses concise but informative. If the user is asking for more details about a previous topic, provide additional information while maintaining context."""

    return prompt

def generate_suggested_actions(user_message: str, pet_context: Dict[str, Any]) -> List[Dict[str, str]]:
    """
    Generate suggested actions based on the user's message
    """
    message_lower = user_message.lower()
    actions = []
    
    if 'exercise' in message_lower:
        actions.append({
            "id": "exercise_tracking",
            "type": "create_task",
            "label": "Create Exercise Reminders",
            "description": "Set up daily exercise reminders for your pets"
        })
    
    if 'health' in message_lower or 'vet' in message_lower:
        actions.append({
            "id": "health_check",
            "type": "view_tips",
            "label": "Health Assessment",
            "description": "Review your pet's health status"
        })
    
    if 'feeding' in message_lower or 'food' in message_lower:
        actions.append({
            "id": "feeding_guide",
            "type": "view_tips",
            "label": "Feeding Guide",
            "description": "Learn feeding schedules for your pets"
        })
    
    # Default actions
    if not actions:
        actions.extend([
            {
                "id": "care_tips",
                "type": "view_tips",
                "label": "Care Guidelines",
                "description": "Get general care recommendations"
            },
            {
                "id": "vet_appointment",
                "type": "create_task",
                "label": "Schedule Vet Visit",
                "description": "Book a vet appointment"
            }
        ])
    
    return actions

def handle_local_ai_fallback(user_message: str, pet_context: Dict[str, Any]) -> AIChatResponse:
    """
    Fallback AI logic when Gemini API is not available
    """
    message_lower = user_message.lower()
    pets = pet_context.get('pets', [])
    
    print(f"🤖 Fallback AI: Processing message: '{user_message}'")
    
    # Handle non-pet related questions
    if any(keyword in message_lower for keyword in ['stock', 'invest', 'money', 'finance', 'crypto', 'bitcoin']):
        return AIChatResponse(
            message="I'm a pet care assistant, so I can't help with financial or investment questions. I'm here to help with your pets' health, behavior, feeding, exercise, and care needs. What would you like to know about your pets?",
            suggested_actions=[
                {
                    "id": "pet_health_help",
                    "type": "view_tips",
                    "label": "Pet Health Help",
                    "description": "Get help with your pet's health concerns"
                },
                {
                    "id": "pet_behavior_help",
                    "type": "view_tips",
                    "label": "Pet Behavior Help",
                    "description": "Get help with your pet's behavior issues"
                }
            ]
        )
    
    # Handle age comparison questions
    if 'oldest' in message_lower or 'youngest' in message_lower:
        is_oldest = 'oldest' in message_lower
        pets_with_ages = []
        
        for pet in pets:
            age = pet.get('age', 0)
            pets_with_ages.append({**pet, 'calculated_age': age})
        
        if pets_with_ages:
            sorted_pets = sorted(pets_with_ages, key=lambda x: x['calculated_age'], reverse=is_oldest)
            target_pet = sorted_pets[0]
            age_text = f"{target_pet['calculated_age']:.1f} years" if target_pet['calculated_age'] >= 1 else f"{target_pet['calculated_age'] * 12:.0f} months"
            
            return AIChatResponse(
                message=f"{target_pet['name']} is your {'oldest' if is_oldest else 'youngest'} pet at {age_text} old.",
                suggested_actions=[
                    {
                        "id": f"tell_about_{target_pet['name'].lower()}",
                        "type": "view_tips",
                        "label": f"Tell me about {target_pet['name']}",
                        "description": f"Get specific advice for {target_pet['name']}"
                    }
                ]
            )
    
    # Handle specific pet behavior questions
    if any(keyword in message_lower for keyword in ['peeing', 'urinating', 'potty', 'toilet', 'house training', 'accident']):
        return AIChatResponse(
            message="House training issues are common! Here are some tips to help with indoor accidents:\n\n1. **Consistent Schedule**: Take your pet out every 2-3 hours and after meals\n2. **Positive Reinforcement**: Reward immediately when they go outside\n3. **Clean Accidents Thoroughly**: Use enzyme cleaners to remove odors\n4. **Watch for Signs**: Look for sniffing, circling, or restlessness\n5. **Patience**: It can take weeks or months for full house training\n\nWhich of your pets is having this issue? I can provide more specific advice based on their age and breed.",
            suggested_actions=[
                {
                    "id": "house_training_guide",
                    "type": "view_tips",
                    "label": "House Training Guide",
                    "description": "Get detailed house training instructions"
                },
                {
                    "id": "behavior_consultation",
                    "type": "create_task",
                    "label": "Schedule Behavior Consultation",
                    "description": "Book a professional behavior consultation"
                }
            ]
        )
    
    # Handle specific pet medical issues
    if any(keyword in message_lower for keyword in ['bob', 'medical', 'blind', 'eye', 'assist', 'help']):
        # Look for Bob specifically
        bob_pet = next((pet for pet in pets if pet.get('name', '').lower() == 'bob'), None)
        if bob_pet:
            health_issues = bob_pet.get('health_issues', [])
            age = bob_pet.get('age', 0)
            breed = bob_pet.get('breed', 'unknown')
            
            response_message = f"I can see that Bob is a {age:.1f}-year-old {breed} with some health concerns. "
            
            if 'blind' in str(health_issues).lower() or 'blind' in message_lower:
                response_message += "For Bob's vision issues:\n\n1. **Environmental Safety**: Keep furniture in consistent places, use baby gates for stairs\n2. **Training**: Use verbal cues and scents to help him navigate\n3. **Vet Consultation**: Regular eye exams to monitor any progression\n4. **Quality of Life**: Many dogs adapt well to vision loss with proper support\n\n"
            
            response_message += "Since Bob is a senior dog, I'd recommend:\n- Regular vet check-ups every 6 months\n- Monitoring for any new symptoms\n- Adjusting his environment for his needs\n- Considering joint supplements for mobility\n\nWould you like specific advice about any particular aspect of Bob's care?"
            
            return AIChatResponse(
                message=response_message,
                suggested_actions=[
                    {
                        "id": "bob_health_plan",
                        "type": "create_task",
                        "label": "Create Health Plan for Bob",
                        "description": "Set up a care plan for Bob's specific needs"
                    },
                    {
                        "id": "schedule_vet_visit",
                        "type": "create_task",
                        "label": "Schedule Vet Visit for Bob",
                        "description": "Book a veterinary appointment for Bob"
                    }
                ]
            )
    
    # Handle health questions
    if any(keyword in message_lower for keyword in ['sick', 'ill', 'vet', 'health', 'medicine', 'medication', 'symptoms']):
        return AIChatResponse(
            message="I understand you're concerned about your pet's health. While I can provide general guidance, it's important to consult with a veterinarian for medical advice. Here are some general health tips:\n\n1. **Monitor Symptoms**: Note any changes in behavior, appetite, or energy\n2. **Keep Records**: Track symptoms and when they started\n3. **Emergency Signs**: Seek immediate vet care for severe symptoms\n4. **Preventive Care**: Regular check-ups and vaccinations are important\n\nWhat specific health concerns do you have about your pets?",
            suggested_actions=[
                {
                    "id": "schedule_vet_visit",
                    "type": "create_task",
                    "label": "Schedule Vet Visit",
                    "description": "Book a veterinary appointment"
                },
                {
                    "id": "health_tracking",
                    "type": "view_tips",
                    "label": "Health Tracking",
                    "description": "Learn how to monitor your pet's health"
                }
            ]
        )
    
    # Handle exercise questions
    if 'exercise' in message_lower:
        exercise_guidelines = []
        for pet in pets:
            age = pet.get('age', 0)
            pet_type = pet.get('type', 'pet')
            breed = pet.get('breed', 'unknown breed')
            
            if pet_type == 'dog':
                if age < 1:
                    exercise_guidelines.append(f"{pet['name']} ({breed}, puppy): Short walks 5-10 minutes, 3-4 times daily + playtime")
                elif age > 7:
                    exercise_guidelines.append(f"{pet['name']} ({breed}, senior): Gentle walks 15-20 minutes, 2-3 times daily")
                else:
                    exercise_guidelines.append(f"{pet['name']} ({breed}, adult): 30-60 minutes daily - walks, playtime, and mental stimulation")
            elif pet_type == 'cat':
                if age < 1:
                    exercise_guidelines.append(f"{pet['name']} ({breed}, kitten): Interactive play 15-20 minutes, 3-4 times daily")
                elif age > 7:
                    exercise_guidelines.append(f"{pet['name']} ({breed}, senior): Gentle play 10-15 minutes, 2-3 times daily")
                else:
                    exercise_guidelines.append(f"{pet['name']} ({breed}, adult): 20-30 minutes daily - interactive toys, climbing, and play")
        
        if exercise_guidelines:
            return AIChatResponse(
                message=f"Here are exercise guidelines for each of your pets:\n\n" + "\n\n".join(exercise_guidelines) + "\n\nRemember: Always adjust based on your pet's individual energy level and health status!",
                suggested_actions=[
                    {
                        "id": "exercise_tracking",
                        "type": "create_task",
                        "label": "Create Exercise Reminders",
                        "description": "Set up daily exercise reminders for your pets"
                    }
                ]
            )
    
    # Default response - more context-aware
    pet_names = [pet['name'] for pet in pets]
    
    # Check for pets with health issues
    pets_with_health_issues = [pet for pet in pets if pet.get('health_issues')]
    pets_with_behavior_issues = [pet for pet in pets if pet.get('behavior_issues')]
    
    if pets_with_health_issues:
        health_pet_names = [pet['name'] for pet in pets_with_health_issues]
        message = f"I can see you have some pets with health concerns: {', '.join(health_pet_names)}. I'd be happy to help with specific advice for their care. What would you like to know about?"
    elif pets_with_behavior_issues:
        behavior_pet_names = [pet['name'] for pet in pets_with_behavior_issues]
        message = f"I notice some of your pets have behavior issues: {', '.join(behavior_pet_names)}. I can help with training and behavior management strategies. What specific behavior would you like to address?"
    else:
        message = f"I'd be happy to help with your pet care questions! You have {len(pets)} pets: {', '.join(pet_names)}. What specific aspect of their care would you like to know about?"
    
    return AIChatResponse(
        message=message,
        suggested_actions=[
            {
                "id": "health_assessment",
                "type": "view_tips",
                "label": "Health Assessment",
                "description": "Review your pet's health status"
            },
            {
                "id": "behavior_help",
                "type": "view_tips",
                "label": "Behavior Help",
                "description": "Get help with pet behavior issues"
            },
            {
                "id": "exercise_guide",
                "type": "view_tips",
                "label": "Exercise Guidelines",
                "description": "Get exercise recommendations for all pets"
            }
        ]
    )