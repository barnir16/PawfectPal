# PawfectPal Backend

This is the FastAPI backend for PawfectPal.

## Setup

1. Create and activate a virtual environment:
   ```
   python -m venv venv
   venv\Scripts\activate  # On Windows
   source venv/bin/activate  # On Mac/Linux
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

## Running the Server

```
uvicorn main:app --reload
```

The API will be available at http://127.0.0.1:8000

## Endpoints
- `/` - Welcome message
- `/pets` - GET/POST pets
- `/tasks` - GET/POST tasks
- `/vaccines` - GET/POST vaccines 