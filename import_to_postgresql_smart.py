#!/usr/bin/env python3
"""
Smart import script that auto-detects boolean fields
"""

import json
import os
import psycopg2
from datetime import datetime

# Database URL for PostgreSQL
DATABASE_URL = "postgresql://postgres:uplqoudioeTMCIeFaRvbabQIcvQgImkX@ballast.proxy.rlwy.net:38565/railway"

def get_postgresql_connection():
    """Get PostgreSQL connection"""
    if not DATABASE_URL.startswith("postgresql"):
        print("❌ DATABASE_URL is not a PostgreSQL URL")
        return None
    
    try:
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    except Exception as e:
        print(f"❌ Failed to connect to PostgreSQL: {e}")
        return None

def detect_boolean_fields(data):
    """Auto-detect boolean fields by analyzing the data"""
    if not data:
        return []
    
    boolean_fields = []
    first_row = data[0]
    
    for field, value in first_row.items():
        # Skip ID fields and foreign keys
        if field in ['id', 'user_id', 'pet_id', 'views_count', 'responses_count']:
            continue
            
        # Check if all values in this field are 0 or 1
        all_values = [row.get(field) for row in data if field in row]
        if all_values and all(isinstance(v, int) and v in [0, 1] for v in all_values):
            boolean_fields.append(field)
    
    return boolean_fields

def convert_boolean_fields(row, boolean_fields):
    """Convert integer fields to boolean for PostgreSQL"""
    for field in boolean_fields:
        if field in row and row[field] is not None:
            row[field] = bool(row[field])
    return row

def import_table_data(cursor, table_name, data):
    """Import data to a PostgreSQL table with smart boolean detection"""
    if not data:
        print(f"  {table_name}: No data to import")
        return
    
    try:
        # Auto-detect boolean fields
        boolean_fields = detect_boolean_fields(data)
        if boolean_fields:
            print(f"  🎯 Auto-detected boolean fields: {boolean_fields}")
        
        # Get column names from first row
        columns = list(data[0].keys())
        placeholders = ', '.join(['%s'] * len(columns))
        column_names = ', '.join(columns)
        
        # Clear existing data
        cursor.execute(f"DELETE FROM {table_name}")
        
        # Insert data with type conversion
        for row in data:
            # Convert boolean fields
            row = convert_boolean_fields(row, boolean_fields)
            
            values = [row.get(col) for col in columns]
            query = f"INSERT INTO {table_name} ({column_names}) VALUES ({placeholders})"
            cursor.execute(query, values)
        
        print(f"  ✅ {table_name}: Imported {len(data)} rows")
        
    except Exception as e:
        print(f"  ❌ Error importing {table_name}: {e}")
        raise e

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
    
    # Connect to PostgreSQL database
    conn = get_postgresql_connection()
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
        
        print("🚀 Starting smart PostgreSQL data import...")
        
        for table in import_order:
            if table in export_data:
                print(f"📥 Importing {table}...")
                import_table_data(cursor, table, export_data[table])
        
        # Commit all changes
        conn.commit()
        print("✅ PostgreSQL data import completed successfully!")
        
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
