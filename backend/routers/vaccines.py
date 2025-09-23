from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import logging

from ..database import get_db
from ..models.vaccination import Vaccination
from ..models.pet import Pet
from ..schemas.vaccination import (
    VaccinationCreate, 
    VaccinationUpdate, 
    VaccinationResponse,
    VaccinationSummary,
    VaccinationListResponse
)
from ..auth import get_current_user

router = APIRouter(prefix="/vaccines", tags=["vaccines"])
logger = logging.getLogger(__name__)

@router.get("/pet/{pet_id}", response_model=VaccinationListResponse)
async def get_pet_vaccinations(
    pet_id: int,
    page: int = 1,
    page_size: int = 50,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get all vaccinations for a specific pet"""
    try:
        # Verify pet belongs to user
        pet = db.query(Pet).filter(Pet.id == pet_id, Pet.user_id == current_user.id).first()
        if not pet:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pet not found"
            )
        
        # Get vaccinations with pagination
        offset = (page - 1) * page_size
        vaccinations = db.query(Vaccination).filter(
            Vaccination.pet_id == pet_id
        ).offset(offset).limit(page_size).all()
        
        total = db.query(Vaccination).filter(Vaccination.pet_id == pet_id).count()
        
        return VaccinationListResponse(
            vaccinations=[VaccinationResponse.from_orm(v) for v in vaccinations],
            total=total,
            page=page,
            page_size=page_size
        )
        
    except Exception as e:
        logger.error(f"Error fetching vaccinations for pet {pet_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch vaccinations"
        )

@router.get("/pet/{pet_id}/summary/", response_model=VaccinationSummary)
async def get_pet_vaccination_summary(
    pet_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get vaccination summary for a pet"""
    try:
        # Verify pet belongs to user
        pet = db.query(Pet).filter(Pet.id == pet_id, Pet.user_id == current_user.id).first()
        if not pet:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pet not found"
            )
        
        # Get all vaccinations for the pet
        vaccinations = db.query(Vaccination).filter(Vaccination.pet_id == pet_id).all()
        
        total_vaccinations = len(vaccinations)
        today = datetime.now().date()
        
        # Calculate overdue and due soon
        overdue_count = 0
        due_soon_count = 0
        next_due_date = None
        
        for vaccination in vaccinations:
            if vaccination.next_due_date:
                due_date = vaccination.next_due_date
                days_until_due = (due_date - today).days
                
                if days_until_due < 0:
                    overdue_count += 1
                elif days_until_due <= 30:
                    due_soon_count += 1
                
                if not next_due_date or (due_date > today and due_date < next_due_date):
                    next_due_date = due_date
        
        up_to_date = overdue_count == 0 and due_soon_count == 0
        
        # Get completed series (simplified logic)
        completed_series = []
        vaccine_types = set()
        for vaccination in vaccinations:
            if vaccination.vaccine_type:
                vaccine_types.add(vaccination.vaccine_type)
        
        completed_series = list(vaccine_types)
        
        return VaccinationSummary(
            pet_id=pet_id,
            total_vaccinations=total_vaccinations,
            up_to_date=up_to_date,
            next_due_date=next_due_date,
            overdue_count=overdue_count,
            due_soon_count=due_soon_count,
            completed_series=completed_series
        )
        
    except Exception as e:
        logger.error(f"Error fetching vaccination summary for pet {pet_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch vaccination summary"
        )

