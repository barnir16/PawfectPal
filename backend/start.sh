#!/bin/bash
# Railway startup script that runs migrations before starting the app

echo "🚀 Starting PawfectPal Backend..."

# Set the port
PORT=${PORT:-8080}

# Run database migrations
echo "📋 Running database migrations..."
python -m alembic upgrade head

# Check if migrations succeeded
if [ $? -eq 0 ]; then
    echo "✅ Migrations completed successfully"
else
    echo "❌ Migration failed, but continuing with startup..."
fi

# Start the application
echo "🌐 Starting FastAPI server on port $PORT"
python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
