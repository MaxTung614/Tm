@echo off
chcp 65001 >nul
echo ========================================
echo 天猫礼享金抢购系统 - 自动打包脚本
echo ========================================
echo.

REM 检查 Python 是否安装
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: 未检测到 Python，请先安装 Python 3.10+
    pause
    exit /b 1
)

REM 检查 Node.js 是否安装
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: 未检测到 Node.js，请先安装 Node.js 18+
    pause
    exit /b 1
)

echo ✅ 环境检查通过
echo.

REM 步骤 1: 安装 Python 依赖
echo [1/5] 📦 安装 Python 依赖...
poetry install
if errorlevel 1 (
    echo ❌ 错误: Poetry 依赖安装失败
    pause
    exit /b 1
)
echo ✅ Python 依赖安装完成
echo.

REM 步骤 2: 安装 Node.js 依赖
echo [2/5] 📦 安装 Node.js 依赖...
call npm install
if errorlevel 1 (
    echo ❌ 错误: npm 依赖安装失败
    pause
    exit /b 1
)
echo ✅ Node.js 依赖安装完成
echo.

REM 步骤 3: 构建前端
echo [3/5] 🔨 构建前端项目...
call npm run build
if errorlevel 1 (
    echo ❌ 错误: 前端构建失败
    pause
    exit /b 1
)
echo ✅ 前端构建完成
echo.

REM 步骤 4: 安装 PyInstaller
echo [4/5] 📦 安装 PyInstaller...
poetry add pyinstaller psutil --group dev
if errorlevel 1 (
    echo ❌ 错误: PyInstaller 安装失败
    pause
    exit /b 1
)
echo ✅ PyInstaller 安装完成
echo.

REM 步骤 5: 打包应用
echo [5/5] 📦 正在打包应用程序...
poetry run pyinstaller build.spec --clean
if errorlevel 1 (
    echo ❌ 错误: 应用打包失败
    pause
    exit /b 1
)
echo ✅ 应用打包完成
echo.

echo ========================================
echo 🎉 打包成功！
echo ========================================
echo.
echo 📦 可执行文件位置: dist\TmallGiftSnatcher.exe
echo.
echo 💡 使用方法:
echo    1. 双击 TmallGiftSnatcher.exe 启动程序
echo    2. 浏览器会自动打开并访问 http://localhost:5173
echo    3. 开始使用抢购系统
echo.
echo 📝 注意事项:
echo    - 首次使用需要提取风控参数
echo    - 确保 data 目录与 .exe 文件在同一目录
echo    - 建议将整个 dist 目录分发给用户
echo.
pause
