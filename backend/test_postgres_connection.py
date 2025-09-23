#!/usr/bin/env python3
"""
Test PostgreSQL connection
"""

import psycopg2
from config import DATABASE_URL

def main():
    print(f"🔍 Testing connection to: {DATABASE_URL}")
    
    try:
        conn = psycopg2.connect(DATABASE_URL)
        print("✅ Successfully connected to PostgreSQL!")
        
        # Test a simple query
        cursor = conn.cursor()
        cursor.execute("SELECT version();")
        version = cursor.fetchone()
        print(f"📊 PostgreSQL version: {version[0]}")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        print("\n💡 The issue might be:")
        print("1. The DATABASE_URL uses 'postgres.railway.internal' which only works inside Railway")
        print("2. We need the external URL for local testing")
        print("3. Or we need to set up the DATABASE_URL in Railway environment variables")

if __name__ == "__main__":
    main()
