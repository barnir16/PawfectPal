#!/usr/bin/env python3
"""
Upload SQLite database to Railway
"""

import os
import shutil
from datetime import datetime

def main():
    # Source SQLite database
    source_db = "backend/pawfectpal.db"
    
    if not os.path.exists(source_db):
        print(f"❌ SQLite database not found at {source_db}")
        return
    
    # Get file size
    file_size = os.path.getsize(source_db)
    file_size_mb = file_size / (1024 * 1024)
    
    print(f"📁 Found SQLite database: {source_db}")
    print(f"📊 File size: {file_size_mb:.2f} MB")
    
    # Check if we can copy it to Railway
    print("\n🚀 To upload to Railway:")
    print("1. Go to Railway dashboard")
    print("2. Open your PawfectPal service")
    print("3. Go to 'Settings' tab")
    print("4. Look for 'File System' or 'Volumes' section")
    print("5. Upload the SQLite database file")
    
    print(f"\n📋 Alternative: Use Railway CLI")
    print("railway up backend/pawfectpal.db")
    
    print(f"\n📋 Or modify your Dockerfile to include the database:")
    print("COPY backend/pawfectpal.db /app/pawfectpal.db")

if __name__ == "__main__":
    main()
