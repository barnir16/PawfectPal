#!/usr/bin/env python3
import sqlite3
import os
from datetime import datetime, timedelta
import random

def add_weight_variations():
    """Add sample weight records for each pet with variations over time"""
    db_path = "pawfectpal.db"
    
    # Check if database exists
    if not os.path.exists(db_path):
        print("❌ Database not found. Please run the main application first.")
        return False
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get all pets
        cursor.execute("SELECT id, name, weight_kg, weight_unit FROM pets")
        pets = cursor.fetchall()
        
        if not pets:
            print("❌ No pets found in database.")
            return False
        
        print(f"✅ Found {len(pets)} pets in database.")
        
        # Check if weight_records table exists
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='weight_records'
        """)
        
        if not cursor.fetchone():
            print("❌ weight_records table not found. Please create it first.")
            return False
        
        # Get current date
        today = datetime.now()
        
        for pet_id, pet_name, current_weight, weight_unit in pets:
            print(f"\n🐕 Processing pet: {pet_name} (ID: {pet_id})")
            
            if not current_weight:
                print(f"   ⚠️  No current weight for {pet_name}, skipping...")
                continue
            
            # Check if pet already has weight records
            cursor.execute("SELECT COUNT(*) FROM weight_records WHERE pet_id = ?", (pet_id,))
            existing_count = cursor.fetchone()[0]
            
            if existing_count > 0:
                print(f"   ℹ️  Pet {pet_name} already has {existing_count} weight records")
                continue
            
            # Create 6 weight records with variations
            base_weight = current_weight
            dates = []
            
            # Generate dates: today, 14 days ago, 28 days ago, etc.
            for i in range(6):
                date = today - timedelta(days=i * 14)
                dates.append(date)
            
            # Reverse dates so oldest comes first
            dates.reverse()
            
            print(f"   📊 Adding {len(dates)} weight records for {pet_name}")
            
            for i, date in enumerate(dates):
                # Add variation: ±1 kg for dogs, ±0.5 kg for cats
                variation_range = 1.0 if "dog" in pet_name.lower() else 0.5
                variation = random.uniform(-variation_range, variation_range)
                
                # Ensure weight doesn't go below 0.5 kg
                weight = max(0.5, base_weight + variation)
                
                # Round to 2 decimal places
                weight = round(weight, 2)
                
                # Insert weight record
                cursor.execute("""
                    INSERT INTO weight_records (pet_id, weight, weight_unit, date, notes, source, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    pet_id,
                    weight,
                    weight_unit,
                    date.strftime('%Y-%m-%d'),
                    f'Sample weight record {i+1}/6',
                    'auto',
                    date.strftime('%Y-%m-%d %H:%M:%S'),
                    date.strftime('%Y-%m-%d %H:%M:%S')
                ))
                
                print(f"      📅 {date.strftime('%Y-%m-%d')}: {weight} {weight_unit}")
            
            print(f"   ✅ Added weight records for {pet_name}")
        
        conn.commit()
        print(f"\n🎉 Successfully added weight variations for all pets!")
        
        # Show summary
        cursor.execute("SELECT COUNT(*) FROM weight_records")
        total_records = cursor.fetchone()[0]
        print(f"📊 Total weight records in database: {total_records}")
        
        return True
        
    except sqlite3.Error as e:
        print(f"❌ Error adding weight variations: {e}")
        return False
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    print("🚀 Starting weight variations addition...")
    success = add_weight_variations()
    if success:
        print("✅ Weight variations added successfully!")
    else:
        print("❌ Failed to add weight variations.")
