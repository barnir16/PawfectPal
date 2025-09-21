#!/bin/bash

# Check if we're in the backend or frontend directory
if [ -f "backend/main.py" ]; then
    echo "Starting backend service..."
    cd backend
    pip install -r requirements.txt
    python -m uvicorn main:app --host 0.0.0.0 --port $PORT
elif [ -f "frontend/package.json" ]; then
    echo "Starting frontend service..."
    cd frontend
    npm ci
    npm run build
    npm run preview -- --host 0.0.0.0 --port $PORT
else
    echo "Error: Could not determine service type"
    exit 1
fi
