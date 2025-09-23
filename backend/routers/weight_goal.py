from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from dependencies.db import get_db
from models.weight_goal import WeightGoalORM
from models.pet import PetORM
from schemas.weight_goal import (
    WeightGoalCreate,
    WeightGoalUpdate,
    WeightGoalResponse,
    WeightGoalWithPet
)
from dependencies.auth import get_current_user
from models.user import UserORM

router = APIRouter(prefix="/api/weight-goals", tags=["Weight Goals"])


@router.get("/", response_model=List[WeightGoalWithPet])
async def get_all_weight_goals(
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
    limit: Optional[int] = 100,
    offset: Optional[int] = 0
):
    """Get all weight goals for the current user's pets"""
    try:
        # Get all pets owned by the current user
        user_pets = db.query(PetORM).filter(PetORM.user_id == current_user.id).all()
        pet_ids = [pet.id for pet in user_pets]
        
        if not pet_ids:
            return []
        
        # Get weight goals for user's pets
        weight_goals = (
            db.query(WeightGoalORM)
            .filter(WeightGoalORM.pet_id.in_(pet_ids))
            .order_by(WeightGoalORM.created_at.desc())
            .limit(limit)
            .offset(offset)
            .all()
        )
        
        # Convert to response format with pet information
        result = []
        for goal in weight_goals:
            pet = next((p for p in user_pets if p.id == goal.pet_id), None)
            if pet:
                result.append(WeightGoalWithPet(
                    id=goal.id,
                    pet_id=goal.pet_id,
                    target_weight=goal.target_weight,
                    weight_unit=goal.weight_unit,
                    goal_type=goal.goal_type,
                    description=goal.description,
                    is_active=goal.is_active,
                    target_date=goal.target_date,
                    created_at=goal.created_at,
                    updated_at=goal.updated_at,
                    pet_name=pet.name,
                    pet_type=pet.breed_type
                ))
        
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch weight goals: {str(e)}"
        )


@router.get("/pet/{pet_id}/", response_model=List[WeightGoalResponse])
async def get_weight_goals_by_pet(
    pet_id: int,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user)
):
    """Get weight goals for a specific pet"""
    try:
        # Verify the pet belongs to the current user
        pet = db.query(PetORM).filter(
            PetORM.id == pet_id,
            PetORM.user_id == current_user.id
        ).first()
        
        if not pet:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pet not found or access denied"
            )
        
        # Get weight goals for the pet
        weight_goals = (
            db.query(WeightGoalORM)
            .filter(WeightGoalORM.pet_id == pet_id)
            .order_by(WeightGoalORM.created_at.desc())
            .all()
        )
        
        return weight_goals
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch weight goals: {str(e)}"
        )


@router.post("/", response_model=WeightGoalResponse, status_code=status.HTTP_201_CREATED)
async def create_weight_goal(
    weight_goal: WeightGoalCreate,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user)
):
    """Create a new weight goal"""
    try:
        # Verify the pet belongs to the current user
        pet = db.query(PetORM).filter(
            PetORM.id == weight_goal.pet_id,
            PetORM.user_id == current_user.id
        ).first()
        
        if not pet:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pet not found or access denied"
            )
        
        # Create the weight goal
        db_weight_goal = WeightGoalORM(
            pet_id=weight_goal.pet_id,
            target_weight=weight_goal.target_weight,
            weight_unit=weight_goal.weight_unit,
            goal_type=weight_goal.goal_type,
            description=weight_goal.description,
            is_active=weight_goal.is_active,
            target_date=weight_goal.target_date
        )
        
        db.add(db_weight_goal)
        db.commit()
        db.refresh(db_weight_goal)
        
        return db_weight_goal
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create weight goal: {str(e)}"
        )


@router.put("/{goal_id}/", response_model=WeightGoalResponse)
async def update_weight_goal(
    goal_id: int,
    weight_goal_update: WeightGoalUpdate,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user)
):
    """Update an existing weight goal"""
    try:
        # Get the weight goal and verify ownership
        db_weight_goal = db.query(WeightGoalORM).filter(
            WeightGoalORM.id == goal_id
        ).first()
        
        if not db_weight_goal:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Weight goal not found"
            )
        
        # Verify the pet belongs to the current user
        pet = db.query(PetORM).filter(
            PetORM.id == db_weight_goal.pet_id,
            PetORM.user_id == current_user.id
        ).first()
        
        if not pet:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this weight goal"
            )
        
        # Update the weight goal
        update_data = weight_goal_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_weight_goal, field, value)
        
        db_weight_goal.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_weight_goal)
        
        return db_weight_goal
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update weight goal: {str(e)}"
        )


@router.delete("/{goal_id}/", status_code=status.HTTP_204_NO_CONTENT)
async def delete_weight_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user)
):
    """Delete a weight goal"""
    try:
        # Get the weight goal and verify ownership
        db_weight_goal = db.query(WeightGoalORM).filter(
            WeightGoalORM.id == goal_id
        ).first()
        
        if not db_weight_goal:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Weight goal not found"
            )
        
        # Verify the pet belongs to the current user
        pet = db.query(PetORM).filter(
            PetORM.id == db_weight_goal.pet_id,
            PetORM.user_id == current_user.id
        ).first()
        
        if not pet:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this weight goal"
            )
        
        # Delete the weight goal
        db.delete(db_weight_goal)
        db.commit()
        
        return None
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete weight goal: {str(e)}"
        )
