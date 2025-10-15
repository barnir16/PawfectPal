#!/usr/bin/env python3
"""
Script to merge migration heads and apply all migrations.
"""

import os
import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from alembic.config import Config
from alembic import command
from config import DATABASE_URL

def merge_migrations():
    """Merge migration heads and apply all migrations."""
    print(f"Database: {DATABASE_URL}")
    
    # Set up Alembic configuration
    alembic_cfg = Config("alembic.ini")
    
    try:
        print("Current migration status:")
        command.current(alembic_cfg)
        
        print("\nMerging all heads...")
        command.merge(alembic_cfg, "heads", "merge_all_heads")
        
        print("\nRunning all migrations...")
        command.upgrade(alembic_cfg, "head")
        
        print("\nFinal migration status:")
        command.current(alembic_cfg)
        
        print("Migrations completed successfully!")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    merge_migrations()
