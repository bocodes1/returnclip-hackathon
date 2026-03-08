@echo off
REM Start both ML model and backend services

echo.
echo ========================================
echo ReturnClip Development Services Startup
echo ========================================
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found. Please install Python 3.9+
    pause
    exit /b 1
)

REM Check if Node.js is available
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found. Please install Node.js
    pause
    exit /b 1
)

echo Starting Backend (http://localhost:3001)...
echo Starting ML Model (http://localhost:5000)...
echo.

REM Navigate to backend and install dependencies if needed
cd backend

if not exist node_modules (
    echo Installing backend dependencies...
    call npm install
)

REM Start both services using npm script
call npm run dev:all

pause
