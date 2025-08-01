from fastapi import HTTPException, Depends, UploadFile, File, APIRouter
from sqlalchemy.orm import Session
from models import (
    PetORM,
    TaskORM,
    UserORM,
    json_to_list,
    list_to_json,
)
from pathlib import Path
import uuid
from dependencies.db import get_db
from dependencies.auth import get_current_user
from utils.file_upload import save_upload_file
from config import IMAGES_DIR

router = APIRouter(prefix="/image_upload", tags=["image_upload"])


@router.post("/pet-image/{pet_id}")
async def upload_pet_image(
    pet_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Upload pet image"""
    # Verify pet belongs to user
    pet = (
        db.query(PetORM)
        .filter(PetORM.id == pet_id, PetORM.user_id == current_user.id)
        .first()
    )
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    # Generate unique filename
    if file.filename is None:
        raise ValueError("File path cannot be None")

    file_extension = Path(file.filename).suffix
    filename = f"pet_{pet_id}_{uuid.uuid4()}{file_extension}"
    file_path = IMAGES_DIR / filename

    # Save file
    save_upload_file(file, str(file_path))

    # Update pet's photo URI
    pet.photoUri = f"/uploads/images/{filename}"
    db.commit()

    return {"message": "Image uploaded successfully", "file_path": pet.photoUri}


@router.post("/task-attachment/{task_id}")
async def upload_task_attachment(
    task_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Upload task attachment"""
    # Verify task belongs to user
    task = (
        db.query(TaskORM)
        .filter(TaskORM.id == task_id, TaskORM.user_id == current_user.id)
        .first()
    )
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    if file.filename is None:
        raise ValueError("File path cannot be None")

    # Generate unique filename
    file_extension = Path(file.filename).suffix
    filename = f"task_{task_id}_{uuid.uuid4()}{file_extension}"
    file_path = IMAGES_DIR / filename

    # Save file
    save_upload_file(file, str(file_path))

    # Update task attachments
    current_attachments = json_to_list(task.attachments)
    current_attachments.append(f"/uploads/images/{filename}")
    task.attachments = list_to_json(current_attachments)
    db.commit()

    return {
        "message": "Attachment uploaded successfully",
        "file_path": f"/uploads/images/{filename}",
    }
