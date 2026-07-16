"""
AI chat route — Gemini-backed, with offline fallbacks.

Gemini client config/error handling lives in app.services.gemini_service;
this router only owns the pet-care-chat-specific prompt building, rule-based
fallback logic, and intent-aware suggested actions.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.dependencies.auth import get_current_user
from app.models.user import UserORM
from app.services import gemini_service
from app.services.firebase_user_service import firebase_user_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["AI"])

_SAFE_FIREBASE_CONFIG_KEYS = {
    "api_base_url",
    "enable_ai_chatbot",
    "enable_google_auth",
    "enable_push_notifications",
    "google_client_id",
}


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


class VaccineSuggestionInput(BaseModel):
    vaccine_name: str
    category: str = "recommended"  # mandatory | recommended | preventative
    priority: str = "medium"  # high | medium | low
    is_overdue: bool = False
    due_date: Optional[str] = None
    reason: Optional[str] = None


class VaccineExplainerRequest(BaseModel):
    pet_name: str
    pet_type: str  # dog | cat
    pet_age_weeks: Optional[int] = None
    suggestions: List[VaccineSuggestionInput]
    prompt_language: str = "en"


class VaccineExplainerResponse(BaseModel):
    explanation: str
    ai_generated: bool


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
            explicit_role = str(msg.get("role", "")).lower()
            is_user_value = msg.get("isUser")
            is_user = explicit_role == "user" or str(is_user_value).lower() == "true"
            role = "User" if is_user else "Assistant"
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


_EMERGENCY_KEYWORDS = [
    "emergency", "bleeding", "unconscious", "seizure", "seizing", "poison",
    "poisoned", "choking", "can't breathe", "difficulty breathing",
    "hit by car", "collapsed", "not breathing",
    "חירום", "מדמם", "מחוסר הכרה", "התקף", "הרעלה", "נחנק", "לא נושם", "התמוטט",
]
_SCHEDULE_KEYWORDS = [
    "appointment", "schedule", "vet visit", "checkup", "check-up", "book a vet",
    "see a vet", "vet appointment",
    "תור", "פגישה", "ביקור וטרינר", "לקבוע תור",
]
_DIET_KEYWORDS = [
    "diet", "food", "feeding", "nutrition", "what should i feed", "overweight",
    "underweight",
    "תזונה", "אוכל", "האכלה", "משקל עודף", "תת משקל",
]
_EXERCISE_KEYWORDS = [
    "exercise", "walk", "walking", "activity", "play", "playtime",
    "פעילות", "טיול", "הליכה", "משחק",
]
_ADD_PET_KEYWORDS = [
    "add a pet", "new pet", "register my pet", "add my pet",
    "הוסף חיה", "חיה חדשה", "רשום חיה",
]


def _matches_any(message_lower: str, keywords: List[str]) -> bool:
    return any(keyword in message_lower for keyword in keywords)


def generate_simple_actions(
    user_message: str,
    pet_context: Dict[str, Any],
    prompt_language: str = "en",
) -> List[Dict[str, str]]:
    """Suggest follow-up actions based on detected intent in the user's message.

    The frontend chatbot already understands a rich vocabulary of action types
    (emergency, schedule_vet, nutrition_tips, exercise_plan, add_pet, view_tips —
    see AIChatbot.tsx's handleSuggestedAction/getActionIcon switches) but this
    backend previously always returned the same two generic actions regardless
    of what was asked. This wires real intent detection into that vocabulary.
    """
    is_hebrew = _is_hebrew(prompt_language)
    message_lower = (user_message or "").lower()
    actions: List[Dict[str, str]] = []

    if _matches_any(message_lower, _EMERGENCY_KEYWORDS):
        actions.append(
            {
                "id": "emergency_help",
                "type": "emergency",
                "label": "מצב חירום" if is_hebrew else "Emergency",
                "description": (
                    "קבל הנחיות חירום מיידיות" if is_hebrew else "Get immediate emergency guidance"
                ),
            }
        )

    if _matches_any(message_lower, _SCHEDULE_KEYWORDS):
        actions.append(
            {
                "id": "schedule_vet_visit",
                "type": "schedule_vet",
                "label": "קבע ביקור וטרינר" if is_hebrew else "Schedule Vet Visit",
                "description": (
                    "צור משימת ביקור וטרינר" if is_hebrew else "Create a vet visit task"
                ),
            }
        )

    if _matches_any(message_lower, _DIET_KEYWORDS):
        actions.append(
            {
                "id": "nutrition_tips",
                "type": "nutrition_tips",
                "label": "עצות תזונה" if is_hebrew else "Nutrition Tips",
                "description": (
                    "קבל עצות תזונה עבור חיות המחמד שלך" if is_hebrew else "Get nutrition advice for your pets"
                ),
            }
        )

    if _matches_any(message_lower, _EXERCISE_KEYWORDS):
        actions.append(
            {
                "id": "exercise_plan",
                "type": "exercise_plan",
                "label": "תוכנית פעילות" if is_hebrew else "Exercise Plan",
                "description": (
                    "קבל תוכנית פעילות עבור חיות המחמד שלך" if is_hebrew else "Get an exercise plan for your pets"
                ),
            }
        )

    pets = pet_context.get("pets", []) if isinstance(pet_context, dict) else []
    if not pets or _matches_any(message_lower, _ADD_PET_KEYWORDS):
        actions.append(
            {
                "id": "add_pet",
                "type": "add_pet",
                "label": "הוסף חיית מחמד" if is_hebrew else "Add a Pet",
                "description": (
                    "הוסף חיית מחמד כדי לקבל עצות מותאמות אישית"
                    if is_hebrew
                    else "Add a pet to get personalized advice"
                ),
            }
        )

    # Always include the two general-purpose actions as a baseline, so the
    # chat never leaves the user with zero follow-ups.
    actions.append(
        {
            "id": "health_help",
            "type": "view_tips",
            "label": "עזרה בריאותית" if is_hebrew else "Health Help",
            "description": (
                "קבל עצות בריאות עבור חיות המחמד שלך" if is_hebrew else "Get health advice for your pets"
            ),
        }
    )
    actions.append(
        {
            "id": "behavior_help",
            "type": "view_tips",
            "label": "עזרה התנהגותית" if is_hebrew else "Behavior Help",
            "description": (
                "קבל עצות התנהגות עבור חיות המחמד שלך" if is_hebrew else "Get behavior advice for your pets"
            ),
        }
    )

    return actions


def _is_hebrew(prompt_language: str) -> bool:
    return (prompt_language or "en").lower().startswith("he")


def _build_unavailable_response(
    prompt_language: str = "en",
    retry_after_seconds: Optional[int] = None,
) -> AIChatResponse:
    if _is_hebrew(prompt_language):
        if retry_after_seconds:
            message = (
                f"שירות ה-AI עמוס כרגע. נסה שוב בעוד כ-{retry_after_seconds} שניות."
            )
        else:
            message = "שירות ה-AI אינו זמין כרגע. נסה שוב בעוד כמה רגעים."
        retry_label = "נסה שוב"
        retry_description = "שלח את הבקשה שוב בעוד רגע"
    else:
        if retry_after_seconds:
            message = (
                f"The AI service is busy right now. Please try again in about "
                f"{retry_after_seconds} seconds."
            )
        else:
            message = "The AI service is temporarily unavailable. Please try again shortly."
        retry_label = "Try Again"
        retry_description = "Retry your request in a moment"

    return AIChatResponse(
        message=message,
        suggested_actions=[
            {
                "id": "retry",
                "type": "retry",
                "label": retry_label,
                "description": retry_description,
            }
        ],
    )


def _get_safe_config_values(configs: Dict[str, str]) -> Dict[str, str]:
    """Return only public config values that are safe to expose."""
    return {
        key: value for key, value in configs.items() if key in _SAFE_FIREBASE_CONFIG_KEYS
    }


def handle_simple_fallback(
    message: str,
    pet_context: Dict[str, Any],
    conversation_history: Optional[List[Dict[str, str]]] = None,
    prompt_language: str = "en",
    allow_general: bool = True,
) -> AIChatResponse:
    """Rule-based fallback when Gemini is unavailable or fails."""
    _ = conversation_history
    pets = pet_context.get("pets", [])
    message_lower = message.lower()
    is_hebrew = _is_hebrew(prompt_language)

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
            message=(
                "להלן חיות המחמד שלך מהצעירה למבוגרת:\n\n"
                if is_hebrew
                else "Here are your pets sorted from youngest to oldest:\n\n"
            )
            + "\n\n".join(pet_responses),
            suggested_actions=[
                {
                    "id": "pet_care_plan",
                    "type": "create_task",
                    "label": "צור תוכנית טיפול" if is_hebrew else "Create Care Plan",
                    "description": (
                        "הגדר תוכנית טיפול לחיות המחמד שלך"
                        if is_hebrew
                        else "Set up a care plan for your pets"
                    ),
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
        if is_hebrew:
            msg = f"אני יכול לעזור עם הטיפול ב-{pet_name}. "
            if health_issues:
                msg += f"ל-{pet_name} יש בעיות בריאותיות: {', '.join(health_issues)}. "
            if behavior_issues:
                msg += f"יש גם נושאי התנהגות: {', '.join(behavior_issues)}. "
            msg += f"באיזה היבט של הטיפול ב-{pet_name} תרצה עזרה?"
            label = f"הטיפול של {pet_name}"
            description = f"קבל עצות טיפול עבור {pet_name}"
        else:
            msg = f"I can help with {pet_name}'s care. "
            if health_issues:
                msg += f"{pet_name} has health concerns: {', '.join(health_issues)}. "
            if behavior_issues:
                msg += f"Behavior issues: {', '.join(behavior_issues)}. "
            msg += f"What specific aspect of {pet_name}'s care would you like help with?"
            label = f"{pet_name}'s Care"
            description = f"Get care advice for {pet_name}"
        return AIChatResponse(
            message=msg,
            suggested_actions=[
                {
                    "id": f"{str(pet_name).lower()}_care",
                    "type": "view_tips",
                    "label": label,
                    "description": description,
                }
            ],
        )

    if not allow_general:
        return _build_unavailable_response(prompt_language)

    pet_names = [p.get("name", "?") for p in pets]
    return AIChatResponse(
        message=(
            (
                f"אשמח לעזור בשאלות על חיות המחמד שלך. "
                f"יש לך {len(pets)} חיות מחמד: {', '.join(pet_names)}. במה תרצה עזרה?"
            )
            if is_hebrew
            else (
                f"I'd be happy to help with your pet care questions! "
                f"You have {len(pets)} pets: {', '.join(pet_names)}. What would you like to know?"
            )
        ),
        suggested_actions=[
            {
                "id": "health_help",
                "type": "view_tips",
                "label": "עזרה בריאותית" if is_hebrew else "Health Help",
                "description": (
                    "קבל עצות בריאות עבור חיות המחמד שלך"
                    if is_hebrew
                    else "Get health advice for your pets"
                ),
            },
            {
                "id": "behavior_help",
                "type": "view_tips",
                "label": "עזרה התנהגותית" if is_hebrew else "Behavior Help",
                "description": (
                    "קבל עצות התנהגות עבור חיות המחמד שלך"
                    if is_hebrew
                    else "Get behavior advice for your pets"
                ),
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
            request.message,
            request.pet_context,
            history,
            request.prompt_language,
            False,
        )
        if fb.message != _build_unavailable_response(request.prompt_language).message:
            return fb
        return _build_unavailable_response(request.prompt_language)

    prompt = create_simple_prompt(
        request.message,
        request.pet_context,
        history,
        request.prompt_language,
    )

    try:
        message = gemini_service.generate_text(prompt, api_key=api_key)
        return AIChatResponse(
            message=message,
            suggested_actions=generate_simple_actions(
                request.message, request.pet_context, request.prompt_language
            ),
        )
    except gemini_service.GeminiRateLimitError as e:
        return _build_unavailable_response(request.prompt_language, e.retry_after_seconds)
    except gemini_service.GeminiUnavailableError:
        return handle_simple_fallback(
            request.message,
            request.pet_context,
            history,
            request.prompt_language,
            False,
        )


def _create_vaccine_explainer_prompt(request: "VaccineExplainerRequest") -> str:
    lines = []
    for s in request.suggestions:
        status = "OVERDUE" if s.is_overdue else (f"due {s.due_date}" if s.due_date else "upcoming")
        lines.append(f"- {s.vaccine_name} ({s.category}, {s.priority} priority, {status})")
    suggestions_text = "\n".join(lines) if lines else "(no outstanding vaccines — fully up to date)"

    age_text = f", about {request.pet_age_weeks} weeks old" if request.pet_age_weeks else ""

    lang_instruction = (
        "\n\nReply entirely in Hebrew (עברית), in 3-5 short sentences."
        if _is_hebrew(request.prompt_language)
        else "\n\nReply in English, in 3-5 short sentences."
    )

    return f"""You are a friendly pet-care assistant explaining a vaccine schedule to a pet owner.

Pet: {request.pet_name}, a {request.pet_type}{age_text}

Vaccine schedule status:
{suggestions_text}

Write a brief, warm, plain-language explanation of what this schedule means for
{request.pet_name} and what the owner should do next. Prioritize anything overdue.
Do not repeat the raw list verbatim — synthesize it into a short narrative.
Do not diagnose; recommend a veterinarian for anything urgent.{lang_instruction}"""


def _build_vaccine_explainer_fallback(request: "VaccineExplainerRequest") -> str:
    """Deterministic template used when Gemini is unavailable — still useful,
    just not a synthesized narrative."""
    is_hebrew = _is_hebrew(request.prompt_language)
    overdue = [s for s in request.suggestions if s.is_overdue]
    upcoming = [s for s in request.suggestions if not s.is_overdue]

    if not request.suggestions:
        return (
            f"{request.pet_name} מעודכן/ת בכל החיסונים כרגע. המשך/י לעקוב אחר התאריכים הבאים."
            if is_hebrew
            else f"{request.pet_name} is fully up to date on vaccines right now. Keep an eye on upcoming due dates."
        )

    if is_hebrew:
        parts = []
        if overdue:
            names = ", ".join(s.vaccine_name for s in overdue)
            parts.append(f"ל-{request.pet_name} יש חיסונים באיחור: {names}. מומלץ לתאם ביקור וטרינר בהקדם.")
        if upcoming:
            names = ", ".join(s.vaccine_name for s in upcoming)
            parts.append(f"בנוסף, החיסונים הבאים מתוכננים: {names}.")
        return " ".join(parts)

    parts = []
    if overdue:
        names = ", ".join(s.vaccine_name for s in overdue)
        parts.append(f"{request.pet_name} has overdue vaccines: {names}. We recommend scheduling a vet visit soon.")
    if upcoming:
        names = ", ".join(s.vaccine_name for s in upcoming)
        parts.append(f"Upcoming vaccines to plan for: {names}.")
    return " ".join(parts)


@router.post("/vaccine-explainer", response_model=VaccineExplainerResponse)
async def explain_vaccine_plan(
    request: VaccineExplainerRequest, current_user: UserORM = Depends(get_current_user)
):
    """Turn a pet's rule-based vaccine suggestions into a short, synthesized,
    plain-language explanation. Falls back to a deterministic template if
    Gemini is unavailable, so the feature never dead-ends the user."""
    _ = current_user
    api_key = gemini_service.get_api_key()

    if not api_key:
        return VaccineExplainerResponse(
            explanation=_build_vaccine_explainer_fallback(request), ai_generated=False
        )

    try:
        prompt = _create_vaccine_explainer_prompt(request)
        explanation = gemini_service.generate_text(prompt, api_key=api_key)
        return VaccineExplainerResponse(explanation=explanation, ai_generated=True)
    except (gemini_service.GeminiRateLimitError, gemini_service.GeminiUnavailableError):
        return VaccineExplainerResponse(
            explanation=_build_vaccine_explainer_fallback(request), ai_generated=False
        )


@router.get("/test")
async def test_ai():
    # Keep diagnostics high level so the endpoint does not reveal secret material.
    from app.services.firebase_admin import firebase_admin
    
    diagnostic = {}
    diagnostic["firebase_initialized"] = firebase_admin.initialized
    
    try:
        init_res = firebase_admin.initialize()
        diagnostic["initialize_called"] = str(init_res)
    except Exception as e:
        diagnostic["initialize_error"] = str(e)

    try:
        final_key = firebase_admin.get_gemini_api_key()
        diagnostic["final_key_exists"] = bool(final_key)
    except Exception as e:
        diagnostic["final_key_error"] = str(e)
        
    return {"message": "AI service diagnostic", "status": "ok", "diagnostic": diagnostic}


@router.get("/firebase-config", response_model=FirebaseConfigResponse)
async def get_firebase_config(current_user: UserORM = Depends(get_current_user)):
    try:
        configs = _get_safe_config_values(
            firebase_user_service.get_available_configs(current_user)
        )
        return FirebaseConfigResponse(
            configs=configs,
            user=current_user.username,
            firebase_available=len(configs) > 0,
        )
    except Exception:
        logger.exception(
            "Failed to fetch Firebase config for user %s",
            current_user.username,
        )
        return FirebaseConfigResponse(
            configs={},
            user=current_user.username,
            firebase_available=False,
        )
