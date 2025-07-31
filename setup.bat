@echo off
echo Setting up PawfectPal project...

echo.
echo 1. Installing frontend dependencies...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo Error installing frontend dependencies
    pause
    exit /b 1
)

echo.
echo 2. Installing backend dependencies...
cd ..\backend
call pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo Error installing backend dependencies
    pause
    exit /b 1
)

echo.
echo 3. Setting up database...
cd ..
call python backend\database.py
if %errorlevel% neq 0 (
    echo Error setting up database
    pause
    exit /b 1
)

echo.
echo Setup complete! 
echo.
echo To start the backend server:
echo   cd backend
echo   python main.py
echo.
echo To start the frontend:
echo   cd frontend
echo   npm start
echo.
pause 