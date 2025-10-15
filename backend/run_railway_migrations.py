#!/usr/bin/env python3
"""
Railway CLI script to run migrations on production database.
This script can be run locally to execute migrations on Railway's PostgreSQL database.
"""

import os
import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from alembic.config import Config
from alembic import command

def run_railway_migrations():
    """Run migrations on Railway production database using Railway CLI."""
    print("🚀 Running migrations on Railway production database...")
    
    # Set up Alembic configuration
    alembic_cfg = Config("alembic.ini")
    
    try:
        # Check current migration status
        print("📋 Checking current migration status...")
        command.current(alembic_cfg)
        
        # Run all pending migrations
        print("🚀 Running pending migrations...")
        command.upgrade(alembic_cfg, "head")
        
        print("✅ Migrations completed successfully!")
        
        # Check final status
        print("📋 Final migration status:")
        command.current(alembic_cfg)
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    # Instructions for using Railway CLI
    print("""
    To run migrations on Railway production database:
    
    1. Install Railway CLI: npm install -g @railway/cli
    2. Login to Railway: railway login
    3. Connect to your project: railway link
    4. Run migrations: railway run python run_railway_migrations.py
    
    Or use the startup script method (recommended).
    """)
    
    # Check if we're running in Railway environment
    if os.getenv("RAILWAY_ENVIRONMENT"):
        run_railway_migrations()
    else:
        print("Not running in Railway environment. Use Railway CLI or startup script method.")
