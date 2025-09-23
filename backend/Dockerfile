FROM python:3.9-slim

WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Expose port
EXPOSE 8080

# Start the application with Railway-compatible port handling
CMD ["sh", "-c", "PORT=${PORT:-8080} && echo \"Starting on port $PORT\" && python -m uvicorn main:app --host 0.0.0.0 --port $PORT"]
