#!/usr/bin/env python3
"""
Script to check migration status and fix conflicts.
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

def check_migrations():
    """Check migration status and heads."""
    print(f"Database: {DATABASE_URL}")
    
    # Set up Alembic configuration
    alembic_cfg = Config("alembic.ini")
    
    try:
        print("Current migration status:")
        command.current(alembic_cfg)
        
        print("\nAll migration heads:")
        command.heads(alembic_cfg)
        
        print("\nMigration history:")
        command.history(alembic_cfg)
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_migrations()
