from fastapi import HTTPException, Depends, APIRouter, Query
from sqlalchemy.orm import Session
from typing import List
from models import (
    VaccinationORM,
    PetORM,
    UserORM,
)
from schemas.vaccination import (
    VaccinationCreate,
    VaccinationResponse,
    VaccinationUpdate,
    VaccinationListResponse,
    VaccinationSummary,
    VaccinationReminder,
)
from dependencies.db import get_db
from dependencies.auth import get_current_user
from datetime import date, timedelta

router = APIRouter(prefix="/vaccinations", tags=["vaccinations"])


@router.get("/pet/{pet_id}", response_model=VaccinationListResponse)
def get_pet_vaccinations(
    pet_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Get vaccinations for a specific pet"""
    # Verify pet ownership
    pet = (
        db.query(PetORM)
        .filter(PetORM.id == pet_id, PetORM.user_id == current_user.id)
        .first()
    )
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    # Get total count
    total = db.query(VaccinationORM).filter(VaccinationORM.pet_id == pet_id).count()

    # Apply pagination
    offset = (page - 1) * page_size
    vaccinations = (
        db.query(VaccinationORM)
        .filter(VaccinationORM.pet_id == pet_id)
        .order_by(VaccinationORM.date_administered.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )

    return VaccinationListResponse(
        vaccinations=[VaccinationResponse.model_validate(v) for v in vaccinations],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("/pet/{pet_id}", response_model=VaccinationResponse)
def create_vaccination(
    pet_id: int,
    vaccination: VaccinationCreate,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Create a new vaccination record for a pet"""
    # Verify pet ownership
    pet = (
        db.query(PetORM)
        .filter(PetORM.id == pet_id, PetORM.user_id == current_user.id)
        .first()
    )
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    db_vaccination = VaccinationORM(
        pet_id=pet_id,
        vaccine_name=vaccination.vaccine_name,
        date_administered=vaccination.date_administered,
        next_due_date=vaccination.next_due_date,
        batch_number=vaccination.batch_number,
        manufacturer=vaccination.manufacturer,
        veterinarian=vaccination.veterinarian,
        clinic=vaccination.clinic,
        dose_number=vaccination.dose_number,
        notes=vaccination.notes,
        is_completed=vaccination.is_completed,
        reminder_sent=vaccination.reminder_sent,
    )
    db.add(db_vaccination)
    db.commit()
    db.refresh(db_vaccination)
    return VaccinationResponse.model_validate(db_vaccination)


@router.put("/{vaccination_id}", response_model=VaccinationResponse)
def update_vaccination(
    vaccination_id: int,
    vaccination: VaccinationUpdate,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Update an existing vaccination record"""
    # Verify vaccination exists and user owns the pet
    db_vaccination = (
        db.query(VaccinationORM)
        .join(PetORM)
        .filter(VaccinationORM.id == vaccination_id, PetORM.user_id == current_user.id)
        .first()
    )

    if not db_vaccination:
        raise HTTPException(status_code=404, detail="Vaccination record not found")

    # Update fields
    db_vaccination.vaccine_name = vaccination.vaccine_name
    db_vaccination.date_administered = vaccination.date_administered
    db_vaccination.next_due_date = vaccination.next_due_date
    db_vaccination.batch_number = vaccination.batch_number
    db_vaccination.manufacturer = vaccination.manufacturer
    db_vaccination.veterinarian = vaccination.veterinarian
    db_vaccination.clinic = vaccination.clinic
    db_vaccination.dose_number = vaccination.dose_number
    db_vaccination.notes = vaccination.notes
    db_vaccination.is_completed = vaccination.is_completed
    db_vaccination.reminder_sent = vaccination.reminder_sent

    db.commit()
    db.refresh(db_vaccination)
    return VaccinationResponse.model_validate(db_vaccination)


@router.delete("/{vaccination_id}")
def delete_vaccination(
    vaccination_id: int,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Delete a vaccination record"""
    # Verify vaccination exists and user owns the pet
    db_vaccination = (
        db.query(VaccinationORM)
        .join(PetORM)
        .filter(VaccinationORM.id == vaccination_id, PetORM.user_id == current_user.id)
        .first()
    )

    if not db_vaccination:
        raise HTTPException(status_code=404, detail="Vaccination record not found")

    db.delete(db_vaccination)
    db.commit()
    return {"message": "Vaccination record deleted successfully"}


@router.get("/pet/{pet_id}/summary", response_model=VaccinationSummary)
def get_pet_vaccination_summary(
    pet_id: int,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Get vaccination summary for a pet"""
    # Verify pet ownership
    pet = (
        db.query(PetORM)
        .filter(PetORM.id == pet_id, PetORM.user_id == current_user.id)
        .first()
    )
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    vaccinations = (
        db.query(VaccinationORM).filter(VaccinationORM.pet_id == pet_id).all()
    )

    total_vaccinations = len(vaccinations)
    today = date.today()

    # Find next due date
    future_due_dates = [
        v.next_due_date
        for v in vaccinations
        if v.next_due_date and v.next_due_date >= today
    ]
    next_due_date = min(future_due_dates) if future_due_dates else None

    # Count overdue vaccinations
    overdue_count = len(
        [v for v in vaccinations if v.next_due_date and v.next_due_date < today]
    )

    # Check if up to date (no overdue vaccinations)
    up_to_date = overdue_count == 0

    # Get completed series (vaccines with no pending doses)
    completed_series = list(
        set(
            [
                v.vaccine_name
                for v in vaccinations
                if v.is_completed and (not v.next_due_date or v.next_due_date >= today)
            ]
        )
    )

    return VaccinationSummary(
        pet_id=pet_id,
        total_vaccinations=total_vaccinations,
        up_to_date=up_to_date,
        next_due_date=next_due_date,
        overdue_count=overdue_count,
        completed_series=completed_series,
    )


@router.get("/due-soon", response_model=List[VaccinationReminder])
def get_vaccinations_due_soon(
    days_ahead: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Get vaccinations due soon for all user's pets"""
    today = date.today()
    end_date = today + timedelta(days=days_ahead)

    # Get all vaccinations due within the specified period for user's pets
    vaccinations = (
        db.query(VaccinationORM)
        .join(PetORM)
        .filter(
            PetORM.user_id == current_user.id,
            VaccinationORM.next_due_date.between(today, end_date),
        )
        .all()
    )

    reminders = []
    for v in vaccinations:
        days_until_due = (v.next_due_date - today).days
        is_overdue = v.next_due_date < today

        reminders.append(
            VaccinationReminder(
                vaccination_id=v.id,
                pet_id=v.pet_id,
                pet_name=v.pet.name,
                vaccine_name=v.vaccine_name,
                due_date=v.next_due_date,
                days_until_due=days_until_due,
                is_overdue=is_overdue,
            )
        )

    return reminders


@router.get("/overdue", response_model=List[VaccinationReminder])
def get_overdue_vaccinations(
    db: Session = Depends(get_db), current_user: UserORM = Depends(get_current_user)
):
    """Get overdue vaccinations for all user's pets"""
    today = date.today()

    # Get all overdue vaccinations for user's pets
    vaccinations = (
        db.query(VaccinationORM)
        .join(PetORM)
        .filter(PetORM.user_id == current_user.id, VaccinationORM.next_due_date < today)
        .all()
    )

    reminders = []
    for v in vaccinations:
        days_until_due = (v.next_due_date - today).days  # Will be negative

        reminders.append(
            VaccinationReminder(
                vaccination_id=v.id,
                pet_id=v.pet_id,
                pet_name=v.pet.name,
                vaccine_name=v.vaccine_name,
                due_date=v.next_due_date,
                days_until_due=days_until_due,
                is_overdue=True,
            )
        )

    return reminders


@router.get("/all", response_model=List[VaccinationResponse])
def get_all_vaccinations(
    db: Session = Depends(get_db), current_user: UserORM = Depends(get_current_user)
):
    """Get all vaccinations for all user's pets"""
    # Get all vaccinations for user's pets
    vaccinations = (
        db.query(VaccinationORM)
        .join(PetORM)
        .filter(PetORM.user_id == current_user.id)
        .order_by(VaccinationORM.date_administered.desc())
        .all()
    )

    return [VaccinationResponse.model_validate(v) for v in vaccinations]
