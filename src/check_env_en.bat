@echo off
title Environment Diagnostic Tool

echo ========================================
echo Environment Diagnostic Tool
echo ========================================
echo.
echo Checking your system environment...
echo.

REM Check Python
echo [1/5] Checking Python
echo ----------------------------------------
python --version >nul 2>&1
if errorlevel 1 (
    echo [X] Python: Not installed
    echo.
    echo Installation:
    echo    1. Visit https://www.python.org/downloads/
    echo    2. Download Python 3.10 or higher
    echo    3. Check "Add Python to PATH" during installation
    echo    4. Restart command prompt
    set PYTHON_OK=0
) else (
    python --version
    echo [OK] Python: Installed
    set PYTHON_OK=1
)
echo.

REM Check pip
echo [2/5] Checking pip
echo ----------------------------------------
pip --version >nul 2>&1
if errorlevel 1 (
    echo [X] pip: Not installed
    echo pip is usually installed with Python
    set PIP_OK=0
) else (
    pip --version
    echo [OK] pip: Installed
    set PIP_OK=1
)
echo.

REM Check Node.js
echo [3/5] Checking Node.js
echo ----------------------------------------
node --version >nul 2>&1
if errorlevel 1 (
    echo [X] Node.js: Not installed
    echo.
    echo Installation:
    echo    1. Visit https://nodejs.org/
    echo    2. Download LTS version
    echo    3. Install with default settings
    echo    4. Restart command prompt
    set NODE_OK=0
) else (
    node --version
    echo [OK] Node.js: Installed
    set NODE_OK=1
)
echo.

REM Check npm
echo [4/5] Checking npm
echo ----------------------------------------
npm --version >nul 2>&1
if errorlevel 1 (
    echo [X] npm: Not installed
    echo npm is usually installed with Node.js
    set NPM_OK=0
) else (
    npm --version
    echo [OK] npm: Installed
    set NPM_OK=1
)
echo.

REM Check Poetry
echo [5/5] Checking Poetry
echo ----------------------------------------
poetry --version >nul 2>&1
if errorlevel 1 (
    echo [!] Poetry: Not installed (Optional)
    echo.
    echo Installation (Optional):
    echo    Run in PowerShell (Admin mode):
    echo    (Invoke-WebRequest -Uri https://install.python-poetry.org -UseBasicParsing).Content ^| python -
    echo.
    echo Alternative: Use simple mode (No Poetry needed)
    echo    Run: start_simple_en.bat
    set POETRY_OK=0
) else (
    poetry --version
    echo [OK] Poetry: Installed
    set POETRY_OK=1
)
echo.

REM Check project dependencies
echo ========================================
echo Checking Project Dependencies
echo ========================================
echo.

if exist "node_modules" (
    echo [OK] Node.js dependencies: Installed
) else (
    echo [!] Node.js dependencies: Not installed
    echo Will be installed automatically when you run start script
)
echo.

if exist "pyproject.toml" (
    echo [OK] Python project config: Exists
) else (
    echo [X] Python project config: Not found
)
echo.

REM Check data directory
if exist "data" (
    echo [OK] Data directory: Exists
    if exist "data\risk_params.json" (
        echo [OK] Risk params config: Exists
    ) else (
        echo [!] Risk params config: Not found (Will be created on first run)
    )
) else (
    echo [!] Data directory: Not found (Will be created on first run)
)
echo.

REM Summary
echo ========================================
echo Diagnostic Summary
echo ========================================
echo.

if %PYTHON_OK%==1 if %NODE_OK%==1 (
    echo [OK] Basic environment: Complete
    echo.
    if %POETRY_OK%==1 (
        echo Recommended: start_en.bat
        echo    Double-click start_en.bat to launch the system
    ) else (
        echo Recommended: start_simple_en.bat
        echo    Double-click start_simple_en.bat to launch the system
        echo    (No Poetry needed)
    )
) else (
    echo [X] Basic environment: Incomplete
    echo.
    echo Need to install:
    if %PYTHON_OK%==0 echo    - Python 3.10+
    if %NODE_OK%==0 echo    - Node.js 18+
)
echo.

echo ========================================
echo Next Steps
echo ========================================
echo.

if %PYTHON_OK%==1 if %NODE_OK%==1 (
    if %POETRY_OK%==1 (
        echo 1. Double-click start_en.bat to launch the system
        echo 2. If you encounter issues, try start_simple_en.bat
    ) else (
        echo 1. Double-click start_simple_en.bat to launch the system
        echo 2. Or install Poetry and run start_en.bat (Optional)
    )
) else (
    echo 1. Install missing software as shown above
    echo 2. Restart command prompt after installation
    echo 3. Run this diagnostic tool again
)
echo.

echo Press any key to exit...
pause >nul
