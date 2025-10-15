#!/usr/bin/env python3
"""
Script to verify the production database has the required tables.
"""

import os
import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import create_engine, text
from config import DATABASE_URL

def check_database():
    """Check if the production database has the required tables."""
    print(f"Checking database: {DATABASE_URL}")
    
    try:
        # Create engine
        engine = create_engine(DATABASE_URL)
        
        with engine.connect() as conn:
            # Check if provider_profiles table exists
            result = conn.execute(text("""
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name='provider_profiles'
            """))
            
            table_exists = result.fetchone()
            if table_exists:
                print("SUCCESS: provider_profiles table exists")
                
                # Check table structure
                result = conn.execute(text("PRAGMA table_info(provider_profiles)"))
                columns = result.fetchall()
                print(f"Table has {len(columns)} columns:")
                for col in columns:
                    print(f"  - {col[1]} ({col[2]})")
            else:
                print("ERROR: provider_profiles table does NOT exist")
                
            # Check all tables
            result = conn.execute(text("""
                SELECT name FROM sqlite_master 
                WHERE type='table' 
                ORDER BY name
            """))
            
            tables = result.fetchall()
            print(f"\nAll tables in database ({len(tables)} total):")
            for table in tables:
                print(f"  - {table[0]}")
                
    except Exception as e:
        print(f"ERROR: Database check failed: {e}")

if __name__ == "__main__":
    check_database()
