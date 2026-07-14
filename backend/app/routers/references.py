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


def _breed_info_from_api(pet_type: str, breed_name: str, data: Dict[str, Any]) -> Dict[str, Any]:
    temperament = data.get("temperament")
    health_issues = data.get("health_issues")
    health_considerations = []
    if health_issues:
        health_considerations.append(str(health_issues))
    else:
        health_considerations.append("General breed health considerations")

    return {
        "name": data.get("name") or breed_name,
        "averageWeight": _parse_weight_range(data.get("weight")),
        "lifeExpectancy": _parse_life_span(data.get("life_span")),
        "characteristics": {
            "energyLevel": _level(data.get("energy_level")),
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
        "healthConsiderations": health_considerations,
        "exerciseNeeds": (
            "Daily exercise and mental stimulation recommended"
            if pet_type == "dog"
            else "Regular play and environmental enrichment recommended"
        ),
        "dietRecommendations": "Consult a veterinarian for diet guidance specific to this pet",
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
    """Get all vaccines"""
    vaccines = db.query(VaccineORM).all()
    return [Vaccine.model_validate(v) for v in vaccines]


@age_router.get("/", response_model=List[AgeRestriction])
def get_age_restrictions(db: Session = Depends(get_db)):
    """Get all age restrictions"""
    restrictions = db.query(AgeRestrictionORM).all()
    return [AgeRestriction.model_validate(r) for r in restrictions]


@breeds_router.get("/{pet_type}", response_model=List[str])
def search_breeds(
    pet_type: str,
    q: Optional[str] = Query(default=None, min_length=0, max_length=80),
):
    """Search dog/cat breeds through backend-only external API integration.
    Returns an empty list when the external breed provider is unavailable
    so the UI can degrade gracefully (free-text entry still works).
    """
    normalized_type = pet_type.lower().strip()
    query = (q or "").strip()

    try:
        if query:
            data = _request_breed_api(normalized_type, "/breeds/search", {"q": query})
        else:
            data = _request_breed_api(normalized_type, "/breeds")
    except HTTPException:
        # External breed API is down — return empty list, don't crash the UI
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
    """Fetch detailed breed information through the backend.
    Returns 404 when breed is not found, or 503 (not 502) when provider is down
    so callers can distinguish 'no data' from 'service crash'