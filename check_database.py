#!/usr/bin/env python3
"""
Check database state to see what data exists
"""

import sqlite3
import os

def check_database():
    """Check what's in the database"""
    db_path = 'backend/pawfectpal.db'
    
    if not os.path.exists(db_path):
        print("❌ Database file not found!")
        return
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("🔍 Checking database state...")
        print("=" * 50)
        
        # Get all tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        print(f"📋 Tables in database: {[table[0] for table in tables]}")
        print()
        
        # Check each important table
        important_tables = ['users', 'pets', 'tasks', 'vaccinations', 'weight_records', 'medical_records']
        
        for table in important_tables:
            try:
                cursor.execute(f"SELECT COUNT(*) FROM {table};")
                count = cursor.fetchone()[0]
                print(f"📊 {table}: {count} records")
                
                # Show sample data for users and pets
                if table in ['users', 'pets'] and count > 0:
                    cursor.execute(f"SELECT * FROM {table} LIMIT 3;")
                    samples = cursor.fetchall()
                    print(f"   Sample data: {samples}")
                    
            except sqlite3.Error as e:
                print(f"❌ Error checking {table}: {e}")
        
        print()
        print("🔍 Checking for provider users...")
        cursor.execute("SELECT COUNT(*) FROM users WHERE is_provider = 1;")
        provider_count = cursor.fetchone()[0]
        print(f"👥 Provider users: {provider_count}")
        
        if provider_count > 0:
            cursor.execute("SELECT id, username, full_name, provider_services FROM users WHERE is_provider = 1 LIMIT 5;")
            providers = cursor.fetchall()
            print("   Sample providers:")
            for provider in providers:
                print(f"     ID: {provider[0]}, Name: {provider[2]}, Services: {provider[3]}")
        
        print()
        print("🔍 Checking for regular users...")
        cursor.execute("SELECT COUNT(*) FROM users WHERE is_provider = 0 OR is_provider IS NULL;")
        user_count = cursor.fetchone()[0]
        print(f"👤 Regular users: {user_count}")
        
        if user_count > 0:
            cursor.execute("SELECT id, username, full_name FROM users WHERE is_provider = 0 OR is_provider IS NULL LIMIT 5;")
            users = cursor.fetchall()
            print("   Sample users:")
            for user in users:
                print(f"     ID: {user[0]}, Username: {user[1]}, Name: {user[2]}")
        
    except sqlite3.Error as e:
        print(f"❌ Database error: {e}")
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    check_database()
