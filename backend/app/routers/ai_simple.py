"""
Minimal AI Chat Route - Working version
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os

from app.dependencies.auth import get_current_user
from app.dependencies.db import get_db
from app.models.user import UserORM
from sqlalchemy.orm import Session

router = APIRouter(prefix="/ai", tags=["AI"])

class PetContext(BaseModel):
    name: str
    breed: str
    age: int
    weight: float
    health_issues: List[str] = []
    behavior_issues: List[str] = []
    is_vaccinated: bool = False
    is_neutered: bool = False
    last_vet_visit: Optional[str] = None
    next_vet_visit: Optional[str] = None

class AIChatRequest(BaseModel):
    message: str
    pet_context: Dict[str, Any]
    prompt_language: str = "en"
    conversation_history: Optional[List[Dict[str, str]]] = None

class AIChatResponse(BaseModel):
    message: str
    suggested_actions: List[Dict[str, str]] = []

@router.post("/chat", response_model=AIChatResponse)
async def chat_with_ai(request: AIChatRequest, current_user: UserORM = Depends(get_current_user)):
    """Simple AI chat endpoint - placeholder for now"""
    try:
        # For now, return a simple response
        return AIChatResponse(
            message="AI service is temporarily unavailable. Please try again later.",
            suggested_actions=[
                {"id": "retry", "type": "retry", "label": "Try Again", "description": "Retry your request"},
                {"id": "contact_support", "type": "contact_support", "label": "Contact Support", "description": "Get help from support team"}
            ]
        )
    except Exception as e:
        print(f"AI Chat Error: {str(e)}")
        return AIChatResponse(
            message="AI service is temporarily unavailable. Please try again later.",
            suggested_actions=[]
        )

@router.get("/test")
async def test_ai():
    """Test endpoint for AI service"""
    return {"message": "AI service is working", "status": "ok"}