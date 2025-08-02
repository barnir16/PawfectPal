from fastapi import Depends, APIRouter
from sqlalchemy.orm import Session
from typing import List
from models import (
    TaskORM,
    UserORM,
    list_to_str,
    str_to_list,
    json_to_list,
    list_to_json,
)
from schemas import TaskCreate, TaskRead
from datetime import datetime
from dependencies.db import get_db
from dependencies.auth import get_current_user

router = APIRouter(prefix="/task", tags=["task"])


@router.get("/", response_model=List[TaskRead])
def get_tasks(
    db: Session = Depends(get_db), current_user: UserORM = Depends(get_current_user)
):
    """Get all tasks for the authenticated user"""
    tasks = db.query(TaskORM).filter(TaskORM.user_id == current_user.id).all()
    return [
        TaskRead(
            id=t.id,
            title=t.title,
            description=t.description,
            dateTime=t.dateTime.isoformat() if t.dateTime else None,
            repeatInterval=t.repeatInterval,
            repeatUnit=t.repeatUnit,
            petIds=[int(pid) for pid in str_to_list(t.petIds)] if t.petIds else [],
            attachments=json_to_list(t.attachments),
        )
        for t in tasks
    ]


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
        dateTime=datetime.fromisoformat(task.dateTime) if task.dateTime else None,
        repeatInterval=task.repeatInterval,
        repeatUnit=task.repeatUnit,
        petIds=list_to_str([str(pid) for pid in task.petIds]) if task.petIds else None,
        attachments=list_to_json(task.attachments),
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return TaskRead(
        id=db_task.id,
        title=db_task.title,
        description=db_task.description,
        dateTime=db_task.dateTime.isoformat() if db_task.dateTime else None,
        repeatInterval=db_task.repeatInterval,
        repeatUnit=db_task.repeatUnit,
        petIds=[int(pid) for pid in str_to_list(db_task.petIds)]
        if db_task.petIds
        else [],
        attachments=json_to_list(db_task.attachments),
    )
