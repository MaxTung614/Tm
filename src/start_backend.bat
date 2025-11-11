@echo off
echo ========================================
echo 天猫礼享金抢购工具 - 后端服务启动
echo ========================================
echo.

echo [1/2] 检查 Python 环境...
python --version
if %errorlevel% neq 0 (
    echo 错误: Python 未安装或未添加到 PATH
    pause
    exit /b 1
)
echo.

echo [2/2] 启动后端服务...
echo 服务地址: http://localhost:8000
echo API 文档: http://localhost:8000/docs
echo.

python -m uvicorn backend.main:app --reload --port 8000

pause
