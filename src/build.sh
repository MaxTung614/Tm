#!/bin/bash

# 天猫礼享金抢购系统 - Linux/Mac 打包脚本

set -e  # 遇到错误立即退出

echo "========================================"
echo "天猫礼享金抢购系统 - 自动打包脚本"
echo "========================================"
echo

# 检查 Python
if ! command -v python3 &> /dev/null; then
    echo "❌ 错误: 未检测到 Python，请先安装 Python 3.10+"
    exit 1
fi

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未检测到 Node.js，请先安装 Node.js 18+"
    exit 1
fi

echo "✅ 环境检查通过"
echo

# 步骤 1: 安装 Python 依赖
echo "[1/5] 📦 安装 Python 依赖..."
poetry install
echo "✅ Python 依赖安装完成"
echo

# 步骤 2: 安装 Node.js 依赖
echo "[2/5] 📦 安装 Node.js 依赖..."
npm install
echo "✅ Node.js 依赖安装完成"
echo

# 步骤 3: 构建前端
echo "[3/5] 🔨 构建前端项目..."
npm run build
echo "✅ 前端构建完成"
echo

# 步骤 4: 安装 PyInstaller
echo "[4/5] 📦 安装 PyInstaller..."
poetry add pyinstaller psutil --group dev
echo "✅ PyInstaller 安装完成"
echo

# 步骤 5: 打包应用
echo "[5/5] 📦 正在打包应用程序..."
poetry run pyinstaller build.spec --clean
echo "✅ 应用打包完成"
echo

echo "========================================"
echo "🎉 打包成功！"
echo "========================================"
echo
echo "📦 可执行文件位置: dist/TmallGiftSnatcher"
echo
echo "💡 使用方法:"
echo "   1. 运行 ./dist/TmallGiftSnatcher 启动程序"
echo "   2. 浏览器会自动打开并访问 http://localhost:5173"
echo "   3. 开始使用抢购系统"
echo
echo "📝 注意事项:"
echo "   - 首次使用需要提取风控参数"
echo "   - 确保 data 目录与可执行文件在同一目录"
echo "   - 建议将整个 dist 目录分发给用户"
echo
