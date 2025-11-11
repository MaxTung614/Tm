@echo off
chcp 65001 >nul
title 天猫礼享金抢购系统

echo ========================================
echo 🎉 天猫礼享金抢购系统
echo ========================================
echo.
echo 正在检查运行环境...
echo.

REM 保存当前目录
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

REM 检查 Python
echo [1/3] 检查 Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: 未检测到 Python
    echo.
    echo 💡 解决方案:
    echo    1. 下载并安装 Python 3.10+ 从 https://www.python.org/downloads/
    echo    2. 安装时勾选 "Add Python to PATH"
    echo    3. 或者使用打包版（运行 build.bat 生成 .exe 文件）
    echo.
    pause
    exit /b 1
)
python --version
echo ✅ Python 已安装
echo.

REM 检查 Node.js
echo [2/3] 检查 Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: 未检测到 Node.js
    echo.
    echo 💡 解决方案:
    echo    1. 下载并安装 Node.js 18+ 从 https://nodejs.org/
    echo    2. 安装 LTS 版本（推荐）
    echo    3. 或者使用打包版（运行 build.bat 生成 .exe 文件）
    echo.
    pause
    exit /b 1
)
node --version
echo ✅ Node.js 已安装
echo.

REM 检查 Poetry
echo [3/3] 检查 Poetry...
poetry --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: 未检测到 Poetry
    echo.
    echo 💡 解决方案（选择一种）:
    echo.
    echo    方式一: 安装 Poetry（推荐）
    echo    在 PowerShell 管理员模式下运行:
    echo    (Invoke-WebRequest -Uri https://install.python-poetry.org -UseBasicParsing).Content ^| python -
    echo.
    echo    方式二: 使用 pip 直接安装依赖
    echo    运行: start_simple.bat
    echo.
    echo    方式三: 使用打包版
    echo    运行: build.bat 生成 .exe 文件
    echo.
    pause
    exit /b 1
)
poetry --version
echo ✅ Poetry 已安装
echo.

echo ========================================
echo ✅ 环境检查通过！
echo ========================================
echo.

REM 创建必要的目录
if not exist "data" mkdir data
if not exist "data\logs" mkdir data\logs

REM 检查并创建风控参数文件
if not exist "data\risk_params.json" (
    echo 💡 首次运行，正在创建默认配置...
    (
        echo {
        echo   "ua": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        echo   "umidToken": "",
        echo   "asac": "2A21B24LA1SI0HB0EEVN03"
        echo }
    ) > data\risk_params.json
    echo ✅ 配置文件已创建
    echo.
)

REM 检查依赖是否已安装
if not exist "node_modules" (
    echo 📦 检测到首次运行，正在安装依赖...
    echo 这可能需要几分钟时间，请耐心等待...
    echo.
    
    echo [1/2] 安装 Node.js 依赖...
    call npm install
    if errorlevel 1 (
        echo.
        echo ❌ Node.js 依赖安装失败
        echo 💡 请检查网络连接或手动运行: npm install
        echo.
        pause
        exit /b 1
    )
    echo ✅ Node.js 依赖安装完成
    echo.
    
    echo [2/2] 安装 Python 依赖...
    poetry install
    if errorlevel 1 (
        echo.
        echo ❌ Python 依赖安装失败
        echo 💡 请检查网络连接或手动运行: poetry install
        echo.
        pause
        exit /b 1
    )
    echo ✅ Python 依赖安装完成
    echo.
)

echo ========================================
echo 🚀 正在启动服务...
echo ========================================
echo.
echo 📝 提示:
echo    - 前端服务会在新窗口中启动
echo    - 浏览器将自动打开 http://localhost:5173
echo    - 后端 API 运行在 http://localhost:8000
echo    - 关闭此窗口将停止所有服务
echo.

REM 启动前端（在新窗口中）
echo [1/2] 📡 启动前端服务...
start "天猫抢购系统 - 前端服务" cmd /k "npm run dev"

REM 等待前端启动
echo 等待前端服务启动...
timeout /t 3 /nobreak >nul

REM 启动后端
echo [2/2] 📡 启动后端服务...
cd backend
poetry run uvicorn main:app --reload --port 8000

REM 如果后端异常退出，显示错误信息
echo.
echo ⚠️  后端服务已停止
echo.
pause
