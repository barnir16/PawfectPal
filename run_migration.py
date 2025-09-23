#!/usr/bin/env python3
"""
Run database migration to PostgreSQL
"""

import os
import sys
from alembic import command
from alembic.config import Config

def main():
    # Set up Alembic configuration
    alembic_cfg = Config("alembic.ini")
    
    print("🚀 Starting database migration to PostgreSQL...")
    
    try:
        # Run the migration
        command.upgrade(alembic_cfg, "head")
        print("✅ Database migration completed successfully!")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
