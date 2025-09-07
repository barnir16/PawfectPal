#!/usr/bin/env python3
import sqlite3

def check_vaccine_structure():
    """Check the structure of vaccine-related tables"""
    try:
        conn = sqlite3.connect('pawfectpal.db')
        cursor = conn.cursor()
        
        # Check vaccinations table structure
        cursor.execute("PRAGMA table_info(vaccinations)")
        columns = cursor.fetchall()
        print("💉 Vaccinations table structure:")
        for col in columns:
            print(f"  {col[1]} ({col[2]}) - {'NOT NULL' if col[3] else 'NULLABLE'}")
        
        print("\n" + "="*50)
        
        # Check vaccines table structure
        cursor.execute("PRAGMA table_info(vaccines)")
        columns = cursor.fetchall()
        print("💉 Vaccines table structure:")
        for col in columns:
            print(f"  {col[1]} ({col[2]}) - {'NOT NULL' if col[3] else 'NULLABLE'}")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    check_vaccine_structure()
