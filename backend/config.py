import os
from pathlib import Path

# Configuration
SECRET_KEY = "pawfectpal_secret_key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours instead of 1 hour

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./pawfectpal.db")

# File upload configuration
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
IMAGES_DIR = UPLOAD_DIR / "images"
IMAGES_DIR.mkdir(exist_ok=True)
