#!/usr/bin/env python3
"""
Insert fake providers into the existing users table
This script connects to the SQLite database and inserts provider data into the users table
"""

import sqlite3
import json
import random
from datetime import datetime

def insert_provider_into_users(cursor, provider_data):
    """Insert a single provider into the users table"""
    cursor.execute('''
        INSERT OR REPLACE INTO users (
            id, username, hashed_password, is_active, email, phone, full_name, profile_image,
            is_provider, provider_services, provider_rating, provider_bio, provider_hourly_rate,
            address, city, state, country, postal_code, latitude, longitude
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        provider_data['id'],
        provider_data['username'],
        'hashed_password_demo',  # Demo password hash
        True,  # is_active
        provider_data['email'],
        provider_data['phone'],
        provider_data['full_name'],
        provider_data['profile_image'],
        True,  # is_provider
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
        provider_data['location']['longitude']
    ))

def main():
    """Insert providers into the users table"""
    print("🐾 Inserting providers into users table...")
    
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
        
        # Check if users table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
        if not cursor.fetchone():
            print("❌ Users table not found. Please run the backend migrations first.")
            return
        
        print("✅ Users table found")
        
        # Insert each provider
        for provider in providers:
            insert_provider_into_users(cursor, provider)
            print(f"✅ Inserted provider: {provider['full_name']} ({provider['provider_services'][0]})")
        
        # Commit the changes
        conn.commit()
        print(f"\n🎉 Successfully inserted {len(providers)} providers into the users table!")
        
        # Verify the insertion
        cursor.execute("SELECT COUNT(*) FROM users WHERE is_provider = 1")
        count = cursor.fetchone()[0]
        print(f"📊 Total providers in database: {count}")
        
        # Show sample data
        cursor.execute("SELECT full_name, provider_services, provider_rating FROM users WHERE is_provider = 1 LIMIT 3")
        samples = cursor.fetchall()
        print("\n🎯 Sample providers:")
        for sample in samples:
            print(f"  {sample[0]} - {sample[1]} - Rating: {sample[2]}")
        
    except sqlite3.Error as e:
        print(f"❌ Database error: {e}")
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    main()
