from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import List, Optional
from models import (
    Pet, PetORM, Task, TaskORM, Vaccine, VaccineORM, AgeRestriction, AgeRestrictionORM,
    Service, ServiceORM, LocationHistory, LocationHistoryORM, ServiceType, ServiceStatus,
    UserORM, User, UserCreate, list_to_str, str_to_list, json_to_list, list_to_json
)
from database import SessionLocal, engine
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
import os
import shutil
from pathlib import Path
import uuid

# Configuration
SECRET_KEY = "pawfectpal_secret_key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# File upload configuration
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
IMAGES_DIR = UPLOAD_DIR / "images"
IMAGES_DIR.mkdir(exist_ok=True)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/token")

# Helper functions
def get_password_hash(password: str):
    """Hash password using bcrypt"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str):
    """Verify password against hash"""
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_user_by_username(db: Session, username: str):
    """Get user by username"""
    return db.query(UserORM).filter(UserORM.username == username).first()

def save_upload_file(upload_file: UploadFile, destination: str) -> str:
    """Save uploaded file and return file path"""
    try:
        with open(destination, "wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)
        return str(destination)
    finally:
        upload_file.file.close()

app = FastAPI(
    title="PawfectPal API",
    description="Comprehensive pet care management API with GPS tracking, image upload, and service booking",
    version="1.0.0"
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

def get_db():
    """Database dependency"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/register", response_model=User)
