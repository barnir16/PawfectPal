#!/usr/bin/env python3
import sqlite3
import os
from datetime import datetime, timedelta
import random

def add_sample_vaccines():
    """Add sample vaccine data for pets"""
    db_path = "pawfectpal.db"
    
    if not os.path.exists(db_path):
        print("❌ Database not found.")
        return False
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if vaccinations table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='vaccinations'")
        if not cursor.fetchone():
            print("❌ vaccinations table not found.")
            return False
        
        # Get all pets
        cursor.execute("SELECT id, name, breed_type FROM pets")
        pets = cursor.fetchall()
        
        if not pets:
            print("❌ No pets found.")
            return False
        
        print(f"✅ Found {len(pets)} pets")
        
        # Common vaccines for dogs and cats
        dog_vaccines = [
            ("Rabies", 1, 3),  # name, first_dose_age_weeks, boosters
            ("DHPP", 6, 3),
            ("Bordetella", 8, 1),
            ("Lyme", 12, 1)
        ]
        
        cat_vaccines = [
            ("Rabies", 8, 1),
            ("FVRCP", 6, 3),
            ("FeLV", 8, 2)
        ]
        
        today = datetime.now()
        
        for pet_id, pet_name, pet_type in pets:
            print(f"\n🐕 Processing {pet_name} ({pet_type})")
            
            # Check if pet already has vaccines
            cursor.execute("SELECT COUNT(*) FROM vaccinations WHERE pet_id = ?", (pet_id,))
            existing_count = cursor.fetchone()[0]
            
            if existing_count > 0:
                print(f"   ℹ️  Already has {existing_count} vaccines")
                continue
            
            # Select vaccines based on pet type
            vaccines = dog_vaccines if pet_type.lower() == 'dog' else cat_vaccines
            
            for vaccine_name, first_dose_age, num_boosters in vaccines:
                # Calculate dates
                first_dose_date = today - timedelta(days=random.randint(30, 180))  # 1-6 months ago
                
                # Add vaccine record
                cursor.execute("""
                    INSERT INTO vaccinations (
                        pet_id, vaccine_name, date_administered, 
                        next_due_date, veterinarian, clinic, notes, 
                        is_completed, reminder_sent, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    pet_id,
                    vaccine_name,
                    first_dose_date.strftime('%Y-%m-%d'),
                    (first_dose_date + timedelta(days=365)).strftime('%Y-%m-%d'),  # Due in 1 year
                    "Dr. Smith",
                    "City Veterinary Clinic",
                    f"First dose administered at {first_dose_age} weeks",
                    True,
                    False,
                    first_dose_date.strftime('%Y-%m-%d %H:%M:%S'),
                    first_dose_date.strftime('%Y-%m-%d %H:%M:%S')
                ))
                
                print(f"   💉 Added {vaccine_name}")
                
                # Add booster doses if needed
                for booster_num in range(1, num_boosters + 1):
                    booster_date = first_dose_date + timedelta(weeks=booster_num * 4)  # Every 4 weeks
                    
                    cursor.execute("""
                        INSERT INTO vaccinations (
                            pet_id, vaccine_name, date_administered, 
                            next_due_date, veterinarian, clinic, notes, 
                            is_completed, reminder_sent, created_at, updated_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        pet_id,
                        vaccine_name,
                        booster_date.strftime('%Y-%m-%d'),
                        (booster_date + timedelta(days=365)).strftime('%Y-%m-%d'),
                        "Dr. Smith",
                        "City Veterinary Clinic",
                        f"Booster dose #{booster_num}",
                        True,
                        False,
                        booster_date.strftime('%Y-%m-%d %H:%M:%S'),
                        booster_date.strftime('%Y-%m-%d %H:%M:%S')
                    ))
                    
                    print(f"      💉 Added {vaccine_name} booster #{booster_num}")
        
        conn.commit()
        print(f"\n🎉 Successfully added sample vaccines!")
        
        # Show summary
        cursor.execute("SELECT COUNT(*) FROM vaccinations")
        total_vaccines = cursor.fetchone()[0]
        print(f"💉 Total vaccinations in database: {total_vaccines}")
        
        return True
        
    except sqlite3.Error as e:
        print(f"❌ Error: {e}")
        return False
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    print("🚀 Starting sample vaccine addition...")
    success = add_sample_vaccines()
    if success:
        print("✅ Sample vaccines added successfully!")
    else:
        print("❌ Failed to add sample vaccines.")
