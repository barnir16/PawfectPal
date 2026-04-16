import logging
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.dependencies.auth import get_current_user
from app.dependencies.db import get_db
from app.models import PetORM, TaskORM, UserORM, json_to_list, list_to_json
from app.utils.file_upload import save_upload_file
from config import IMAGES_DIR

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/image_upload", tags=["image_upload"])


def _ensure_images_dir():
    if not IMAGES_DIR.exists():
        logger.info("Creating image upload directory at %s", IMAGES_DIR)
        IMAGES_DIR.mkdir(parents=True, exist_ok=True)


def _validate_image_upload(file: UploadFile):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    if file.filename is None:
        raise ValueError("File path cannot be None")


def _relative_upload_path(filename: str) -> str:
    return f"/uploads/images/{filename}"


@router.post("/pet-image/{pet_id}")
async def upload_pet_image(
    pet_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Upload a pet image."""
    pet = (
        db.query(PetORM)
        .filter(PetORM.id == pet_id, PetORM.user_id == current_user.id)
        .first()
    )
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    _validate_image_upload(file)
    _ensure_images_dir()

    file_extension = Path(file.filename).suffix
    filename = f"pet_{pet_id}_{uuid.uuid4()}{file_extension}"
    file_path = IMAGES_DIR / filename

    save_upload_file(file, str(file_path))

    pet.photoUri = _relative_upload_path(filename)
    db.commit()

    return {"message": "Image uploaded successfully", "file_path": pet.photoUri}


@router.post("/task-attachment/{task_id}")
async def upload_task_attachment(
    task_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Upload a task attachment."""
    task = (
        db.query(TaskORM)
        .filter(TaskORM.id == task_id, TaskORM.user_id == current_user.id)
        .first()
    )
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    _validate_image_upload(file)
    _ensure_images_dir()

    file_extension = Path(file.filename).suffix
    filename = f"task_{task_id}_{uuid.uuid4()}{file_extension}"
    file_path = IMAGES_DIR / filename

    save_upload_file(file, str(file_path))

    current_attachments = json_to_list(task.attachments)
    current_attachments.append(_relative_upload_path(filename))
    task.attachments = list_to_json(current_attachments)
    db.commit()

    return {
        "message": "Attachment uploaded successfully",
        "file_path": _relative_upload_path(filename),
    }


@router.post("/profile-image")
async def upload_profile_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Upload a user profile image."""
    _validate_image_upload(file)

    try:
        _ensure_images_dir()

        file_extension = Path(file.filename).suffix
        filename = f"user_{current_user.id}_{uuid.uuid4()}{file_extension}"
        file_path = IMAGES_DIR / filename

        save_upload_file(file, str(file_path))

        current_user.profile_image = _relative_upload_path(filename)
        db.commit()
        db.refresh(current_user)

        return {
            "message": "Profile image uploaded successfully",
            "profile_image": current_user.profile_image,
        }
    except Exception:
        db.rollback()
        logger.exception("Failed to upload profile image for user %s", current_user.id)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/chat-attachment")
async def upload_chat_attachment(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Upload a chat attachment image."""
    del db
    _validate_image_upload(file)

    try:
        _ensure_images_dir()

        file_extension = Path(file.filename).suffix
        filename = f"chat_{current_user.id}_{uuid.uuid4()}{file_extension}"
        file_path = IMAGES_DIR / filename

        save_upload_file(file, str(file_path))
        file_url = _relative_upload_path(filename)

        return {
            "id": str(uuid.uuid4()),
            "file_name": file.filename,
            "file_url": file_url,
            "file_type": file.content_type,
            "file_size": file.size if hasattr(file, "size") else 0,
            "created_at": "2024-01-01T00:00:00Z",
        }
    except Exception:
        logger.exception("Failed to upload chat attachment for user %s", current_user.id)
        raise HTTPException(status_code=500, detail="Failed to upload file")


@router.post("/test-upload")
async def test_upload(
    file: UploadFile = File(...),
    current_user: UserORM = Depends(get_current_user),
):
    """Lightweight upload diagnostic endpoint."""
    _validate_image_upload(file)

    return {
        "message": "Test upload successful",
        "filename": file.filename,
        "content_type": file.content_type,
        "size": file.size if hasattr(file, "size") else 0,
        "user_id": current_user.id,
    }
