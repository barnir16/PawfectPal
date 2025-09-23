#!/usr/bin/env python3
"""
Check what tables exist in PostgreSQL
"""

import psycopg2

# Database URL for PostgreSQL
DATABASE_URL = "postgresql://REDACTED_DATABASE_URL"

def main():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        print("📊 Checking tables in PostgreSQL...")
        
        # List all tables
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        """)
        
        tables = cursor.fetchall()
        
        if tables:
            print("📋 Found tables:")
            for table in tables:
                print(f"  - {table[0]}")
        else:
            print("❌ No tables found!")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()
