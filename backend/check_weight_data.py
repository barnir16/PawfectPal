#!/usr/bin/env python3
import sqlite3

def check_weight_data():
    """Check weight data format and content"""
    try:
        conn = sqlite3.connect('pawfectpal.db')
        cursor = conn.cursor()
        
        # Check weight records for Bob (pet_id = 1)
        cursor.execute("""
            SELECT pet_id, weight, weight_unit, date, notes 
            FROM weight_records 
            WHERE pet_id = 1 
            ORDER BY date 
            LIMIT 5
        """)
        records = cursor.fetchall()
        
        print("⚖️ Sample weight records for Bob (pet_id = 1):")
        for record in records:
            print(f"  Date: {record[3]}, Weight: {record[1]} {record[2]}, Notes: {record[4]}")
        
        print("\n" + "="*50)
        
        # Check total weight records by pet
        cursor.execute("""
            SELECT p.name, COUNT(wr.id) as record_count, 
                   MIN(wr.date) as earliest, MAX(wr.date) as latest
            FROM pets p
            LEFT JOIN weight_records wr ON p.id = wr.pet_id
            GROUP BY p.id, p.name
            ORDER BY p.name
        """)
        
        pet_summary = cursor.fetchall()
        print("📊 Weight records summary by pet:")
        for pet in pet_summary:
            print(f"  {pet[0]}: {pet[1]} records ({pet[2]} to {pet[3]})")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    check_weight_data()
