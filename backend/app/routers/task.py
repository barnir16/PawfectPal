from fastapi import Depends, APIRouter, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.models import (
    TaskORM,
    UserORM,
)
from app.schemas import TaskCreate, TaskRead, TaskUpdate
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/task", tags=["task"])


@router.get("/", response_model=List[TaskRead])
def get_tasks(
    db: Session = Depends(get_db), current_user: UserORM = Depends(get_current_user)
):
    """Get all tasks for the authenticated user"""
    tasks = db.query(TaskORM).filter(TaskORM.user_id == current_user.id).all()
    return [TaskRead.model_validate(t) for t in tasks]


@router.post("/", response_model=TaskRead)
def create_task(
    task: TaskCreate,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Create a new task"""
    db_task = TaskORM(
        user_id=current_user.id,
        title=task.title,
        description=task.description,
        date_time=task.date_time,
        repeat_interval=task.repeat_interval,
        repeat_unit=task.repeat_unit,
        repeat_end_date=task.repeat_end_date,
        pet_ids=task.pet_ids,
        attachments=task.attachments,
        priority=task.priority or "medium",
        status=task.status or "pending",
        is_completed=task.is_completed or False,
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return TaskRead.model_validate(db_task)


@router.get("/{task_id}/", response_model=TaskRead)
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Get a specific task by ID"""
    db_task = (
        db.query(TaskORM)
        .filter(TaskORM.id == task_id, TaskORM.user_id == current_user.id)
        .first()
    )
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    return TaskRead.model_validate(db_task)


@router.put("/{task_id}/", response_model=TaskRead)
def update_task(
    task_id: int,
    task: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Update an existing task"""
    db_task = (
        db.query(TaskORM)
        .filter(TaskORM.id == task_id, TaskORM.user_id == current_user.id)
        .first()
    )
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Update fields
    if task.title is not None:
        db_task.title = task.title
    if task.description is not None:
        db_task.description = task.description
    if task.date_time is not None:
        db_task.date_time = task.date_time
    if task.repeat_interval is not None:
        db_task.repeat_interval = task.repeat_interval
    if task.repeat_unit is not None:
        db_task.repeat_unit = task.repeat_unit
    if task.repeat_end_date is not None:
        db_task.repeat_end_date = task.repeat_end_date
    if task.pet_ids is not None:
        db_task.pet_ids = task.pet_ids
    if task.attachments is not None:
        db_task.attachments = task.attachments
    if task.priority is not None:
        db_task.priority = task.priority
    if task.status is not None:
        db_task.status = task.status
    if task.is_completed is not None:
        db_task.is_completed = task.is_completed

    db.commit()
    db.refresh(db_task)
    return TaskRead.model_validate(db_task)


@router.delete("/{task_id}/")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Delete a task"""
    db_task = (
        db.query(TaskORM)
        .filter(TaskORM.id == task_id, TaskORM.user_id == current_user.id)
        .first()
    )
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")

    db.delete(db_task)
    db.commit()
    return {"message": "Task deleted successfully"}
