#!/usr/bin/env python3
"""
Cleanup Migration Files
Deletes migration scripts and exported data after successful migration
"""

import os

def cleanup():
    """Delete migration files"""
    files_to_delete = [
        "migrate_to_railway.py",
        "export_local_data.py", 
        "cleanup_migration_files.py",
        "local_data_export.json"
    ]
    
    print("🧹 Cleaning up migration files...")
    
    for file in files_to_delete:
        if os.path.exists(file):
            os.remove(file)
            print(f"✅ Deleted {file}")
        else:
            print(f"ℹ️ {file} not found (already deleted)")
    
    print("✅ Cleanup completed!")

if __name__ == "__main__":
    cleanup()
