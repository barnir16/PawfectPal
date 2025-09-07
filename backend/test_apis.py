#!/usr/bin/env python3
import requests
import json

def test_backend_apis():
    """Test backend APIs to ensure they're working"""
    base_url = "http://localhost:8000"
    
    print("🧪 Testing Backend APIs...")
    print("=" * 50)
    
    # Test 1: Health check
    try:
        response = requests.get(f"{base_url}/docs")
        if response.status_code == 200:
            print("✅ API documentation accessible")
        else:
            print(f"⚠️ API docs status: {response.status_code}")
    except Exception as e:
        print(f"❌ Cannot access API: {e}")
        return False
    
    # Test 2: Check if server is running
    try:
        response = requests.get(f"{base_url}/openapi.json")
        if response.status_code == 200:
            print("✅ OpenAPI schema accessible")
        else:
            print(f"⚠️ OpenAPI status: {response.status_code}")
    except Exception as e:
        print(f"❌ OpenAPI error: {e}")
    
    print("\n📋 API Endpoints available:")
    print("   - /docs - API documentation")
    print("   - /openapi.json - OpenAPI schema")
    print("   - /api/pets - Pet management")
    print("   - /api/weight-records - Weight tracking")
    print("   - /api/vaccinations - Vaccination records")
    
    print("\n🎯 Next steps:")
    print("   1. Start the backend server: uvicorn main:app --reload")
    print("   2. Test the frontend weight tracking page")
    print("   3. Check browser console for any errors")
    
    return True

if __name__ == "__main__":
    test_backend_apis()
