#!/usr/bin/env python3
"""
Diagnose what happened to the pet data
"""

import sqlite3
import os

def diagnose_issue():
    """Check what happened to the data"""
    db_path = 'backend/pawfectpal.db'
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("🔍 Diagnosing data issue...")
        print("=" * 50)
        
        # Check users table
        cursor.execute("SELECT id, username, full_name, is_provider FROM users ORDER BY id;")
        users = cursor.fetchall()
        print("👥 All users:")
        for user in users:
            print(f"   ID: {user[0]}, Username: {user[1]}, Name: {user[2]}, Provider: {user[3]}")
        
        print()
        
        # Check pets table
        cursor.execute("SELECT id, user_id, name, type FROM pets;")
        pets = cursor.fetchall()
        print("🐾 Pets:")
        for pet in pets:
            print(f"   ID: {pet[0]}, User ID: {pet[1]}, Name: {pet[2]}, Type: {pet[3]}")
        
        print()
        
        # Check tasks table
        cursor.execute("SELECT id, user_id, title FROM tasks;")
        tasks = cursor.fetchall()
        print("📋 Tasks:")
        for task in tasks:
            print(f"   ID: {task[0]}, User ID: {task[1]}, Title: {task[2]}")
        
        print()
        
        # Check vaccinations table
        cursor.execute("SELECT id, pet_id, vaccine_name FROM vaccinations LIMIT 5;")
        vaccinations = cursor.fetchall()
        print("💉 Vaccinations (first 5):")
        for vax in vaccinations:
            print(f"   ID: {vax[0]}, Pet ID: {vax[1]}, Vaccine: {vax[2]}")
        
        print()
        
        # Check weight_records table
        cursor.execute("SELECT id, pet_id, weight FROM weight_records LIMIT 5;")
        weights = cursor.fetchall()
        print("⚖️ Weight Records (first 5):")
        for weight in weights:
            print(f"   ID: {weight[0]}, Pet ID: {weight[1]}, Weight: {weight[2]}")
        
        print()
        print("🔍 Analysis:")
        
        # Find the original user
        original_user = None
        for user in users:
            if user[1] == 'barnir16':
                original_user = user
                break
        
        if original_user:
            print(f"✅ Original user found: ID {original_user[0]}")
            
            # Check if pets belong to original user
            cursor.execute("SELECT COUNT(*) FROM pets WHERE user_id = ?", (original_user[0],))
            pet_count = cursor.fetchone()[0]
            print(f"🐾 Pets belonging to original user: {pet_count}")
            
            # Check if tasks belong to original user
            cursor.execute("SELECT COUNT(*) FROM tasks WHERE user_id = ?", (original_user[0],))
            task_count = cursor.fetchone()[0]
            print(f"📋 Tasks belonging to original user: {task_count}")
            
        else:
            print("❌ Original user not found!")
        
    except sqlite3.Error as e:
        print(f"❌ Database error: {e}")
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    diagnose_issue()
