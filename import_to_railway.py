#!/usr/bin/env python3
"""
Import local data to Railway PostgreSQL database
"""

import json
import os
import psycopg2
from datetime import datetime
import requests

def get_railway_connection():
    """Get Railway PostgreSQL connection"""
    # Railway provides these as environment variables
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        print("❌ DATABASE_URL environment variable not found")
        print("Please set DATABASE_URL in Railway environment variables")
        return None
    
    try:
        conn = psycopg2.connect(db_url)
        return conn
    except Exception as e:
        print(f"❌ Failed to connect to Railway database: {e}")
        return None

def import_table_data(cursor, table_name, data):
    """Import data to a table"""
    if not data:
        print(f"  {table_name}: No data to import")
        return
    
    try:
        # Get column names from first row
        if not data:
            return
        
        columns = list(data[0].keys())
        placeholders = ', '.join(['%s'] * len(columns))
        column_names = ', '.join(columns)
        
        # Clear existing data (optional - comment out if you want to keep existing data)
        cursor.execute(f"DELETE FROM {table_name}")
        
        # Insert data
        for row in data:
            values = [row.get(col) for col in columns]
            query = f"INSERT INTO {table_name} ({column_names}) VALUES ({placeholders})"
            cursor.execute(query, values)
        
        print(f"  {table_name}: Imported {len(data)} rows")
        
    except Exception as e:
        print(f"  ❌ Error importing {table_name}: {e}")

def main():
    # Find the latest export file
    export_files = [f for f in os.listdir('.') if f.startswith('local_data_export_') and f.endswith('.json')]
    if not export_files:
        print("❌ No export files found")
        return
    
    # Use the latest file
    latest_file = sorted(export_files)[-1]
    print(f"📁 Using export file: {latest_file}")
    
    # Load export data
    with open(latest_file, 'r', encoding='utf-8') as f:
        export_data = json.load(f)
    
    print(f"📊 Loaded data for {len(export_data)} tables")
    
    # Connect to Railway database
    conn = get_railway_connection()
    if not conn:
        return
    
    cursor = conn.cursor()
    
    try:
        # Import data in order (respecting foreign key constraints)
        import_order = [
            'users',
            'pets', 
            'tasks',
            'vaccinations',
            'weight_records',
            'weight_goals',
            'service_requests'
        ]
        
        print("🚀 Starting data import...")
        
        for table in import_order:
            if table in export_data:
                print(f"📥 Importing {table}...")
                import_table_data(cursor, table, export_data[table])
        
        # Commit all changes
        conn.commit()
        print("✅ Data import completed successfully!")
        
        # Print summary
        total_imported = sum(len(export_data.get(table, [])) for table in import_order)
        print(f"📈 Total rows imported: {total_imported}")
        
    except Exception as e:
        print(f"❌ Import failed: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    main()
