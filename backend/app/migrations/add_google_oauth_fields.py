#!/usr/bin/env python3
"""
Database migration script to add Google OAuth fields to users table.
Run this script to update existing database schema.
"""

import sqlite3
import os
from pathlib import Path

def add_google_oauth_fields():
    """Add Google OAuth fields to the users table"""
    
    # Get the database path
    db_path = Path(__file__).parent.parent / "petcare.db"
    
    if not db_path.exists():
        print("Database file not found. Creating new database with latest schema.")
        return
    
    try:
        # Connect to the database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("Adding Google OAuth fields to users table...")
        
        # Check if columns already exist
        cursor.execute("PRAGMA table_info(users)")
        columns = [column[1] for column in cursor.fetchall()]
        
        # Add google_id column if it doesn't exist
        if 'google_id' not in columns:
            cursor.execute("""
                ALTER TABLE users 
                ADD COLUMN google_id TEXT UNIQUE
            """)
            print("✓ Added google_id column")
        else:
            print("✓ google_id column already exists")
        
        # Add profile_picture_url column if it doesn't exist
        if 'profile_picture_url' not in columns:
            cursor.execute("""
                ALTER TABLE users 
                ADD COLUMN profile_picture_url TEXT
            """)
            print("✓ Added profile_picture_url column")
        else:
            print("✓ profile_picture_url column already exists")
        
        # Commit changes
        conn.commit()
        print("✅ Google OAuth fields migration completed successfully!")
        
    except sqlite3.Error as e:
        print(f"❌ Error during migration: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    add_google_oauth_fields()