def register(user: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    db_user = get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = get_password_hash(user.password)
    db_user = UserORM(
        username=user.username, 
        hashed_password=hashed_password,
        email=user.email,
        full_name=user.full_name
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return User(
        id=db_user.id, 
        username=db_user.username, 
        is_active=db_user.is_active,
        email=db_user.email,
        full_name=db_user.full_name
    )

@app.post("/token")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Login user and return access token"""
    user = get_user_by_username(db, username=form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Get current authenticated user"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = get_user_by_username(db, username=username)
    if user is None:
        raise credentials_exception
    return user

# --- Pet Endpoints ---
@app.get("/pets", response_model=List[Pet])
def get_pets(db: Session = Depends(get_db), current_user: UserORM = Depends(get_current_user)):
    """Get all pets for the authenticated user"""
    pets = db.query(PetORM).filter(PetORM.user_id == current_user.id).all()
    return [Pet(
        id=p.id,
        name=p.name,
        breedType=p.breedType,
        breed=p.breed,
        birthDate=p.birthDate.isoformat() if p.birthDate else None,
        age=p.age,
        isBirthdayGiven=bool(p.isBirthdayGiven),
        weightKg=p.weightKg,
        photoUri=p.photoUri,
        healthIssues=str_to_list(p.healthIssues),
        behaviorIssues=str_to_list(p.behaviorIssues),
        lastKnownLatitude=p.lastKnownLatitude,
        lastKnownLongitude=p.lastKnownLongitude,
        lastLocationUpdate=p.lastLocationUpdate.isoformat() if p.lastLocationUpdate else None,
        isTrackingEnabled=p.isTrackingEnabled,
    ) for p in pets]

@app.post("/pets", response_model=Pet)
def create_pet(pet: Pet, db: Session = Depends(get_db), current_user: UserORM = Depends(get_current_user)):
    """Create a new pet"""
    db_pet = PetORM(
        user_id=current_user.id,
        name=pet.name,
        breedType=pet.breedType,
        breed=pet.breed,
        birthDate=datetime.fromisoformat(pet.birthDate).date() if pet.birthDate else None,
        age=pet.age,
        isBirthdayGiven=int(pet.isBirthdayGiven),
        weightKg=pet.weightKg,
        photoUri=pet.photoUri,
        healthIssues=list_to_str(pet.healthIssues),
        behaviorIssues=list_to_str(pet.behaviorIssues),
        lastKnownLatitude=pet.lastKnownLatitude,
        lastKnownLongitude=pet.lastKnownLongitude,
        lastLocationUpdate=datetime.fromisoformat(pet.lastLocationUpdate) if pet.lastLocationUpdate else None,
        isTrackingEnabled=pet.isTrackingEnabled,
    )
    db.add(db_pet)
    db.commit()
    db.refresh(db_pet)
    return Pet(
        id=db_pet.id,
        name=db_pet.name,
        breedType=db_pet.breedType,
        breed=db_pet.breed,
        birthDate=db_pet.birthDate.isoformat() if db_pet.birthDate else None,
        age=db_pet.age,
        isBirthdayGiven=bool(db_pet.isBirthdayGiven),
        weightKg=db_pet.weightKg,
        photoUri=db_pet.photoUri,
        healthIssues=str_to_list(db_pet.healthIssues),
        behaviorIssues=str_to_list(db_pet.behaviorIssues),
        lastKnownLatitude=db_pet.lastKnownLatitude,
        lastKnownLongitude=db_pet.lastKnownLongitude,
        lastLocationUpdate=db_pet.lastLocationUpdate.isoformat() if db_pet.lastLocationUpdate else None,
        isTrackingEnabled=db_pet.isTrackingEnabled,
    )

@app.put("/pets/{pet_id}", response_model=Pet)
def update_pet(pet_id: int, pet: Pet, db: Session = Depends(get_db), current_user: UserORM = Depends(get_current_user)):
    """Update an existing pet"""
    db_pet = db.query(PetORM).filter(PetORM.id == pet_id, PetORM.user_id == current_user.id).first()
    if not db_pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    db_pet.name = pet.name
    db_pet.breedType = pet.breedType
    db_pet.breed = pet.breed
    db_pet.birthDate = datetime.fromisoformat(pet.birthDate).date() if pet.birthDate else None
    db_pet.age = pet.age
    db_pet.isBirthdayGiven = int(pet.isBirthdayGiven)
    db_pet.weightKg = pet.weightKg
    db_pet.photoUri = pet.photoUri
    db_pet.healthIssues = list_to_str(pet.healthIssues)
    db_pet.behaviorIssues = list_to_str(pet.behaviorIssues)
    db_pet.lastKnownLatitude = pet.lastKnownLatitude
    db_pet.lastKnownLongitude = pet.lastKnownLongitude
    db_pet.lastLocationUpdate = datetime.fromisoformat(pet.lastLocationUpdate) if pet.lastLocationUpdate else None
    db_pet.isTrackingEnabled = pet.isTrackingEnabled
    
    db.commit()
    db.refresh(db_pet)
    return Pet(
        id=db_pet.id,
        name=db_pet.name,
        breedType=db_pet.breedType,
        breed=db_pet.breed,
        birthDate=db_pet.birthDate.isoformat() if db_pet.birthDate else None,
        age=db_pet.age,
        isBirthdayGiven=bool(db_pet.isBirthdayGiven),
        weightKg=db_pet.weightKg,
        photoUri=db_pet.photoUri,
        healthIssues=str_to_list(db_pet.healthIssues),
        behaviorIssues=str_to_list(db_pet.behaviorIssues),
        lastKnownLatitude=db_pet.lastKnownLatitude,
        lastKnownLongitude=db_pet.lastKnownLongitude,
        lastLocationUpdate=db_pet.lastLocationUpdate.isoformat() if db_pet.lastLocationUpdate else None,
        isTrackingEnabled=db_pet.isTrackingEnabled,
    )

@app.delete("/pets/{pet_id}")
def delete_pet(pet_id: int, db: Session = Depends(get_db), current_user: UserORM = Depends(get_current_user)):
    """Delete a pet"""
    db_pet = db.query(PetORM).filter(PetORM.id == pet_id, PetORM.user_id == current_user.id).first()
    if not db_pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    db.delete(db_pet)
    db.commit()
    return {"message": "Pet deleted successfully"}

# --- GPS Tracking Endpoints ---
@app.post("/pets/{pet_id}/location", response_model=LocationHistory)
def update_pet_location(
    pet_id: int, 
    location: LocationHistory, 
    db: Session = Depends(get_db), 
    current_user: UserORM = Depends(get_current_user)
):
    """Update pet's GPS location"""
    # Verify pet belongs to user
    pet = db.query(PetORM).filter(PetORM.id == pet_id, PetORM.user_id == current_user.id).first()
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    # Create location history entry
    db_location = LocationHistoryORM(
        pet_id=pet_id,
        latitude=location.latitude,
        longitude=location.longitude,
        timestamp=datetime.fromisoformat(location.timestamp),
        accuracy=location.accuracy,
        speed=location.speed,
        altitude=location.altitude,
    )
    db.add(db_location)
    
    # Update pet's last known location
    pet.lastKnownLatitude = location.latitude
    pet.lastKnownLongitude = location.longitude
    pet.lastLocationUpdate = datetime.fromisoformat(location.timestamp)
    
    db.commit()
    db.refresh(db_location)
    
    return LocationHistory(
        id=db_location.id,
        pet_id=db_location.pet_id,
        latitude=db_location.latitude,
        longitude=db_location.longitude,
        timestamp=db_location.timestamp.isoformat(),
        accuracy=db_location.accuracy,
        speed=db_location.speed,
        altitude=db_location.altitude,
    )

@app.get("/pets/{pet_id}/location-history", response_model=List[LocationHistory])
def get_pet_location_history(
    pet_id: int, 
    limit: int = 100,
    db: Session = Depends(get_db), 
    current_user: UserORM = Depends(get_current_user)
):
    """Get pet's location history"""
    # Verify pet belongs to user
    pet = db.query(PetORM).filter(PetORM.id == pet_id, PetORM.user_id == current_user.id).first()
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    locations = db.query(LocationHistoryORM).filter(
        LocationHistoryORM.pet_id == pet_id
    ).order_by(LocationHistoryORM.timestamp.desc()).limit(limit).all()
    
    return [LocationHistory(
        id=loc.id,
        pet_id=loc.pet_id,
        latitude=loc.latitude,
        longitude=loc.longitude,
        timestamp=loc.timestamp.isoformat(),
        accuracy=loc.accuracy,
        speed=loc.speed,
        altitude=loc.altitude,
    ) for loc in locations]

# --- Image Upload Endpoints ---
@app.post("/upload/pet-image/{pet_id}")
async def upload_pet_image(
    pet_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user)
):
    """Upload pet image"""
    # Verify pet belongs to user
    pet = db.query(PetORM).filter(PetORM.id == pet_id, PetORM.user_id == current_user.id).first()
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Generate unique filename
    file_extension = Path(file.filename).suffix
    filename = f"pet_{pet_id}_{uuid.uuid4()}{file_extension}"
    file_path = IMAGES_DIR / filename
    
    # Save file
    save_upload_file(file, str(file_path))
    
    # Update pet's photo URI
    pet.photoUri = f"/uploads/images/{filename}"
    db.commit()
    
    return {"message": "Image uploaded successfully", "file_path": pet.photoUri}

@app.post("/upload/task-attachment/{task_id}")
async def upload_task_attachment(
    task_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user)
):
    """Upload task attachment"""
    # Verify task belongs to user
    task = db.query(TaskORM).filter(TaskORM.id == task_id, TaskORM.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
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
    
    return {"message": "Attachment uploaded successfully", "file_path": f"/uploads/images/{filename}"}

# --- Service Booking Endpoints ---
@app.get("/services", response_model=List[Service])
def get_services(db: Session = Depends(get_db), current_user: UserORM = Depends(get_current_user)):
    """Get all services for the authenticated user"""
    services = db.query(ServiceORM).filter(ServiceORM.user_id == current_user.id).all()
    return [Service(
        id=s.id,
        pet_id=s.pet_id,
        service_type=s.service_type,
        status=s.status,
        start_datetime=s.start_datetime.isoformat(),
        end_datetime=s.end_datetime.isoformat() if s.end_datetime else None,
        duration_hours=s.duration_hours,
        price=s.price,
        currency=s.currency,
        pickup_address=s.pickup_address,
        dropoff_address=s.dropoff_address,
        pickup_latitude=s.pickup_latitude,
        pickup_longitude=s.pickup_longitude,
        dropoff_latitude=s.dropoff_latitude,
        dropoff_longitude=s.dropoff_longitude,
        provider_id=s.provider_id,
        provider_notes=s.provider_notes,
        customer_notes=s.customer_notes,
        before_images=json_to_list(s.before_images),
        after_images=json_to_list(s.after_images),
        service_report=s.service_report,
    ) for s in services]

@app.post("/services", response_model=Service)
def create_service(service: Service, db: Session = Depends(get_db), current_user: UserORM = Depends(get_current_user)):
    """Create a new service booking"""
    # Verify pet belongs to user
    pet = db.query(PetORM).filter(PetORM.id == service.pet_id, PetORM.user_id == current_user.id).first()
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    db_service = ServiceORM(
        user_id=current_user.id,
        pet_id=service.pet_id,
        service_type=service.service_type,
        status=service.status,
        start_datetime=datetime.fromisoformat(service.start_datetime),
        end_datetime=datetime.fromisoformat(service.end_datetime) if service.end_datetime else None,
        duration_hours=service.duration_hours,
        price=service.price,
        currency=service.currency,
        pickup_address=service.pickup_address,
        dropoff_address=service.dropoff_address,
        pickup_latitude=service.pickup_latitude,
        pickup_longitude=service.pickup_longitude,
        dropoff_latitude=service.dropoff_latitude,
        dropoff_longitude=service.dropoff_longitude,
        provider_id=service.provider_id,
        provider_notes=service.provider_notes,
        customer_notes=service.customer_notes,
        before_images=list_to_json(service.before_images),
        after_images=list_to_json(service.after_images),
        service_report=service.service_report,
    )
    db.add(db_service)
    db.commit()
    db.refresh(db_service)
    
    return Service(
        id=db_service.id,
        pet_id=db_service.pet_id,
        service_type=db_service.service_type,
        status=db_service.status,
        start_datetime=db_service.start_datetime.isoformat(),
        end_datetime=db_service.end_datetime.isoformat() if db_service.end_datetime else None,
        duration_hours=db_service.duration_hours,
        price=db_service.price,
        currency=db_service.currency,
        pickup_address=db_service.pickup_address,
        dropoff_address=db_service.dropoff_address,
        pickup_latitude=db_service.pickup_latitude,
        pickup_longitude=db_service.pickup_longitude,
        dropoff_latitude=db_service.dropoff_latitude,
        dropoff_longitude=db_service.dropoff_longitude,
        provider_id=db_service.provider_id,
        provider_notes=db_service.provider_notes,
        customer_notes=db_service.customer_notes,
        before_images=json_to_list(db_service.before_images),
        after_images=json_to_list(db_service.after_images),
        service_report=db_service.service_report,
    )

# --- Task Endpoints (Updated with attachments) ---
@app.get("/tasks", response_model=List[Task])
def get_tasks(db: Session = Depends(get_db), current_user: UserORM = Depends(get_current_user)):
    """Get all tasks for the authenticated user"""
    tasks = db.query(TaskORM).filter(TaskORM.user_id == current_user.id).all()
    return [Task(
        id=t.id,
        title=t.title,
        description=t.description,
        dateTime=t.dateTime.isoformat() if t.dateTime else None,
        repeatInterval=t.repeatInterval,
        repeatUnit=t.repeatUnit,
        petIds=[int(pid) for pid in str_to_list(t.petIds)] if t.petIds else [],
        attachments=json_to_list(t.attachments),
    ) for t in tasks]

@app.post("/tasks", response_model=Task)
def create_task(task: Task, db: Session = Depends(get_db), current_user: UserORM = Depends(get_current_user)):
    """Create a new task"""
    db_task = TaskORM(
        user_id=current_user.id,
        title=task.title,
        description=task.description,
        dateTime=datetime.fromisoformat(task.dateTime),
        repeatInterval=task.repeatInterval,
        repeatUnit=task.repeatUnit,
        petIds=list_to_str([str(pid) for pid in task.petIds]) if task.petIds else None,
        attachments=list_to_json(task.attachments),
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return Task(
        id=db_task.id,
        title=db_task.title,
        description=db_task.description,
        dateTime=db_task.dateTime.isoformat() if db_task.dateTime else None,
        repeatInterval=db_task.repeatInterval,
        repeatUnit=db_task.repeatUnit,
        petIds=[int(pid) for pid in str_to_list(db_task.petIds)] if db_task.petIds else [],
        attachments=json_to_list(db_task.attachments),
    )

# --- Existing endpoints (Vaccines, Age Restrictions) ---
@app.get("/vaccines", response_model=List[Vaccine])
def get_vaccines(db: Session = Depends(get_db)):
    """Get all vaccines"""
    vaccines = db.query(VaccineORM).all()
    return [Vaccine(
        name=v.name,
        frequency=v.frequency,
        firstDoseAge=v.firstDoseAge,
        kittenSchedule=str_to_list(v.kittenSchedule) if v.kittenSchedule else None,
        puppySchedule=str_to_list(v.puppySchedule) if v.puppySchedule else None,
        description=v.description,
        sideEffects=str_to_list(v.sideEffects) if v.sideEffects else None,
        ageRestriction=AgeRestriction(
            minWeeks=v.ageRestriction.minWeeks,
            maxYears=v.ageRestriction.maxYears,
        ) if v.ageRestriction else None,
        lastUpdated=v.lastUpdated,
        commonTreatments=str_to_list(v.commonTreatments) if v.commonTreatments else None,
    ) for v in vaccines]

@app.get("/age_restrictions", response_model=List[AgeRestriction])
def get_age_restrictions(db: Session = Depends(get_db)):
    """Get all age restrictions"""
    restrictions = db.query(AgeRestrictionORM).all()
    return [AgeRestriction(
        minWeeks=r.minWeeks,
        maxYears=r.maxYears,
    ) for r in restrictions]

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
            "AI Assistant"
        ]
    } 