#!/usr/bin/env python3
"""
Database Migration Script: Local SQLite to Railway
This script migrates data from local SQLite to Railway backend via API calls.
Run this once, then delete the file.
"""

import sqlite3
import requests
import json
import os
from datetime import datetime

# Configuration
LOCAL_DB_PATH = "backend/pawfectpal.db"
RAILWAY_API_URL = "https://pawfectpal-production.up.railway.app"

def get_local_data():
    """Extract data from local SQLite database"""
    print("🔍 Connecting to local database...")
    
    if not os.path.exists(LOCAL_DB_PATH):
        print(f"❌ Local database not found at {LOCAL_DB_PATH}")
        return None
    
    conn = sqlite3.connect(LOCAL_DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Get all tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [row[0] for row in cursor.fetchall()]
        print(f"📊 Found tables: {tables}")
        
        data = {}
        
        # Extract users
        cursor.execute("SELECT * FROM users")
        users = cursor.fetchall()
        data['users'] = users
        print(f"👥 Found {len(users)} users")
        
        # Extract pets
        cursor.execute("SELECT * FROM pets")
        pets = cursor.fetchall()
        data['pets'] = pets
        print(f"🐕 Found {len(pets)} pets")
        
        # Extract tasks
        cursor.execute("SELECT * FROM tasks")
        tasks = cursor.fetchall()
        data['tasks'] = tasks
        print(f"📋 Found {len(tasks)} tasks")
        
        # Extract vaccinations
        cursor.execute("SELECT * FROM vaccinations")
        vaccinations = cursor.fetchall()
        data['vaccinations'] = vaccinations
        print(f"💉 Found {len(vaccinations)} vaccinations")
        
        # Extract weight_records
        cursor.execute("SELECT * FROM weight_records")
        weight_records = cursor.fetchall()
        data['weight_records'] = weight_records
        print(f"⚖️ Found {len(weight_records)} weight records")
        
        # Extract medical_records
        cursor.execute("SELECT * FROM medical_records")
        medical_records = cursor.fetchall()
        data['medical_records'] = medical_records
        print(f"🏥 Found {len(medical_records)} medical records")
        
        return data
        
    except Exception as e:
        print(f"❌ Error extracting data: {e}")
        return None
    finally:
        conn.close()

def create_user_on_railway(user_data):
    """Create user on Railway backend"""
    try:
        # Extract user data (adjust based on your UserORM schema)
        user_id, username, email, hashed_password, name, phone, address, created_at, updated_at = user_data
        
        user_payload = {
            "username": username,
            "email": email,
            "password": "temp_password_123",  # Temporary password
            "name": name,
            "phone": phone,
            "address": address
        }
        
        response = requests.post(f"{RAILWAY_API_URL}/users/register", json=user_payload)
        
        if response.status_code == 201:
            print(f"✅ Created user: {username}")
            return response.json()
        else:
            print(f"❌ Failed to create user {username}: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error creating user: {e}")
        return None

def create_pet_on_railway(pet_data, user_id):
    """Create pet on Railway backend"""
    try:
        # Extract pet data (adjust based on your PetORM schema)
        pet_id, user_id_local, name, pet_type, breed, age, weight, color, gender, description, created_at, updated_at = pet_data
        
        pet_payload = {
            "name": name,
            "pet_type": pet_type,
            "breed": breed,
            "age": age,
            "weight": weight,
            "color": color,
            "gender": gender,
            "description": description
        }
        
        response = requests.post(f"{RAILWAY_API_URL}/pets", json=pet_payload)
        
        if response.status_code == 201:
            print(f"✅ Created pet: {name}")
            return response.json()
        else:
            print(f"❌ Failed to create pet {name}: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error creating pet: {e}")
        return None

def create_task_on_railway(task_data, user_id):
    """Create task on Railway backend"""
    try:
        # Extract task data (adjust based on your TaskORM schema)
        task_id, user_id_local, title, description, due_date, priority, status, created_at, updated_at = task_data
        
        task_payload = {
            "title": title,
            "description": description,
            "due_date": due_date,
            "priority": priority,
            "status": status
        }
        
        response = requests.post(f"{RAILWAY_API_URL}/task", json=task_payload)
        
        if response.status_code == 201:
            print(f"✅ Created task: {title}")
            return response.json()
        else:
            print(f"❌ Failed to create task {title}: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error creating task: {e}")
        return None

def main():
    """Main migration function"""
    print("🚀 Starting database migration to Railway...")
    print(f"📡 Railway API URL: {RAILWAY_API_URL}")
    
    # Extract local data
    local_data = get_local_data()
    if not local_data:
        print("❌ No data to migrate")
        return
    
    print("\n📤 Starting migration...")
    
    # Create users first
    user_mapping = {}  # Map old user IDs to new user IDs
    for user_data in local_data['users']:
        new_user = create_user_on_railway(user_data)
        if new_user:
            old_user_id = user_data[0]
            new_user_id = new_user['id']
            user_mapping[old_user_id] = new_user_id
            print(f"🔄 Mapped user {old_user_id} -> {new_user_id}")
    
    # Create pets
    for pet_data in local_data['pets']:
        old_user_id = pet_data[1]  # user_id is second column
        if old_user_id in user_mapping:
            new_user_id = user_mapping[old_user_id]
            create_pet_on_railway(pet_data, new_user_id)
    
    # Create tasks
    for task_data in local_data['tasks']:
        old_user_id = task_data[1]  # user_id is second column
        if old_user_id in user_mapping:
            new_user_id = user_mapping[old_user_id]
            create_task_on_railway(task_data, new_user_id)
    
    print("\n✅ Migration completed!")
    print("📝 Note: You'll need to update passwords manually in the Railway app")
    print("🗑️ You can now delete this migration script")

if __name__ == "__main__":
    main()
