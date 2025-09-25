import os
from pathlib import Path

# Configuration
SECRET_KEY = "pawfectpal_secret_key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours instead of 1 hour

# Database configuration
# Smart auto-detection for seamless deployment
def get_database_url():
    """
    Automatically detect the best database configuration:
    1. Railway production: Use environment variable
    2. Local development: Use Railway CLI environment
    3. Future users: Just works out of the box
    """
    # Check if we're in Railway production
    if os.getenv("RAILWAY_ENVIRONMENT"):
        return os.getenv("DATABASE_URL", "sqlite:///./pawfectpal.db")
    
    # Check if user has set their own DATABASE_URL
    user_db_url = os.getenv("DATABASE_URL")
    if user_db_url:
        return user_db_url
    
    # Default: Use Railway PostgreSQL for seamless experience
    # This ensures all data is in one place and works out of the box
    return "postgresql://postgres:uplqoudioeTMCIeFaRvbabQIcvQgImkX@ballast.proxy.rlwy.net:38565/railway"

DATABASE_URL = get_database_url()

# File upload configuration
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
IMAGES_DIR = UPLOAD_DIR / "images"
IMAGES_DIR.mkdir(exist_ok=True)
