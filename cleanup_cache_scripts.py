#!/usr/bin/env python3
"""
Cleanup cache clearing scripts after use
"""

import os

def cleanup():
    """Delete cache clearing scripts"""
    scripts_to_delete = [
        "backup_before_cache_clear.py",
        "clear_browser_cache.py", 
        "cleanup_cache_scripts.py"
    ]
    
    print("🧹 Cleaning up cache clearing scripts...")
    
    for script in scripts_to_delete:
        if os.path.exists(script):
            os.remove(script)
            print(f"✅ Deleted {script}")
        else:
            print(f"ℹ️ {script} not found (already deleted)")
    
    print("✅ Cleanup completed!")

if __name__ == "__main__":
    cleanup()