@router.post("/pet/{pet_id}", response_model=VaccinationResponse)
async def create_vaccination(
    pet_id: int,
    vaccination_data: VaccinationCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a new vaccination record"""
    try:
        # Verify pet belongs to user
        pet = db.query(Pet).filter(Pet.id == pet_id, Pet.user_id == current_user.id).first()
        if not pet:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pet not found"
            )
        
        # Create vaccination record
        vaccination = Vaccination(
            pet_id=pet_id,
            vaccine_name=vaccination_data.vaccine_name,
            date_administered=vaccination_data.date_administered,
            next_due_date=vaccination_data.next_due_date,
            batch_number=vaccination_data.batch_number,
            manufacturer=vaccination_data.manufacturer,
            veterinarian=vaccination_data.veterinarian,
            clinic=vaccination_data.clinic,
            dose_number=vaccination_data.dose_number,
            notes=vaccination_data.notes,
            is_completed=vaccination_data.is_completed,
            reminder_sent=vaccination_data.reminder_sent
        )
        
        db.add(vaccination)
        db.commit()
        db.refresh(vaccination)
        
        logger.info(f"Created vaccination {vaccination.id} for pet {pet_id}")
        return VaccinationResponse.from_orm(vaccination)
        
    except Exception as e:
        logger.error(f"Error creating vaccination for pet {pet_id}: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create vaccination"
        )

@router.put("/{vaccination_id}", response_model=VaccinationResponse)
async def update_vaccination(
    vaccination_id: int,
    vaccination_data: VaccinationUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update an existing vaccination record"""
    try:
        # Get vaccination and verify ownership
        vaccination = db.query(Vaccination).join(Pet).filter(
            Vaccination.id == vaccination_id,
            Pet.user_id == current_user.id
        ).first()
        
        if not vaccination:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vaccination not found"
            )
        
        # Update fields
        for field, value in vaccination_data.dict(exclude_unset=True).items():
            setattr(vaccination, field, value)
        
        vaccination.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(vaccination)
        
        logger.info(f"Updated vaccination {vaccination_id}")
        return VaccinationResponse.from_orm(vaccination)
        
    except Exception as e:
        logger.error(f"Error updating vaccination {vaccination_id}: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update vaccination"
        )

@router.delete("/{vaccination_id}")
async def delete_vaccination(
    vaccination_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete a vaccination record"""
    try:
        # Get vaccination and verify ownership
        vaccination = db.query(Vaccination).join(Pet).filter(
            Vaccination.id == vaccination_id,
            Pet.user_id == current_user.id
        ).first()
        
        if not vaccination:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vaccination not found"
            )
        
        db.delete(vaccination)
        db.commit()
        
        logger.info(f"Deleted vaccination {vaccination_id}")
        return {"message": "Vaccination deleted successfully"}
        
    except Exception as e:
        logger.error(f"Error deleting vaccination {vaccination_id}: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete vaccination"
        )

@router.get("/due-soon/")
async def get_vaccinations_due_soon(
    days_ahead: int = 30,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get vaccinations due soon for all user's pets"""
    try:
        today = datetime.now().date()
        due_date = today + timedelta(days=days_ahead)
        
        vaccinations = db.query(Vaccination).join(Pet).filter(
            Pet.user_id == current_user.id,
            Vaccination.next_due_date >= today,
            Vaccination.next_due_date <= due_date
        ).all()
        
        results = []
        for vaccination in vaccinations:
            days_until_due = (vaccination.next_due_date - today).days
            results.append({
                "vaccination_id": vaccination.id,
                "pet_id": vaccination.pet_id,
                "pet_name": vaccination.pet.name,
                "vaccine_name": vaccination.vaccine_name,
                "due_date": vaccination.next_due_date,
                "days_until_due": days_until_due,
                "is_overdue": days_until_due < 0
            })
        
        return results
        
    except Exception as e:
        logger.error(f"Error fetching vaccinations due soon: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch vaccinations due soon"
        )

@router.get("/overdue/")
async def get_overdue_vaccinations(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get overdue vaccinations for all user's pets"""
    try:
        today = datetime.now().date()
        
        vaccinations = db.query(Vaccination).join(Pet).filter(
            Pet.user_id == current_user.id,
            Vaccination.next_due_date < today
        ).all()
        
        results = []
        for vaccination in vaccinations:
            days_overdue = (today - vaccination.next_due_date).days
            results.append({
                "vaccination_id": vaccination.id,
                "pet_id": vaccination.pet_id,
                "pet_name": vaccination.pet.name,
                "vaccine_name": vaccination.vaccine_name,
                "due_date": vaccination.next_due_date,
                "days_overdue": days_overdue
            })
        
        return results
        
    except Exception as e:
        logger.error(f"Error fetching overdue vaccinations: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch overdue vaccinations"
        )

