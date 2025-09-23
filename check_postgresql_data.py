#!/usr/bin/env python3
"""
Check what data was imported to PostgreSQL
"""

import psycopg2

# Database URL for PostgreSQL
DATABASE_URL = "postgresql://postgres:uplqoudioeTMCIeFaRvbabQIcvQgImkX@ballast.proxy.rlwy.net:38565/railway"

def main():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        print("📊 Checking imported data in PostgreSQL...")
        
        # Check each table
        tables = ['users', 'pets', 'tasks', 'vaccinations', 'weight_records', 'weight_goals', 'service_requests']
        
        for table in tables:
            try:
                cursor.execute(f"SELECT COUNT(*) FROM {table}")
                count = cursor.fetchone()[0]
                print(f"  {table}: {count} rows")
            except Exception as e:
                print(f"  {table}: Error - {e}")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()
