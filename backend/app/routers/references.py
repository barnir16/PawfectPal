import os
from typing import Any, Dict, List, Optional

import requests
from fastapi import Depends, APIRouter, HTTPException, Query
from sqlalchemy.orm import Session
from app.models import (
    VaccineORM,
    AgeRestrictionORM,
)
from app.schemas import Vaccine, AgeRestriction
from app.dependencies.db import get_db

vaccines_router = APIRouter(prefix="/vaccines", tags=["Vaccines"])
age_router = APIRouter(prefix="/age_restrictions", tags=["Age Restrictions"])
breeds_router = APIRouter(prefix="/breeds", tags=["Breeds"])

BREED_API_TIMEOUT_SECONDS = 8


def _get_pet_api_key(pet_type: str) -> Optional[str]:
    if pet_type == "dog":
        return os.getenv("DOG_API_KEY") or os.getenv("PETS_API_KEY")
    if pet_type == "cat":
        return os.getenv("CAT_API_KEY") or os.getenv("PETS_API_KEY")
    return os.getenv("PETS_API_KEY")


def _api_headers(pet_type: str) -> Dict[str, str]:
    api_key = _get_pet_api_key(pet_type)
    return {"x-api-key": api_key} if api_key else {}


def _parse_weight_range(value: Any) -> Optional[Dict[str, Any]]:
    if not value:
        return None

    if isinstance(value, dict):
        value = value.get("metric") or value.get("imperial")

    if not isinstance(value, str):
        return None

    import re

    match = re.search("(\\d+(?:\\.\\d+)?)\\s*[-\\u2013]\\s*(\\d+(?:\\.\\d+)?)", value)
    if not match:
        return None

    return {
        "min": float(match.group(1)),
        "max": float(match.group(2)),
        "unit": "kg",
    }


def _parse_life_span(value: Any) -> Optional[Dict[str, Any]]:
    if not isinstance(value, str):
        return None

    import re

    match = re.search("(\\d+)\\s*[-\\u2013]\\s*(\\d+)", value)
    if not match:
        return None

    return {
        "min": int(match.group(1)),
        "max": int(match.group(2)),
        "unit": "years",
    }


def _level(value: Any) -> str:
    try:
        numeric = int(value)
    except (TypeError, ValueError):
        return "moderate"
    if numeric <= 2:
        return "low"
    if numeric <= 4:
        return "moderate"
    return "high"


def _build_health_considerations(pet_type: str, data: Dict[str, Any], weight_range: Optional[Dict[str, Any]]) -> List[str]:
    """Derive breed-specific health notes from whatever signals the provider gives us.

    Neither TheDogAPI nor TheCatAPI publish a consistent health-risk field, so we
    combine what IS available (numeric health_issues score on cats, weight class,
    breed group) into concrete, differentiated guidance instead of one static string.
    """
    considerations: List[str] = []

    health_score = data.get("health_issues")
    if isinstance(health_score, (int, float)):
        if health_score >= 4:
            considerations.append(
                "This breed is more prone to hereditary health issues — regular veterinary checkups are strongly recommended"
            )
        elif health_score <= 2:
            considerations.append(
                "Generally a robust breed with few known genetic predispositions"
            )
        else:
            considerations.append(
                "Moderate risk of breed-related health issues — routine wellness exams recommended"
            )

    if weight_range and weight_range.get("max", 0) >= 30:
        considerations.append(
            "Larger breeds are prone to joint and hip conditions — monitor mobility and maintain a healthy weight"
        )

    breed_group = data.get("breed_group") or data.get("bred_for")
    if breed_group:
        considerations.append(f"Bred for/as {breed_group}; ask your vet about conditions common to this group")

    grooming_level = _level(data.get("grooming"))
    if grooming_level == "high":
        considerations.append("High grooming needs — regular brushing helps prevent skin and coat issues")

    if not considerations:
        considerations.append(
            "No specific breed health data available from our provider — schedule regular veterinary checkups"
        )

    return considerations


