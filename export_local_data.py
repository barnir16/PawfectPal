#!/usr/bin/env python3
"""
Simple Data Export Script
Exports local SQLite data to JSON files for manual review/migration
"""

import sqlite3
import json
import os
from datetime import datetime

def export_data():
    """Export all data from local SQLite to JSON files"""
    print("🔍 Exporting data from local database...")
    
    db_path = "backend/pawfectpal.db"
    if not os.path.exists(db_path):
        print(f"❌ Database not found at {db_path}")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Get all tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [row[0] for row in cursor.fetchall()]
        print(f"📊 Found tables: {tables}")
        
        export_data = {
            "export_timestamp": datetime.now().isoformat(),
            "tables": {}
        }
        
        # Export each table
        for table in tables:
            cursor.execute(f"SELECT * FROM {table}")
            rows = cursor.fetchall()
            
            # Get column names
            cursor.execute(f"PRAGMA table_info({table})")
            columns = [row[1] for row in cursor.fetchall()]
            
            export_data["tables"][table] = {
                "columns": columns,
                "data": rows
            }
            
            print(f"📋 Exported {len(rows)} rows from {table}")
        
        # Save to JSON file
        with open("local_data_export.json", "w", encoding="utf-8") as f:
            json.dump(export_data, f, indent=2, default=str)
        
        print(f"✅ Data exported to local_data_export.json")
        print(f"📊 Total tables exported: {len(tables)}")
        
    except Exception as e:
        print(f"❌ Error exporting data: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    export_data()
