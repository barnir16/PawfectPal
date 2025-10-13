#!/usr/bin/env python3
"""
Add trainer service type to the database
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.service_type import ServiceTypeORM
from config import DATABASE_URL

def add_trainer_service():
    """Add trainer service type to the database"""
    
    # Create database connection
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Check if trainer service already exists
        existing_trainer = db.query(ServiceTypeORM).filter(
            ServiceTypeORM.name == "Training"
        ).first()
        
        if existing_trainer:
            print("✅ Trainer service type already exists")
            return
        
        # Add trainer service type
        trainer_service = ServiceTypeORM(
            name="Training",
            description="Professional dog training services including obedience, behavior modification, and specialized training"
        )
        
        db.add(trainer_service)
        db.commit()
        
        print("✅ Successfully added 'Training' service type")
        
        # Also add Hebrew version
        hebrew_trainer = ServiceTypeORM(
            name="אילוף",
            description="שירותי אילוף כלבים מקצועיים כולל ציות, שינוי התנהגות ואילוף מיוחד"
        )
        
        db.add(hebrew_trainer)
        db.commit()
        
        print("✅ Successfully added 'אילוף' service type")
        
        # List all service types
        all_services = db.query(ServiceTypeORM).all()
        print(f"\n📋 All service types ({len(all_services)}):")
        for service in all_services:
            print(f"  - {service.name}: {service.description}")
            
    except Exception as e:
        print(f"❌ Error adding trainer service: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    add_trainer_service()
