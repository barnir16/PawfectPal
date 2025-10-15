#!/usr/bin/env python3
"""
Script to run database migrations on production database.
This script will apply any pending migrations to fix the missing provider_profiles table.
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

def run_migrations():
    """Run all pending migrations on the production database."""
    print(f"Running migrations on database: {DATABASE_URL}")
    
    # Set up Alembic configuration
    alembic_cfg = Config("alembic.ini")
    
    try:
        # Check current migration status
        print("Checking current migration status...")
        command.current(alembic_cfg)
        
        # Run all pending migrations
        print("Running pending migrations...")
        command.upgrade(alembic_cfg, "head")
        
        print("Migrations completed successfully!")
        
        # Check final status
        print("Final migration status:")
        command.current(alembic_cfg)
        
    except Exception as e:
        print(f"Migration failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_migrations()
