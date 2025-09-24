from fastapi import FastAPI
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
    ai_simple as ai,
    provider,
    service_requests,
    chat,
)


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
        "version": "1.0.2",
        "firebase_fixed": True,
        "deployment_time": "2025-01-21T23:30:00Z"
    }

@app.get("/test")
def test_endpoint():
    return {
        "message": "This is the NEW version with Firebase fixes!",
        "version": "1.0.3",
        "firebase_status": "disabled_but_working",
        "railway_detection": "FORCE_REDEPLOY_2025_01_21"
    }

@app.get("/railway-test")
def railway_test():
    return {
        "status": "Railway is using NEW code!",
        "timestamp": "2025-01-21T23:45:00Z",
        "version": "1.0.3"
    }

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    allow_origin_regex=r"https?://.*",
    expose_headers=["*"],
    max_age=3600,
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
app.include_router(ai.router)
app.include_router(provider.router)
app.include_router(service_requests.router)
app.include_router(chat.router)


@app.get("/")
def read_root():
    """API root endpoint"""
    return {
        "message": "Welcome to PawfectPal API",
        "version": "1.0.0",
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
