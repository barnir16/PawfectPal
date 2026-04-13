"""
AI chat route — Gemini-backed, with offline fallbacks.

Model name: set Railway env GEMINI_MODEL (e.g. gemini-2.5-flash). If unset, a
sensible default is used. API key: GEMINI_API_KEY on Railway, or Remote Config
when that fetch works.
"""

from __future__ import annotations

import os
from typing import Any, Dict, List, Optional

import google.generativeai as genai  # type: ignore
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.dependencies.auth import get_current_user
from app.models.user import UserORM
from app.services.firebase_user_service import firebase_user_service

router = APIRouter(prefix="/ai", tags=["AI"])

# Default model if GEMINI_MODEL is not set (override in Railway when Google deprecates a SKU)
_DEFAULT_MODEL_NAME = "gemini-2.5-flash"


class AIChatRequest(BaseModel):
    message: str
    pet_context: Dict[str, Any]
    prompt_language: str = "en"
    conversation_history: Optional[List[Dict[str, str]]] = None


class AIChatResponse(BaseModel):
    message: str
    suggested_actions: List[Dict[str, str]] = []


class FirebaseConfigResponse(BaseModel):
    configs: Dict[str, str]
    user: str
    firebase_available: bool


def _extract_response_text(response: Any) -> str:
    """Normalize Gemini response; handle blocks / empty candidates."""
    try:
        text = getattr(response, "text", None)
        if text and str(text).strip():
            return str(text).strip()
    except Exception:
        pass
    try:
        cands = getattr(response, "candidates", None) or []
        if cands and getattr(cands[0], "content", None):
            parts = getattr(cands[0].content, "parts", None) or []
            chunks = [getattr(p, "text", "") for p in parts if getattr(p, "text", None)]
            if chunks:
                return "".join(chunks).strip()
    except Exception:
        pass
    return ""


def create_simple_prompt(
    user_message: str,
    pet_context: Dict[str, Any],
    conversation_history: Optional[List[Dict[str, str]]] = None,
    prompt_language: str = "en",
) -> str:
    pets = pet_context.get("pets", [])
    pet_info = []
    for pet in pets:
        health_issues = pet.get("health_issues", [])
        behavior_issues = pet.get("behavior_issues", [])
        health_text = f", Health: {', '.join(health_issues)}" if health_issues else ""
        behavior_text = (
            f", Behavior: {', '.join(behavior_issues)}" if behavior_issues else ""
        )
        pet_info.append(
            f"{pet.get('name', 'Pet')}: {pet.get('type', 'pet')} ({pet.get('breed', 'unknown')}), "
            f"{float(pet.get('age', 0) or 0):.1f} years old, {pet.get('weight', 0)}kg, "
            f"{pet.get('gender', '')}{health_text}{behavior_text}"
        )
    pet_list = "\n".join(pet_info) if pet_info else "(no pets listed)"

    history = conversation_history or []
    conversation_context = ""
    if history:
        conversation_context = "\n\nRecent conversation:\n"
        for msg in history[-6:]:
            role = "User" if msg.get("isUser") == "true" else "Assistant"
            conversation_context += f"{role}: {msg.get('content', '')}\n"

    lang = (prompt_language or "en").lower()
    if lang.startswith("he"):
        lang_instruction = (
            "\n\nIMPORTANT: The user is writing in Hebrew. Reply entirely in Hebrew (עברית), "
            "with clear, practical pet-care guidance. For serious symptoms, recommend a vet."
        )
    else:
        lang_instruction = ""

    return f"""You are a helpful pet care assistant. Here is the user's pet information:

PETS:
{pet_list}{conversation_context}

USER QUESTION: {user_message}

Instructions:
- Answer based on the pets listed; if they mention a name, focus on that pet.
- For sorting or listing requests, follow the question literally.
- Be practical and supportive; for medical concerns, recommend consulting a veterinarian.
- Do not claim to diagnose; suggest when professional care is needed.
{lang_instruction}

Please provide a helpful response."""


def generate_simple_actions(
    user_message: str, pet_context: Dict[str, Any]
) -> List[Dict[str, str]]:
    _ = (user_message, pet_context)
    return [
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
    ]


