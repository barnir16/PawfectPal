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


# image_upload.py
@router.post("/profile-image")
async def upload_profile_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Upload user profile image"""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    if file.filename is None:
        raise ValueError("File path cannot be None")

    try:
        file_extension = Path(file.filename).suffix
        filename = f"user_{current_user.id}_{uuid.uuid4()}{file_extension}"
        file_path = IMAGES_DIR / filename

        # 1. Check if the directory exists and has permissions
        if not IMAGES_DIR.exists():
            print(f"Error: IMAGES_DIR does not exist at {IMAGES_DIR}. Creating...")
            IMAGES_DIR.mkdir(parents=True, exist_ok=True)

        # 2. Log the file save process
        print(f"Saving file to: {file_path}")
        save_upload_file(file, str(file_path))
        print(f"File saved successfully.")

        # 3. Log the database update process
        old_profile_image = current_user.profile_image
        new_profile_image_url = f"/uploads/images/{filename}"
        current_user.profile_image = new_profile_image_url
        print(
            f"User {current_user.id}'s profile_image changed from '{old_profile_image}' to '{new_profile_image_url}'"
        )

        # 4. Commit the changes and log
        db.commit()
        print("Database commit successful.")

        db.refresh(current_user)  # Refresh the object from the database

        return {
            "message": "Profile image uploaded successfully",
            "profile_image": current_user.profile_image,
        }

    except Exception as e:
        # If any error occurs, rollback the database session
        db.rollback()
        print(f"An error occurred during image upload: {e}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {e}")


@router.post("/chat-attachment")
async def upload_chat_attachment(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """Upload chat attachment (image)"""
    print(f"📁 Chat attachment upload - User: {current_user.id}")
    print(f"📁 File received: {file.filename}, Content-Type: {file.content_type}")
    
    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        print(f"❌ Invalid file type: {file.content_type}")
        raise HTTPException(status_code=400, detail="File must be an image")
    
    if file.filename is None:
        print("❌ No filename provided")
        raise ValueError("File path cannot be None")
    
    try:
        # Generate unique filename
        file_extension = Path(file.filename).suffix
        filename = f"chat_{current_user.id}_{uuid.uuid4()}{file_extension}"
        file_path = IMAGES_DIR / filename
        
        # Ensure directory exists
        if not IMAGES_DIR.exists():
            IMAGES_DIR.mkdir(parents=True, exist_ok=True)
        
        # Save file
        save_upload_file(file, str(file_path))
        
        # Return file info for chat message with full URL
        file_url = f"https://pawfectpal-production.up.railway.app/uploads/images/{filename}"
        
        return {
            "id": str(uuid.uuid4()),  # Generate unique ID for attachment
            "file_name": file.filename,
            "file_url": file_url,
            "file_type": file.content_type,
            "file_size": file.size if hasattr(file, 'size') else 0,
            "created_at": "2024-01-01T00:00:00Z"  # Will be set by frontend
        }
        
    except Exception as e:
        print(f"Error uploading chat attachment: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {e}")


@router.post("/test-upload")
async def test_upload(
    file: UploadFile = File(...),
    current_user: UserORM = Depends(get_current_user),
):
    """Test endpoint for file upload debugging"""
    print(f"🧪 Test upload - User: {current_user.id}")
    print(f"🧪 File received: {file.filename}, Content-Type: {file.content_type}")
    print(f"🧪 File size: {file.size if hasattr(file, 'size') else 'unknown'}")
    
    return {
        "message": "Test upload successful",
        "filename": file.filename,
        "content_type": file.content_type,
        "size": file.size if hasattr(file, 'size') else 0
    }