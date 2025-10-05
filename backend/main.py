from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from routers import (
    pet,
    references,
    image_upload,
    task,
    location,
    service,
    user,
    medical_record,
    vaccination,
    weight_record,
    weight_goal,
    provider,
    service_requests,
    chat,
)

# Import AI router conditionally to avoid startup errors
try:
    from routers import ai_simple as ai
    AI_AVAILABLE = True
    print("AI router imported successfully")
except Exception as e:
    print(f"AI router import failed: {e}")
    print(f"Error type: {type(e).__name__}")
    import traceback
    print(f"Full traceback: {traceback.format_exc()}")
    AI_AVAILABLE = False


app = FastAPI(
    title="PawfectPal API",
    description="Comprehensive pet care management API with GPS tracking, image upload, and service booking",
    version="1.0.0",
)

# Health check endpoint for Railway
@app.get("/health")
def health_check():
    return {
        "status": "healthy", 
        "message": "PawfectPal API is running", 
        "version": "1.1.0",
        "firebase_fixed": True,
        "cors_fixed": True,
        "deployment_time": "2025-01-21T23:58:00Z",
        "chat_fixed": True,
        "db_schema_fixed": True,
        "sqlalchemy_reserved_word_fixed": True,
        "db_column_mismatch_fixed": True
    }

@app.get("/test")
def test_endpoint():
    return {
        "message": "This is the NEW version with Firebase fixes!",
        "version": "1.1.0",
        "firebase_status": "disabled_but_working",
        "cors_status": "simple_clean_fix",
        "railway_detection": "FORCE_REDEPLOY_2025_01_21"
    }

@app.get("/railway-test")
def railway_test():
    return {
        "status": "Railway is using NEW code!",
        "timestamp": "2025-01-21T23:58:00Z",
        "version": "1.1.0",
        "cors_fix": "simple_clean"
    }

# Enhanced CORS configuration for Railway
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://pawfectpal-production-2f07.up.railway.app",
        "https://pawfectpal-production.up.railway.app",
        "http://localhost:3000",
        "http://localhost:5173",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
)

# Serve static files (uploaded images)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include auth routes first (from user.py router with /auth prefix)
app.include_router(user.router)
# Include user routes (from user.py user_router with /users prefix)
app.include_router(user.user_router)

# Include all other routers
app.include_router(pet.router)
app.include_router(medical_record.router)
app.include_router(vaccination.router)
app.include_router(references.vaccines_router)
app.include_router(references.age_router)
app.include_router(location.router)
app.include_router(image_upload.router)
app.include_router(service.router)
app.include_router(task.router)
app.include_router(weight_record.router)
app.include_router(weight_goal.router)
if AI_AVAILABLE:
    app.include_router(ai.router)
    print("✅ AI router included")
else:
    print("⚠️ AI router skipped due to configuration issues")

# Import and include AI conversations router
try:
    from routers import ai_conversations
    app.include_router(ai_conversations.router)
    print("✅ AI conversations router included")
except Exception as e:
    print(f"⚠️ AI conversations router not available: {e}")
app.include_router(provider.router)
app.include_router(service_requests.router)
app.include_router(chat.router)


# Mount static files for image serving
from pathlib import Path
import os

# Get the absolute path to uploads directory
uploads_path = Path("uploads").absolute()
print(f"📁 Static files path: {uploads_path}")
print(f"📁 Directory exists: {uploads_path.exists()}")
print(f"📁 Directory contents: {list(uploads_path.iterdir()) if uploads_path.exists() else 'Directory not found'}")

app.mount("/uploads", StaticFiles(directory=str(uploads_path)), name="uploads")

# Test endpoint to verify image serving
@app.get("/test-image/{filename}")
def test_image(filename: str):
    """Test endpoint to verify image serving"""
    image_path = uploads_path / "images" / filename
    return {
        "filename": filename,
        "path": str(image_path),
        "exists": image_path.exists(),
        "is_file": image_path.is_file(),
        "size": image_path.stat().st_size if image_path.exists() else 0,
        "url": f"https://pawfectpal-production.up.railway.app/uploads/images/{filename}"
    }

@app.get("/")
def read_root():
    """API root endpoint"""
    return {
        "message": "Welcome to PawfectPal API",
        "version": "1.1.0",
        "features": [
            "Pet Management",
            "Task Scheduling",
            "GPS Tracking",
            "Image Upload",
            "Service Booking",
            "Vaccine Tracking",
            "Weight Tracking",
            "AI Assistant",
        ],
    }