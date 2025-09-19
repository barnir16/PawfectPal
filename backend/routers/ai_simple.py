"""
Simplified AI Chat Route - Inspired by successful PawfectPlanner versions
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import google.generativeai as genai  # type: ignore
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from services.firebase_config import firebase_config

router = APIRouter(prefix="/ai", tags=["AI"])


# Configure Gemini API using Firebase Remote Config
def get_gemini_model():
    """Get Gemini model instance using Firebase Remote Config"""
    try:
        if not firebase_config.initialized:
            firebase_config.initialize()

        api_key = firebase_config.get_gemini_api_key()

        if api_key:
            genai.configure(api_key=api_key)  # type: ignore
            return genai.get_model("gemini-pro")  # type: ignore
        else:
            return None
    except Exception:
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
    Simple AI chat endpoint - inspired by successful PawfectPlanner versions
    """
    try:
        # Try to get model, refresh if needed
        current_model = model
        if not current_model:
            current_model = get_gemini_model()

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
        )

        # Generate simple suggested actions
        suggested_actions = generate_simple_actions(
            request.message, request.pet_context
        )

        return AIChatResponse(message=message, suggested_actions=suggested_actions)

    except Exception as e:
        print(f"AI Chat Error: {str(e)}")
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
