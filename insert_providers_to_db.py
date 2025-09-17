#!/usr/bin/env python3
"""
Insert fake providers into the actual database
This script connects to the SQLite database and inserts provider data
"""

import sqlite3
import json
import random
from datetime import datetime

def create_providers_table(cursor):
    """Create providers table if it doesn't exist"""
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS providers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            full_name TEXT,
            email TEXT,
            phone TEXT,
            profile_image TEXT,
            is_provider BOOLEAN DEFAULT 1,
            provider_services TEXT,  -- JSON array
            provider_rating REAL,
            provider_bio TEXT,
            provider_hourly_rate REAL,
            address TEXT,
            city TEXT,
            state TEXT,
            country TEXT,
            postal_code TEXT,
            latitude REAL,
            longitude REAL,
            distance_km REAL,
            is_available BOOLEAN DEFAULT 1,
            languages TEXT,  -- JSON array
            experience_years INTEGER,
            response_time_minutes INTEGER,
            completed_bookings INTEGER,
            last_online TEXT,
            verified BOOLEAN DEFAULT 0,
            reviews_count INTEGER,
            average_rating REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

def insert_provider(cursor, provider_data):
    """Insert a single provider into the database"""
    cursor.execute('''
        INSERT OR REPLACE INTO providers (
            id, username, full_name, email, phone, profile_image, is_provider,
            provider_services, provider_rating, provider_bio, provider_hourly_rate,
            address, city, state, country, postal_code, latitude, longitude,
            distance_km, is_available, languages, experience_years,
            response_time_minutes, completed_bookings, last_online, verified,
            reviews_count, average_rating
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        provider_data['id'],
        provider_data['username'],
        provider_data['full_name'],
        provider_data['email'],
        provider_data['phone'],
        provider_data['profile_image'],
        provider_data['is_provider'],
        json.dumps(provider_data['provider_services']),
        provider_data['provider_rating'],
        provider_data['provider_bio'],
        provider_data['provider_hourly_rate'],
        provider_data['address'],
        provider_data['city'],
        provider_data['state'],
        provider_data['country'],
        provider_data['postal_code'],
        provider_data['location']['latitude'],
        provider_data['location']['longitude'],
        provider_data['distance_km'],
        provider_data['is_available'],
        json.dumps(provider_data['languages']),
        provider_data['experience_years'],
        provider_data['response_time_minutes'],
        provider_data['completed_bookings'],
        provider_data['last_online'],
        provider_data['verified'],
        provider_data['reviews_count'],
        provider_data['average_rating']
    ))

def main():
    """Insert providers into the database"""
    print("🐾 Inserting providers into database...")
    
    # Load the corrected providers data
    try:
        with open('corrected_fake_providers.json', 'r', encoding='utf-8') as f:
            providers = json.load(f)
    except FileNotFoundError:
        print("❌ corrected_fake_providers.json not found. Please run generate_corrected_providers.py first.")
        return
    
    # Connect to the database
    db_path = 'backend/pawfectpal.db'
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Create the providers table
        create_providers_table(cursor)
        print("✅ Providers table created/verified")
        
        # Insert each provider
        for provider in providers:
            insert_provider(cursor, provider)
            print(f"✅ Inserted provider: {provider['full_name']} ({provider['provider_services'][0]})")
        
        # Commit the changes
        conn.commit()
        print(f"\n🎉 Successfully inserted {len(providers)} providers into the database!")
        
        # Verify the insertion
        cursor.execute("SELECT COUNT(*) FROM providers")
        count = cursor.fetchone()[0]
        print(f"📊 Total providers in database: {count}")
        
    except sqlite3.Error as e:
        print(f"❌ Database error: {e}")
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    main()
