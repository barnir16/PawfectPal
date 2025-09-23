#!/usr/bin/env python3
"""
Backup script before clearing browser cache
Creates a backup of current state
"""

import shutil
import os
from datetime import datetime

def create_backup():
    """Create backup of current project state"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_dir = f"backup_{timestamp}"
    
    print(f"📦 Creating backup: {backup_dir}")
    
    try:
        # Create backup directory
        os.makedirs(backup_dir, exist_ok=True)
        
        # Copy important directories
        dirs_to_backup = [
            "backend",
            "frontend/src",
            "frontend/public",
            "frontend/package.json",
            "frontend/vite.config.ts"
        ]
        
        for item in dirs_to_backup:
            if os.path.exists(item):
                if os.path.isdir(item):
                    shutil.copytree(item, os.path.join(backup_dir, item))
                else:
                    shutil.copy2(item, os.path.join(backup_dir, item))
                print(f"✅ Backed up: {item}")
            else:
                print(f"⚠️ Not found: {item}")
        
        # Create backup info file
        with open(os.path.join(backup_dir, "backup_info.txt"), "w") as f:
            f.write(f"Backup created: {datetime.now().isoformat()}\n")
            f.write("Reason: Before clearing browser cache for Railway deployment\n")
            f.write("Changes: Fixed localhost references, disabled service worker\n")
        
        print(f"✅ Backup completed: {backup_dir}")
        print("📝 Backup info saved to backup_info.txt")
        
    except Exception as e:
        print(f"❌ Backup failed: {e}")

if __name__ == "__main__":
    create_backup()
