#!/usr/bin/env python3
"""
Generate migration for all tables
"""

import os
import sys
from alembic import command
from alembic.config import Config

def main():
    # Set up Alembic configuration
    alembic_cfg = Config("alembic.ini")
    
    print("🚀 Generating migration for all tables...")
    
    try:
        # Generate migration
        command.revision(alembic_cfg, autogenerate=True, message="Create all tables")
        print("✅ Migration generated successfully!")
        
    except Exception as e:
        print(f"❌ Migration generation failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
