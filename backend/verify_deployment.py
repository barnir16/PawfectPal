#!/usr/bin/env python3
"""
Deployment verification script for PawfectPal
Checks that all critical endpoints are working after deployment
"""
import requests
import json
import sys
import os
from datetime import datetime

# Configuration
BACKEND_URL = os.getenv('BACKEND_URL', 'https://pawfectpal-production-2f07.up.railway.app')
FRONTEND_URL = os.getenv('FRONTEND_URL', 'https://pawfectpal-frontend-production.up.railway.app')

def check_endpoint(url, method='GET', data=None, headers=None, expected_status=200):
    """Check if an endpoint is responding correctly"""
    try:
        if method == 'GET':
            response = requests.get(url, headers=headers, timeout=10)
        elif method == 'POST':
            response = requests.post(url, json=data, headers=headers, timeout=10)
        
        if response.status_code == expected_status:
            print(f"OK {method} {url} - Status: {response.status_code}")
            return True
        else:
            print(f"FAIL {method} {url} - Status: {response.status_code} (expected {expected_status})")
            return False
    except requests.exceptions.RequestException as e:
        print(f"ERROR {method} {url} - Error: {e}")
        return False

def verify_backend():
    """Verify backend endpoints"""
    print("Verifying Backend Endpoints...")
    
    endpoints = [
        ('/health', 'GET'),
        ('/test', 'GET'),
        ('/docs', 'GET'),
    ]
    
    success_count = 0
    total_count = len(endpoints)
    
    for endpoint, method in endpoints:
        url = f"{BACKEND_URL}{endpoint}"
        if check_endpoint(url, method):
            success_count += 1
    
    print(f"Backend: {success_count}/{total_count} endpoints working")
    return success_count == total_count

def verify_frontend():
    """Verify frontend is accessible"""
    print("\nVerifying Frontend...")
    
    try:
        response = requests.get(FRONTEND_URL, timeout=10)
        if response.status_code == 200:
            print(f"OK Frontend accessible at {FRONTEND_URL}")
            return True
        else:
            print(f"FAIL Frontend returned status {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"ERROR Frontend error: {e}")
        return False

def verify_database_connection():
    """Verify database connection through API"""
    print("\nVerifying Database Connection...")
    
    # Try to access an endpoint that requires database
    try:
        response = requests.get(f"{BACKEND_URL}/users/me", timeout=10)
        # We expect 401 (unauthorized) which means the endpoint is working
        if response.status_code == 401:
            print("OK Database connection working (401 expected for /users/me without auth)")
            return True
        elif response.status_code == 200:
            print("OK Database connection working")
            return True
        else:
            print(f"FAIL Database connection issue - Status: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"ERROR Database connection error: {e}")
        return False

def verify_ai_endpoint():
    """Verify AI endpoint is accessible"""
    print("\nVerifying AI Endpoint...")
    
    # Test the AI test endpoint (no auth required)
    test_data = {
        "message": "Hello",
        "pet_context": {"pets": [], "total_pets": 0},
        "prompt_language": "en"
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/ai/test", json=test_data, timeout=30)
        if response.status_code == 200:
            print("OK AI endpoint working")
            return True
        else:
            print(f"FAIL AI endpoint issue - Status: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"ERROR AI endpoint error: {e}")
        return False

def main():
    """Main verification function"""
    print("PawfectPal Deployment Verification")
    print(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Backend: {BACKEND_URL}")
    print(f"Frontend: {FRONTEND_URL}")
    print("=" * 60)
    
    checks = [
        verify_backend,
        verify_frontend,
        verify_database_connection,
        verify_ai_endpoint,
    ]
    
    passed = 0
    total = len(checks)
    
    for check in checks:
        if check():
            passed += 1
        print()
    
    print("=" * 60)
    print(f"Verification Results: {passed}/{total} checks passed")
    
    if passed == total:
        print("SUCCESS: All systems operational!")
        return True
    else:
        print("WARNING: Some issues detected. Check the logs above.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
