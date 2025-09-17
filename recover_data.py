#!/usr/bin/env python3
"""
Recover the data by fixing user IDs and relationships
"""

import sqlite3
import os

def recover_data():
    """Fix the data relationships"""
    db_path = 'backend/pawfectpal.db'
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("🔧 Recovering data...")
        print("=" * 50)
        
        # First, let's see what we have
        cursor.execute("SELECT id, username, full_name, is_provider FROM users WHERE username = 'barnir16';")
        original_user = cursor.fetchone()
        
        if not original_user:
            print("❌ Original user not found!")
            return
        
        print(f"✅ Found original user: {original_user}")
        
        # Check what data exists
        cursor.execute("SELECT COUNT(*) FROM pets;")
        pet_count = cursor.fetchone()[0]
        print(f"🐾 Pets found: {pet_count}")
        
        cursor.execute("SELECT COUNT(*) FROM tasks;")
        task_count = cursor.fetchone()[0]
        print(f"📋 Tasks found: {task_count}")
        
        cursor.execute("SELECT COUNT(*) FROM vaccinations;")
        vax_count = cursor.fetchone()[0]
        print(f"💉 Vaccinations found: {vax_count}")
        
        cursor.execute("SELECT COUNT(*) FROM weight_records;")
        weight_count = cursor.fetchone()[0]
        print(f"⚖️ Weight records found: {weight_count}")
        
        print("\n🔧 Starting data recovery...")
        
        # Step 1: Move all providers to higher IDs (starting from 100)
        print("1. Moving providers to higher IDs...")
        cursor.execute("UPDATE users SET id = id + 100 WHERE is_provider = 1;")
        print("   ✅ Providers moved to IDs 101-115")
        
        # Step 2: Move original user to ID 1
        print("2. Moving original user to ID 1...")
        cursor.execute("UPDATE users SET id = 1 WHERE username = 'barnir16';")
        print("   ✅ Original user moved to ID 1")
        
        # Step 3: Update all foreign key references
        print("3. Updating pet user_id references...")
        cursor.execute("UPDATE pets SET user_id = 1 WHERE user_id > 15;")
        print("   ✅ Pet user_id references updated")
        
        print("4. Updating task user_id references...")
        cursor.execute("UPDATE tasks SET user_id = 1 WHERE user_id > 15;")
        print("   ✅ Task user_id references updated")
        
        # Step 4: Update pet IDs to be sequential
        print("5. Updating pet IDs...")
        cursor.execute("SELECT id FROM pets ORDER BY id;")
        pet_ids = [row[0] for row in cursor.fetchall()]
        for i, old_id in enumerate(pet_ids, 1):
            cursor.execute("UPDATE pets SET id = ? WHERE id = ?", (i, old_id))
        print(f"   ✅ Pet IDs updated to 1-{len(pet_ids)}")
        
        # Step 5: Update vaccination pet_id references
        print("6. Updating vaccination pet_id references...")
        cursor.execute("UPDATE vaccinations SET pet_id = 1 WHERE pet_id > 15;")
        print("   ✅ Vaccination pet_id references updated")
        
        # Step 6: Update weight record pet_id references
        print("7. Updating weight record pet_id references...")
        cursor.execute("UPDATE weight_records SET pet_id = 1 WHERE pet_id > 15;")
        print("   ✅ Weight record pet_id references updated")
        
        # Commit all changes
        conn.commit()
        print("\n✅ Data recovery completed!")
        
        # Verify the fix
        print("\n🔍 Verifying recovery...")
        cursor.execute("SELECT id, username, full_name, is_provider FROM users WHERE id = 1;")
        user = cursor.fetchone()
        print(f"👤 User 1: {user}")
        
        cursor.execute("SELECT COUNT(*) FROM pets WHERE user_id = 1;")
        pet_count = cursor.fetchone()[0]
        print(f"🐾 Pets for user 1: {pet_count}")
        
        cursor.execute("SELECT COUNT(*) FROM tasks WHERE user_id = 1;")
        task_count = cursor.fetchone()[0]
        print(f"📋 Tasks for user 1: {task_count}")
        
        cursor.execute("SELECT COUNT(*) FROM vaccinations WHERE pet_id = 1;")
        vax_count = cursor.fetchone()[0]
        print(f"💉 Vaccinations for pet 1: {vax_count}")
        
        cursor.execute("SELECT COUNT(*) FROM weight_records WHERE pet_id = 1;")
        weight_count = cursor.fetchone()[0]
        print(f"⚖️ Weight records for pet 1: {weight_count}")
        
        print("\n🎉 Data recovery successful!")
        
    except sqlite3.Error as e:
        print(f"❌ Database error: {e}")
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    recover_data()
