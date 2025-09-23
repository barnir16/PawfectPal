#!/usr/bin/env python3
"""
Clear browser cache for PawfectPal development
Works with Chrome, Firefox, Edge browsers
"""

import os
import shutil
import platform
from pathlib import Path

def get_browser_cache_paths():
    """Get browser cache paths based on OS"""
    system = platform.system()
    cache_paths = []
    
    if system == "Windows":
        # Chrome
        chrome_path = Path.home() / "AppData/Local/Google/Chrome/User Data/Default/Cache"
        if chrome_path.exists():
            cache_paths.append(("Chrome", chrome_path))
        
        # Edge
        edge_path = Path.home() / "AppData/Local/Microsoft/Edge/User Data/Default/Cache"
        if edge_path.exists():
            cache_paths.append(("Edge", edge_path))
        
        # Firefox
        firefox_path = Path.home() / "AppData/Roaming/Mozilla/Firefox/Profiles"
        if firefox_path.exists():
            for profile in firefox_path.iterdir():
                if profile.is_dir():
                    cache_path = profile / "cache2"
                    if cache_path.exists():
                        cache_paths.append(("Firefox", cache_path))
    
    elif system == "Darwin":  # macOS
        # Chrome
        chrome_path = Path.home() / "Library/Caches/Google/Chrome/Default/Cache"
        if chrome_path.exists():
            cache_paths.append(("Chrome", chrome_path))
        
        # Safari
        safari_path = Path.home() / "Library/Caches/com.apple.Safari"
        if safari_path.exists():
            cache_paths.append(("Safari", safari_path))
    
    elif system == "Linux":
        # Chrome
        chrome_path = Path.home() / ".cache/google-chrome/Default/Cache"
        if chrome_path.exists():
            cache_paths.append(("Chrome", chrome_path))
        
        # Firefox
        firefox_path = Path.home() / ".cache/mozilla/firefox"
        if firefox_path.exists():
            cache_paths.append(("Firefox", firefox_path))
    
    return cache_paths

def clear_browser_cache():
    """Clear browser cache for PawfectPal"""
    print("🧹 Clearing browser cache for PawfectPal...")
    
    cache_paths = get_browser_cache_paths()
    
    if not cache_paths:
        print("❌ No browser cache paths found")
        return False
    
    cleared_count = 0
    
    for browser_name, cache_path in cache_paths:
        try:
            print(f"🔍 Found {browser_name} cache: {cache_path}")
            
            # Count files before clearing
            file_count = sum(1 for _ in cache_path.rglob("*") if _.is_file())
            
            if file_count > 0:
                # Clear cache
                shutil.rmtree(cache_path)
                cache_path.mkdir(parents=True, exist_ok=True)
                
                print(f"✅ Cleared {browser_name} cache ({file_count} files)")
                cleared_count += 1
            else:
                print(f"ℹ️ {browser_name} cache already empty")
                
        except PermissionError:
            print(f"⚠️ Permission denied for {browser_name} cache (browser might be open)")
        except Exception as e:
            print(f"❌ Failed to clear {browser_name} cache: {e}")
    
    if cleared_count > 0:
        print(f"✅ Successfully cleared {cleared_count} browser cache(s)")
        print("🔄 Please restart your browser and test PawfectPal")
        return True
    else:
        print("⚠️ No caches were cleared")
        return False

def clear_local_storage():
    """Clear local storage for PawfectPal (if possible)"""
    print("🗄️ Note: Local storage can only be cleared from browser")
    print("📝 To clear local storage manually:")
    print("   1. Open Developer Tools (F12)")
    print("   2. Go to Application tab")
    print("   3. Click 'Storage' → 'Clear storage'")
    print("   4. Click 'Clear site data'")

def main():
    """Main function"""
    print("🚀 PawfectPal Cache Clearing Tool")
    print("=" * 40)
    
    # Clear browser cache
    success = clear_browser_cache()
    
    print("\n" + "=" * 40)
    
    # Show local storage instructions
    clear_local_storage()
    
    print("\n" + "=" * 40)
    
    if success:
        print("✅ Cache clearing completed!")
        print("🔄 Next steps:")
        print("   1. Close all browser windows")
        print("   2. Restart browser")
        print("   3. Test PawfectPal with Railway backend")
    else:
        print("⚠️ Cache clearing had issues")
        print("🔄 Try manual cache clearing:")
        print("   1. Close browser")
        print("   2. Run this script again")
        print("   3. Or clear cache manually in browser")

if __name__ == "__main__":
    main()
