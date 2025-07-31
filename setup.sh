#!/bin/bash

echo "Setting up PawfectPal project..."

echo
echo "1. Installing frontend dependencies..."
cd frontend
npm install
if [ $? -ne 0 ]; then
    echo "Error installing frontend dependencies"
    exit 1
fi

echo
echo "2. Installing backend dependencies..."
cd ../backend
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "Error installing backend dependencies"
    exit 1
fi

echo
echo "3. Setting up database..."
cd ..
python backend/database.py
if [ $? -ne 0 ]; then
    echo "Error setting up database"
    exit 1
fi

echo
echo "Setup complete!"
echo
echo "To start the backend server:"
echo "  cd backend"
echo "  python main.py"
echo
echo "To start the frontend:"
echo "  cd frontend"
echo "  npm start"
echo 