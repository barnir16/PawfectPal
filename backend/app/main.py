import logging
import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.routers import (
    chat,
    enhanced_provider_profiles,
    enhanced_provider_reviews,
    image_upload,
    location,
    marketplace_posts,
    medical_record,
    pet,
    provider,
    references,
    service,
    service_requests,
    task,
    user,
    vaccination,
    weight_goal,
    weight_record,
)
from config import CORS_ORIGINS

logger = logging.getLogger(__name__)


try:
    from app.routers import ai_simple as ai

    AI_AVAILABLE = True
except Exception as exc:
    logger.warning("AI router import failed: %s", exc)
    AI_AVAILABLE = False


if os.getenv("RUN_MIGRATIONS_ON_STARTUP", "false").lower() == "true":
    try:
        from alembic import command
        from alembic.config import Config

        logger.info("Running migrations on startup")
        alembic_cfg = Config("alembic.ini")
        command.upgrade(alembic_cfg, "head")
        logger.info("Migrations completed successfully")
    except Exception:
        logger.exception("Migration failed during startup")


app = FastAPI(
    title="PawfectPal API",
    description=(
        "Comprehensive pet care management API with GPS tracking, image upload, "
        "and service booking"
    ),
    version="1.1.1",
)


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "message": "PawfectPal API is running",
        "version": "1.1.1",
        "environment": os.getenv("RAILWAY_ENVIRONMENT_NAME", "development"),
    }


@app.get("/test")
def test_endpoint():
    return {
        "message": "PawfectPal API test endpoint",
        "version": "1.1.1",
        "environment": os.getenv("RAILWAY_ENVIRONMENT_NAME", "development"),
    }


@app.get("/railway-test")
def railway_test():
    return {
        "status": "Railway deployment active",
        "version": "1.1.1",
        "environment": os.getenv("RAILWAY_ENVIRONMENT_NAME", "development"),
    }


app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,
)


app.include_router(user.router)
app.include_router(user.user_router)
app.include_router(pet.router)
app.include_router(medical_record.router)
app.include_router(vaccination.router)
app.include_router(references.vaccines_router)
app.include_router(references.age_router)
app.include_router(references.breeds_router)
app.include_router(location.router)
app.include_router(image_upload.router)
app.include_router(service.router)
app.include_router(task.router)
app.include_router(weight_record.router)
app.include_router(weight_goal.router)

if AI_AVAILABLE:
    app.include_router(ai.router)
else:
    logger.warning("AI router skipped because it could not be imported")

try:
    from app.routers import ai_conversations

    app.include_router(ai_conversations.router)
except Exception as exc:
    logger.warning("AI conversations router not available: %s", exc)

app.include_router(provider.router)
app.include_router(service_requests.router)
app.include_router(chat.router)

try:
    from app.websocket.chat_router import router as websocket_chat_router

    app.include_router(websocket_chat_router)
except Exception as exc:
    logger.warning("WebSocket chat router not available: %s", exc)

app.include_router(marketplace_posts.router)
app.include_router(enhanced_provider_profiles.router)
app.include_router(enhanced_provider_reviews.router)


uploads_path = Path("uploads").absolute()
uploads_path.mkdir(parents=True, exist_ok=True)
logger.info("Serving uploaded files from %s", uploads_path)

app.mount("/uploads", StaticFiles(directory=str(uploads_path)), name="uploads")


@app.get("/test-image/{filename}")
def test_image(filename: str):
    image_path = uploads_path / "images" / filename
    return {
        "filename": filename,
        "path": str(image_path),
        "exists": image_path.exists(),
        "is_file": image_path.is_file(),
        "size": image_path.stat().st_size if image_path.exists() else 0,
        "url": f"/uploads/images/{filename}",
    }


@app.get("/")
def read_root():
    return {
        "message": "Welcome to PawfectPal API",
        "version": "1.1.1",
        "features": [
            "Pet Management",
            "Task Scheduling",
            "GPS Tracking",
            "Image Upload",
            "Service Booking",
            "Vaccine Tracking",
            "Weight Tracking",
            "AI Assistant",
            "Marketplace Posts",
            "Enhanced Provider Profiles",
            "Provider Reviews",
            "Service Matching",
        ],
    }
