# Backend Debug Guide - Step by Step

## The Problem
Your frontend is getting CORS errors when trying to create a pet, which indicates the backend is not responding properly.

## Step 1: Check Backend Terminal Output

**In your backend terminal, you should see:**

✅ **Expected Good Output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Application startup complete.
```

❌ **Bad Signs to Look For:**
- Python import errors
- Database connection errors
- Missing dependency errors
- Any traceback/exception messages

## Step 2: Manual Backend Testing

**Open a new browser tab and test these URLs:**

1. **Test Basic Connection:**
   - Go to: `http://127.0.0.1:8000/`
   - Expected: JSON response with "Welcome to PawfectPal API"

2. **Test API Documentation:**
   - Go to: `http://127.0.0.1:8000/docs`
   - Expected: Swagger/OpenAPI documentation page

3. **Test Auth Endpoints:**
   - Go to: `http://127.0.0.1:8000/auth/register`
   - Expected: HTTP 422 error (method not allowed, but this proves endpoint exists)

## Step 3: If Backend URLs Don't Work

**The backend is not running properly. Try these fixes:**

### Fix 1: Restart Backend with Error Checking
```bash
cd C:\Users\barni\AndroidStudioProjects\PawfectPal\backend

# Kill any existing processes
taskkill /f /im python.exe 2>nul || echo "No Python processes running"

# Start backend with verbose output
python main.py
```

### Fix 2: Check Python Environment
```bash
# Make sure you're in the right directory
cd C:\Users\barni\AndroidStudioProjects\PawfectPal\backend

# Check Python version
python --version

# Check if main.py exists
dir main.py

# Try running directly with uvicorn
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Fix 3: Check Dependencies
```bash
# Install missing dependencies
pip install -r requirements.txt

# Or install specific ones:
pip install fastapi uvicorn sqlalchemy python-jose[cryptography] passlib[argon2]
```

## Step 4: Check for Import Errors

**If you see Python import errors, here are the most likely culprits:**

### Models Import Error
If you see errors about missing models, try:
```python
# In backend directory, run:
python -c "from models import UserORM; print('Models OK')"
```

### Auth Utils Import Error
```python
# Test auth imports:
python -c "from auth.utils import get_password_hash; print('Auth OK')"
```

### Config Import Error
```python
# Test config:
python -c "from config import SECRET_KEY; print('Config OK')"
```

## Step 5: Database Issues

**If the backend starts but crashes on requests:**

### Check Database File
```bash
# Look for database file
dir pawfectpal.db

# If missing, create tables:
python -c "from database import engine; from models import Base; Base.metadata.create_all(bind=engine); print('Database created')"
```

## Step 6: Test Pet Creation Manually

**Once backend is running, test the pet endpoint:**

1. Go to `http://127.0.0.1:8000/docs`
2. Find the "POST /pets/" endpoint
3. Click "Try it out"
4. You should see a 401 error (authentication required) - this is GOOD!

## Step 7: Frontend Test

**Only after confirming backend works manually:**

1. Refresh your frontend page (F5)
2. Log in again if needed
3. Try creating a pet
4. Check browser Network tab for the actual error

## Common Fixes

### Missing Dependencies
```bash
pip install fastapi uvicorn sqlalchemy python-jose[cryptography] passlib[argon2] pydantic email-validator python-multipart
```

### Wrong Directory
```bash
# Make sure you're in backend directory:
cd C:\Users\barni\AndroidStudioProjects\PawfectPal\backend
ls  # Should show main.py, models/, routers/, etc.
```

### Port Conflict
```bash
# Try different port:
uvicorn main:app --host 0.0.0.0 --port 8001 --reload

# Then update frontend config.ts to use port 8001
```

## What to Report Back

**Please tell me:**

1. What happens when you go to `http://127.0.0.1:8000/` in browser?
2. What do you see in the backend terminal when you start it?
3. Any error messages from the backend?
4. Does `http://127.0.0.1:8000/docs` work?

This will help me identify the exact problem!