def handle_simple_fallback(
    message: str,
    pet_context: Dict[str, Any],
    conversation_history: Optional[List[Dict[str, str]]] = None,
) -> AIChatResponse:
    """Rule-based fallback when Gemini is unavailable or fails."""
    _ = conversation_history
    pets = pet_context.get("pets", [])
    message_lower = message.lower()

    if "sort" in message_lower and "pet" in message_lower:
        sorted_pets = sorted(pets, key=lambda x: float(x.get("age", 0) or 0))
        pet_responses = []
        for i, pet in enumerate(sorted_pets, 1):
            pet_name = pet.get("name", "Pet")
            pet_age = float(pet.get("age", 0) or 0)
            pet_breed = pet.get("breed", "unknown breed")
            pet_type = pet.get("type", "pet")
            health_issues = pet.get("health_issues", [])
            behavior_issues = pet.get("behavior_issues", [])
            if pet_age < 1:
                age_desc = f"{pet_age:.1f} years old (young)"
            elif pet_age > 7:
                age_desc = f"{pet_age:.1f} years old (senior)"
            else:
                age_desc = f"{pet_age:.1f} years old (adult)"
            health_text = (
                f"\n   Health Issues: {', '.join(health_issues)}" if health_issues else ""
            )
            behavior_text = (
                f"\n   Behavior Issues: {', '.join(behavior_issues)}"
                if behavior_issues
                else ""
            )
            pet_responses.append(
                f"{i}. **{pet_name}** - {pet_type} ({pet_breed}), {age_desc}"
                f"{health_text}{behavior_text}"
            )
        return AIChatResponse(
            message="Here are your pets sorted from youngest to oldest:\n\n"
            + "\n\n".join(pet_responses),
            suggested_actions=[
                {
                    "id": "pet_care_plan",
                    "type": "create_task",
                    "label": "Create Care Plan",
                    "description": "Set up a care plan for your pets",
                }
            ],
        )

    mentioned_pet = None
    for pet in pets:
        if pet.get("name") and str(pet["name"]).lower() in message_lower:
            mentioned_pet = pet
            break

    if mentioned_pet:
        pet_name = mentioned_pet.get("name", "your pet")
        health_issues = mentioned_pet.get("health_issues", [])
        behavior_issues = mentioned_pet.get("behavior_issues", [])
        msg = f"I can help with {pet_name}'s care. "
        if health_issues:
            msg += f"{pet_name} has health concerns: {', '.join(health_issues)}. "
        if behavior_issues:
            msg += f"Behavior issues: {', '.join(behavior_issues)}. "
        msg += f"What specific aspect of {pet_name}'s care would you like help with?"
        return AIChatResponse(
            message=msg,
            suggested_actions=[
                {
                    "id": f"{str(pet_name).lower()}_care",
                    "type": "view_tips",
                    "label": f"{pet_name}'s Care",
                    "description": f"Get care advice for {pet_name}",
                }
            ],
        )

    pet_names = [p.get("name", "?") for p in pets]
    return AIChatResponse(
        message=(
            f"I'd be happy to help with your pet care questions! "
            f"You have {len(pets)} pets: {', '.join(pet_names)}. What would you like to know?"
        ),
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


@router.post("/chat", response_model=AIChatResponse)
async def chat_with_ai(
    request: AIChatRequest, current_user: UserORM = Depends(get_current_user)
):
    if not request.message or not str(request.message).strip():
        return AIChatResponse(
            message="Please provide a message so I can help with your pets.",
            suggested_actions=[
                {
                    "id": "retry",
                    "type": "retry",
                    "label": "Try Again",
                    "description": "Send a question about your pets",
                }
            ],
        )

    api_key = firebase_user_service.get_gemini_api_key_for_user(current_user)
    history = request.conversation_history

    if not api_key:
        # Offline rules still help for sort / name detection
        fb = handle_simple_fallback(
            request.message, request.pet_context, history
        )
        if "sorted from youngest" in fb.message or "I can help with" in fb.message:
            return fb
        return AIChatResponse(
            message="AI service is temporarily unavailable. Please try again later.",
            suggested_actions=[
                {
                    "id": "retry",
                    "type": "retry",
                    "label": "Try Again",
                    "description": "Retry your request",
                },
                {
                    "id": "contact_support",
                    "type": "contact_support",
                    "label": "Contact Support",
                    "description": "Get help from support",
                },
            ],
        )

    model_name = (
        os.getenv("GEMINI_MODEL", _DEFAULT_MODEL_NAME).strip() or _DEFAULT_MODEL_NAME
    )

    try:
        genai.configure(api_key=api_key)
        current_model = genai.GenerativeModel(model_name)
        prompt = create_simple_prompt(
            request.message,
            request.pet_context,
            history,
            request.prompt_language,
        )
        raw = current_model.generate_content(prompt)
        message = _extract_response_text(raw)
        if not message:
            return handle_simple_fallback(
                request.message, request.pet_context, history
            )
        return AIChatResponse(
            message=message,
            suggested_actions=generate_simple_actions(
                request.message, request.pet_context
            ),
        )
    except Exception as e:
        print(f"AI Chat Error: {e}")
        return handle_simple_fallback(
            request.message, request.pet_context, history
        )


@router.get("/test")
async def test_ai():
    return {"message": "AI service is working", "status": "ok"}


@router.get("/firebase-config", response_model=FirebaseConfigResponse)
async def get_firebase_config(current_user: UserORM = Depends(get_current_user)):
    try:
        configs = firebase_user_service.get_available_configs(current_user)
        return FirebaseConfigResponse(
            configs=configs,
            user=current_user.username,
            firebase_available=len(configs) > 0,
        )
    except Exception as e:
        print(f"Error getting Firebase config for {current_user.username}: {e}")
        return FirebaseConfigResponse(
            configs={},
            user=current_user.username,
            firebase_available=False,
        )
