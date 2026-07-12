import os
from pathlib import Path

# Security
ENVIRONMENT = os.getenv("ENVIRONMENT", "development").lower()
IS_TEST_ENV = os.getenv("TEST_ENV") == "1" or ENVIRONMENT == "test"

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    if IS_TEST_ENV:
        SECRET_KEY = "test-secret-key"
    else:
        raise RuntimeError("SECRET_KEY is required")

ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
ALLOW_INSECURE_GOOGLE_AUTH = (
    os.getenv("ALLOW_INSECURE_GOOGLE_AUTH", "false").lower() == "true"
)


def get_cors_origins():
    raw_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000")
    return [origin.strip() for origin in raw_origins.split(",") if origin.strip()]


CORS_ORIGINS = get_cors_origins()


# --- Database Configuration ---
def get_database_url():
    """
    Automatically choose the correct database for the environment:
    1. TEST_DB_URL — only when running pytest
    2. RAILWAY_ENVIRONMENT — production on Railway
    3. DATABASE_URL — custom local or external DB
    4. Default — local SQLite fallback
    """
    # ✅ Priority 1: Use test database only if pytest is running
    if os.getenv("TEST_ENV") == "1":
        test_db = os.getenv("TEST_DB_URL")
        if test_db:
            return test_db

    # ✅ Priority 2: Railway production
    if os.getenv("RAILWAY_ENVIRONMENT"):
        return os.getenv("DATABASE_URL", "sqlite:///./pawfectpal.db")

    # ✅ Priority 3: Local / custom DB
    db_url = os.getenv("DATABASE_URL")
    if db_url:
        return db_url

    # ✅ Priority 4: Default fallback
    return "sqlite:///./pawfectpal.db"


DATABASE_URL = get_database_url()

# --- File Upload Config ---
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
IMAGES_DIR = UPLOAD_DIR / "images"
IMAGES_DIR.mkdir(exist_ok=True)
