#!/bin/bash
set -e

# Get port from Railway environment variable or default to 8000
PORT=${PORT:-8000}

echo "Starting PawfectPal backend on port $PORT"

# Start the application
exec python -m uvicorn main:app --host 0.0.0.0 --port $PORT
