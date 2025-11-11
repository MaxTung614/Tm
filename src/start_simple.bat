@echo off
chcp 65001 >nul
title 天猫礼享金抢购系统 - 简易启动

echo ========================================
echo 🎉 天猫礼享金抢购系统（简易版）
echo ========================================
echo.
echo 此脚本使用 pip 直接安装依赖，无需 Poetry
echo.

REM 检查 Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: 未检测到 Python
    echo 请先安装 Python 3.10+ 从 https://www.python.org/downloads/
    pause
    exit /b 1
)

REM 检查 Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: 未检测到 Node.js
    echo 请先安装 Node.js 18+ 从 https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ 环境检查通过
echo.

REM 创建虚拟环境（如果不存在）
if not exist "venv" (
    echo 📦 创建 Python 虚拟环境...
    python -m venv venv
    if errorlevel 1 (
        echo ❌ 虚拟环境创建失败
        pause
        exit /b 1
    )
)

REM 激活虚拟环境
call venv\Scripts\activate.bat

REM 安装 Python 依赖
echo 📦 安装 Python 依赖...
pip install fastapi uvicorn pydantic requests qrcode pillow python-multipart cryptography
if errorlevel 1 (
    echo ❌ Python 依赖安装失败
    pause
    exit /b 1
)

REM 安装 Node.js 依赖
if not exist "node_modules" (
    echo 📦 安装 Node.js 依赖...
    npm install
    if errorlevel 1 (
        echo ❌ Node.js 依赖安装失败
        pause
        exit /b 1
    )
)

REM 创建数据目录
if not exist "data" mkdir data

echo.
echo ========================================
echo 🚀 正在启动服务...
echo ========================================
echo.

REM 启动前端
start "前端服务" cmd /k "npm run dev"

REM 等待
timeout /t 2 /nobreak >nul

REM 启动后端
echo 📡 启动后端服务...
cd backend
python -m uvicorn main:app --reload --port 8000

pause