def _build_diet_recommendation(pet_type: str, weight_range: Optional[Dict[str, Any]], energy_level: str) -> str:
    """Build a diet blurb from weight class and energy level instead of a static line."""
    animal = "dog" if pet_type == "dog" else "cat"

    if weight_range:
        avg_weight = (weight_range.get("min", 0) + weight_range.get("max", 0)) / 2
        if avg_weight >= 30:
            size_note = f"large-breed {animal} food formulated for joint support"
        elif avg_weight <= 5:
            size_note = f"small-breed {animal} food with smaller kibble size"
        else:
            size_note = f"medium-breed {animal} food"
    else:
        size_note = f"{animal} food appropriate for their size"

    if energy_level == "high":
        activity_note = "higher-calorie, protein-rich diet to match their activity level"
    elif energy_level == "low":
        activity_note = "portion-controlled diet to avoid weight gain given their lower activity level"
    else:
        activity_note = "balanced diet with standard portion control"

    return f"Consider {size_note} and a {activity_note}. Always confirm portions with your veterinarian."


def _breed_info_from_api(pet_type: str, breed_name: str, data: Dict[str, Any]) -> Dict[str, Any]:
    temperament = data.get("temperament")
    weight_range = _parse_weight_range(data.get("weight"))
    energy_level = _level(data.get("energy_level"))

    return {
        "name": data.get("name") or breed_name,
        "averageWeight": weight_range,
        "lifeExpectancy": _parse_life_span(data.get("life_span")),
        "characteristics": {
            "energyLevel": energy_level,
            "groomingNeeds": _level(data.get("grooming")),
            "trainability": _level(data.get("intelligence")),
            "goodWithChildren": data.get("child_friendly", 3) > 3
            if isinstance(data.get("child_friendly"), int)
            else None,
            "goodWithOtherPets": (
                data.get("dog_friendly", data.get("other_pets_friendly", 3)) > 3
                if isinstance(data.get("dog_friendly", data.get("other_pets_friendly", 3)), int)
                else None
            ),
        },
        "healthConsiderations": _build_health_considerations(pet_type, data, weight_range),
        "exerciseNeeds": (
            "Daily exercise and mental stimulation recommended"
            if pet_type == "dog"
            else "Regular play and environmental enrichment recommended"
        ),
        "dietRecommendations": _build_diet_recommendation(pet_type, weight_range, energy_level),
        "origin": data.get("origin") or "Various origins",
        "temperament": temperament or "Breed temperament varies by individual pet",
    }


def _get_breed_api_base(pet_type: str) -> str:
    if pet_type == "dog":
        return "https://api.thedogapi.com/v1"
    if pet_type == "cat":
        return "https://api.thecatapi.com/v1"
    raise HTTPException(status_code=400, detail="Unsupported pet type")


def _request_breed_api(pet_type: str, path: str, params: Optional[Dict[str, str]] = None) -> Any:
    base_url = _get_breed_api_base(pet_type)
    try:
        response = requests.get(
            f"{base_url}{path}",
            params=params or {},
            headers=_api_headers(pet_type),
            timeout=BREED_API_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        return response.json()
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail="Breed provider is unavailable") from exc


@vaccines_router.get("/", response_model=List[Vaccine])
def get_vaccines(db: Session = Depends(get_db)):
    vaccines = db.query(VaccineORM).all()
    return [Vaccine.model_validate(v) for v in vaccines]


@age_router.get("/", response_model=List[AgeRestriction])
def get_age_restrictions(db: Session = Depends(get_db)):
    restrictions = db.query(AgeRestrictionORM).all()
    return [AgeRestriction.model_validate(r) for r in restrictions]


@breeds_router.get("/{pet_type}", response_model=List[str])
def search_breeds(
    pet_type: str,
    q: Optional[str] = Query(default=None, min_length=0, max_length=80),
):
    # Returns empty list when the external breed provider is unavailable
    # so the UI can degrade gracefully (free-text entry still works).
    normalized_type = pet_type.lower().strip()
    query = (q or "").strip()

    try:
        if query:
            data = _request_breed_api(normalized_type, "/breeds/search", {"q": query})
        else:
            data = _request_breed_api(normalized_type, "/breeds")
    except HTTPException:
        return []

    if not isinstance(data, list):
        return []

    names = [item.get("name") for item in data if isinstance(item, dict) and item.get("name")]
    return names[:25]


@breeds_router.get("/{pet_type}/info")
def get_breed_info(
    pet_type: str,
    name: str = Query(..., min_length=1, max_length=120),
):
    normalized_type = pet_type.lower().strip()
    breed_name = name.strip()

    try:
        data = _request_breed_api(normalized_type, "/breeds/search", {"q": breed_name})
    except HTTPException:
        raise HTTPException(status_code=503, detail="Breed provider is temporarily unavailable")

    if not isinstance(data, list) or not data:
        raise HTTPException(status_code=404, detail="Breed not found")

    return _breed_info_from_api(normalized_type, breed_name, data[0])
