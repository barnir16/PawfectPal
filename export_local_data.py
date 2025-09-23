#!/usr/bin/env python3
"""
Export local SQLite data to JSON for Railway import
"""

import sqlite3
import json
import os
from datetime import datetime

def export_table_data(cursor, table_name):
    """Export all data from a table"""
    try:
        cursor.execute(f"SELECT * FROM {table_name}")
        rows = cursor.fetchall()
        
        # Get column names
        cursor.execute(f"PRAGMA table_info({table_name})")
        columns = [column[1] for column in cursor.fetchall()]
        
        # Convert rows to dictionaries
        data = []
        for row in rows:
            row_dict = {}
            for i, value in enumerate(row):
                column_name = columns[i]
                # Convert datetime strings to ISO format
                if isinstance(value, str) and ('-' in value and ':' in value):
                    try:
                        # Try to parse as datetime
                        from datetime import datetime
                        dt = datetime.fromisoformat(value.replace('Z', '+00:00'))
                        row_dict[column_name] = dt.isoformat()
                    except:
                        row_dict[column_name] = value
                else:
                    row_dict[column_name] = value
            data.append(row_dict)
        
        return data
    except Exception as e:
        print(f"Error exporting {table_name}: {e}")
        return []

def main():
    # Connect to local SQLite database
    db_path = "backend/pawfectpal.db"
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Get all table names
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [row[0] for row in cursor.fetchall()]
    
    print(f"Found tables: {tables}")
    
    # Export data from each table
    export_data = {}
    for table in tables:
        print(f"Exporting {table}...")
        data = export_table_data(cursor, table)
        export_data[table] = data
        print(f"  Exported {len(data)} rows")
    
    # Save to JSON file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"local_data_export_{timestamp}.json"
    
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(export_data, f, indent=2, ensure_ascii=False)
    
    print(f"\nData exported to {filename}")
    
    # Print summary
    total_rows = sum(len(data) for data in export_data.values())
    print(f"Total rows exported: {total_rows}")
    
    for table, data in export_data.items():
        if data:
            print(f"  {table}: {len(data)} rows")
    
    conn.close()

if __name__ == "__main__":
    main()
