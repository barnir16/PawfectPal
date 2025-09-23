from fastapi import UploadFile
import shutil


def save_upload_file(upload_file: UploadFile, destination: str) -> str:
    """Save uploaded file and return file path"""
    try:
        with open(destination, "wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)
        return str(destination)
    finally:
        upload_file.file.close()
