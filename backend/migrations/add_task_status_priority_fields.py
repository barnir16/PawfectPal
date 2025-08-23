#!/usr/bin/env python3
"""
Database migration script to add priority, status, and is_completed fields to tasks table.
Run this script to update existing database schema.
"""

import sqlite3
import os
from pathlib import Path

def add_task_status_priority_fields():
    """Add priority, status, and is_completed fields to the tasks table"""
    
    # Get the database path
    db_path = Path(__file__).parent.parent / "petcare.db"
    
    if not db_path.exists():
        print("Database file not found. Creating new database with latest schema.")
        return
    
    try:
        # Connect to the database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("Adding task status and priority fields to tasks table...")
        
        # Check if columns already exist
        cursor.execute("PRAGMA table_info(tasks)")
        columns = [column[1] for column in cursor.fetchall()]
        
        # Add priority column if it doesn't exist
        if 'priority' not in columns:
            cursor.execute("""
                ALTER TABLE tasks 
                ADD COLUMN priority TEXT NOT NULL DEFAULT 'medium'
            """)
            print("✓ Added priority column")
        else:
            print("✓ priority column already exists")
        
        # Add status column if it doesn't exist
        if 'status' not in columns:
            cursor.execute("""
                ALTER TABLE tasks 
                ADD COLUMN status TEXT NOT NULL DEFAULT 'pending'
            """)
            print("✓ Added status column")
        else:
            print("✓ status column already exists")
            
        # Add is_completed column if it doesn't exist
        if 'is_completed' not in columns:
            cursor.execute("""
                ALTER TABLE tasks 
                ADD COLUMN is_completed BOOLEAN NOT NULL DEFAULT 0
            """)
            print("✓ Added is_completed column")
        else:
            print("✓ is_completed column already exists")
        
        # Commit changes
        conn.commit()
        print("✅ Task status and priority fields migration completed successfully!")
        
    except sqlite3.Error as e:
        print(f"❌ Error during migration: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    add_task_status_priority_fields()

