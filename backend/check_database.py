#!/usr/bin/env python3
import sqlite3

def check_database():
    """Check database structure and data"""
    try:
        conn = sqlite3.connect('pawfectpal.db')
        cursor = conn.cursor()
        
        # Check all tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchall()
        print("📋 All tables in database:")
        for table in tables:
            print(f"  - {table[0]}")
        
        print("\n" + "="*50)
        
        # Check pets
        cursor.execute("SELECT id, name, breed_type, breed, weight_kg, weight_unit FROM pets")
        pets = cursor.fetchall()
        print(f"🐕 Pets ({len(pets)} total):")
        for pet in pets:
            print(f"  ID {pet[0]}: {pet[1]} ({pet[2]} - {pet[3]}) - {pet[4]} {pet[5]}")
        
        print("\n" + "="*50)
        
        # Check weight records
        cursor.execute("SELECT COUNT(*) FROM weight_records")
        weight_count = cursor.fetchone()[0]
        print(f"⚖️ Weight records: {weight_count}")
        
        if weight_count > 0:
            cursor.execute("SELECT pet_id, COUNT(*) FROM weight_records GROUP BY pet_id")
            pet_weights = cursor.fetchall()
            for pet_id, count in pet_weights:
                cursor.execute("SELECT name FROM pets WHERE id = ?", (pet_id,))
                pet_name = cursor.fetchone()[0]
                print(f"  Pet {pet_name} (ID {pet_id}): {count} records")
        
        print("\n" + "="*50)
        
        # Check for vaccine-related tables
        vaccine_tables = [t[0] for t in tables if 'vaccin' in t[0].lower()]
        print(f"💉 Vaccine-related tables: {len(vaccine_tables)}")
        for table in vaccine_tables:
            print(f"  - {table}")
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            print(f"    Records: {count}")
        
        print("\n" + "="*50)
        
        # Check medical records
        if 'medical_records' in [t[0] for t in tables]:
            cursor.execute("SELECT COUNT(*) FROM medical_records")
            medical_count = cursor.fetchone()[0]
            print(f"🏥 Medical records: {medical_count}")
        else:
            print("🏥 Medical records table: Not found")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    check_database()
