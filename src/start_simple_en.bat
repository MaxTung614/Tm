@echo off
title Tmall Gift Snatcher System - Simple Mode

echo ========================================
echo Tmall Gift Snatcher System (Simple Mode)
echo ========================================
echo.
echo This script uses pip to install dependencies (No Poetry needed)
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found
    echo Please install Python 3.10+ from https://www.python.org/downloads/
    pause
    exit /b 1
)

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found
    echo Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

echo Environment check passed
echo.

REM Create virtual environment if not exists
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo ERROR: Failed to create virtual environment
        pause
        exit /b 1
    )
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install Python dependencies
echo Installing Python dependencies...
pip install fastapi uvicorn pydantic requests qrcode pillow python-multipart cryptography
if errorlevel 1 (
    echo ERROR: Failed to install Python dependencies
    pause
    exit /b 1
)

REM Install Node.js dependencies
if not exist "node_modules" (
    echo Installing Node.js dependencies...
    npm install
    if errorlevel 1 (
        echo ERROR: Failed to install Node.js dependencies
        pause
        exit /b 1
    )
)

REM Create data directory
if not exist "data" mkdir data

echo.
echo ========================================
echo Starting services...
echo ========================================
echo.

REM Start frontend
start "Frontend Service" cmd /k "npm run dev"

REM Wait
timeout /t 2 /nobreak >nul

REM Start backend
echo Starting backend service...
cd backend
python -m uvicorn main:app --reload --port 8000

pause
