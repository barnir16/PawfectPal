from fastapi import Depends, APIRouter
from sqlalchemy.orm import Session
from typing import List
from models import (
    TaskORM,
    UserORM,
)
from schemas import TaskCreate, TaskRead
from dependencies.db import get_db
from dependencies.auth import get_current_user

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
        pet_ids=task.pet_ids,
        attachments=task.attachments,
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return TaskRead.model_validate(db_task)
