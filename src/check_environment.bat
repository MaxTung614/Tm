@echo off
chcp 65001 >nul
title 环境诊断工具

echo ========================================
echo 🔍 环境诊断工具
echo ========================================
echo.
echo 正在检查您的系统环境...
echo.

REM 检查 Python
echo [1/5] 检查 Python
echo ----------------------------------------
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python: 未安装
    echo.
    echo 📥 安装方法:
    echo    1. 访问 https://www.python.org/downloads/
    echo    2. 下载 Python 3.10 或更高版本
    echo    3. 安装时务必勾选 "Add Python to PATH"
    echo    4. 重启命令行窗口
    set PYTHON_OK=0
) else (
    python --version
    echo ✅ Python: 已安装
    set PYTHON_OK=1
)
echo.

REM 检查 pip
echo [2/5] 检查 pip
echo ----------------------------------------
pip --version >nul 2>&1
if errorlevel 1 (
    echo ❌ pip: 未安装
    echo 💡 pip 通常随 Python 一起安装，请重新安装 Python
    set PIP_OK=0
) else (
    pip --version
    echo ✅ pip: 已安装
    set PIP_OK=1
)
echo.

REM 检查 Node.js
echo [3/5] 检查 Node.js
echo ----------------------------------------
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js: 未安装
    echo.
    echo 📥 安装方法:
    echo    1. 访问 https://nodejs.org/
    echo    2. 下载 LTS（长期支持）版本
    echo    3. 默认安装即可
    echo    4. 重启命令行窗口
    set NODE_OK=0
) else (
    node --version
    echo ✅ Node.js: 已安装
    set NODE_OK=1
)
echo.

REM 检查 npm
echo [4/5] 检查 npm
echo ----------------------------------------
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm: 未安装
    echo 💡 npm 通常随 Node.js 一起安装，请重新安装 Node.js
    set NPM_OK=0
) else (
    npm --version
    echo ✅ npm: 已安装
    set NPM_OK=1
)
echo.

REM 检查 Poetry
echo [5/5] 检查 Poetry
echo ----------------------------------------
poetry --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Poetry: 未安装（可选）
    echo.
    echo 📥 安装方法（可选）:
    echo    打开 PowerShell（管理员模式），运行:
    echo    (Invoke-WebRequest -Uri https://install.python-poetry.org -UseBasicParsing).Content ^| python -
    echo.
    echo 💡 或者使用简易启动模式（无需 Poetry）:
    echo    双击运行 start_simple.bat
    set POETRY_OK=0
) else (
    poetry --version
    echo ✅ Poetry: 已安装
    set POETRY_OK=1
)
echo.

REM 检查项目依赖
echo ========================================
echo 📦 检查项目依赖
echo ========================================
echo.

if exist "node_modules" (
    echo ✅ Node.js 依赖: 已安装
) else (
    echo ⚠️  Node.js 依赖: 未安装
    echo 💡 运行 start.bat 或 start_simple.bat 会自动安装
)
echo.

if exist "pyproject.toml" (
    echo ✅ Python 项目配置: 存在
) else (
    echo ❌ Python 项目配置: 不存在
)
echo.

REM 检查数据目录
if exist "data" (
    echo ✅ 数据目录: 存在
    if exist "data\risk_params.json" (
        echo ✅ 风控参数配置: 存在
    ) else (
        echo ⚠️  风控参数配置: 不存在（首次运行时会自动创建）
    )
) else (
    echo ⚠️  数据目录: 不存在（首次运行时会自动创建）
)
echo.

REM 总结
echo ========================================
echo 📊 诊断总结
echo ========================================
echo.

if %PYTHON_OK%==1 if %NODE_OK%==1 (
    echo ✅ 基础环境: 完整
    echo.
    if %POETRY_OK%==1 (
        echo ✅ 推荐启动方式: start.bat
        echo    双击运行 start.bat 即可启动系统
    ) else (
        echo ✅ 推荐启动方式: start_simple.bat
        echo    双击运行 start_simple.bat 即可启动系统
        echo    （无需安装 Poetry）
    )
) else (
    echo ❌ 基础环境: 不完整
    echo.
    echo 📋 需要安装:
    if %PYTHON_OK%==0 echo    - Python 3.10+
    if %NODE_OK%==0 echo    - Node.js 18+
    echo.
    echo 💡 或者使用打包版:
    echo    如果您不想安装这些环境，可以等待开发者提供
    echo    打包好的 .exe 文件，双击即可使用！
)
echo.

echo ========================================
echo 🔧 下一步操作建议
echo ========================================
echo.

if %PYTHON_OK%==1 if %NODE_OK%==1 (
    if %POETRY_OK%==1 (
        echo 1. 双击运行 start.bat 启动系统
        echo 2. 如果遇到问题，可以尝试 start_simple.bat
    ) else (
        echo 1. 双击运行 start_simple.bat 启动系统
        echo 2. 或安装 Poetry 后运行 start.bat（可选）
    )
) else (
    echo 1. 按照上面的提示安装缺失的软件
    echo 2. 安装完成后重新运行此诊断工具
    echo 3. 或者等待打包版 .exe 文件
)
echo.

echo 按任意键退出...
pause >nul
