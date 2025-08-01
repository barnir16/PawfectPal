from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from routers import pet, auth, references, gps, image_upload, service_booking, task


app = FastAPI(
    title="PawfectPal API",
    description="Comprehensive pet care management API with GPS tracking, image upload, and service booking",
    version="1.0.0",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files (uploaded images)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


app.include_router(pet.router)
app.include_router(auth.router)
app.include_router(references.vaccines_router)
app.include_router(references.age_router)
app.include_router(gps.router)
app.include_router(image_upload.router)
app.include_router(service_booking.router)
app.include_router(task.router)


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
            "AI Assistant",
        ],
    }
