@echo off
title Tmall Gift Snatcher System

echo ========================================
echo Tmall Gift Snatcher System
echo ========================================
echo.
echo Checking environment...
echo.

REM Save current directory
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

REM Check Python
echo [1/3] Checking Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found
    echo.
    echo Solution:
    echo    1. Download Python 3.10+ from https://www.python.org/downloads/
    echo    2. Check "Add Python to PATH" during installation
    echo    3. Restart command prompt after installation
    echo.
    pause
    exit /b 1
)
python --version
echo OK: Python is installed
echo.

REM Check Node.js
echo [2/3] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found
    echo.
    echo Solution:
    echo    1. Download Node.js 18+ from https://nodejs.org/
    echo    2. Install LTS version
    echo    3. Restart command prompt after installation
    echo.
    pause
    exit /b 1
)
node --version
echo OK: Node.js is installed
echo.

REM Check Poetry
echo [3/3] Checking Poetry...
poetry --version >nul 2>&1
if errorlevel 1 (
    echo WARNING: Poetry not found
    echo.
    echo Solution (Choose one):
    echo.
    echo    Option 1: Install Poetry (Recommended)
    echo    Run in PowerShell (Admin mode):
    echo    (Invoke-WebRequest -Uri https://install.python-poetry.org -UseBasicParsing).Content ^| python -
    echo.
    echo    Option 2: Use simple mode (No Poetry needed)
    echo    Run: start_simple_en.bat
    echo.
    pause
    exit /b 1
)
poetry --version
echo OK: Poetry is installed
echo.

echo ========================================
echo Environment check passed!
echo ========================================
echo.

REM Create directories
if not exist "data" mkdir data
if not exist "data\logs" mkdir data\logs

REM Create config file if not exists
if not exist "data\risk_params.json" (
    echo Creating default config...
    (
        echo {
        echo   "ua": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        echo   "umidToken": "",
        echo   "asac": "2A21B24LA1SI0HB0EEVN03"
        echo }
    ) > data\risk_params.json
    echo Config file created
    echo.
)

REM Install dependencies if needed
if not exist "node_modules" (
    echo Installing dependencies...
    echo This may take a few minutes...
    echo.
    
    echo [1/2] Installing Node.js dependencies...
    call npm install
    if errorlevel 1 (
        echo.
        echo ERROR: Failed to install Node.js dependencies
        echo Please check your network connection
        echo.
        pause
        exit /b 1
    )
    echo Node.js dependencies installed
    echo.
    
    echo [2/2] Installing Python dependencies...
    poetry install
    if errorlevel 1 (
        echo.
        echo ERROR: Failed to install Python dependencies
        echo Please check your network connection
        echo.
        pause
        exit /b 1
    )
    echo Python dependencies installed
    echo.
)

echo ========================================
echo Starting services...
echo ========================================
echo.
echo Tips:
echo    - Frontend will start in a new window
echo    - Browser will open automatically at http://localhost:5173
echo    - Backend API runs at http://localhost:8000
echo    - Close this window to stop all services
echo.

REM Start frontend in new window
echo [1/2] Starting frontend service...
start "Tmall Snatcher - Frontend" cmd /k "npm run dev"

REM Wait for frontend to start
echo Waiting for frontend to start...
timeout /t 3 /nobreak >nul

REM Start backend
echo [2/2] Starting backend service...
cd backend
poetry run uvicorn main:app --reload --port 8000

echo.
echo Backend service stopped
echo.
pause
