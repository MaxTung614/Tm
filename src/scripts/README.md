# 启动脚本说明

## Windows 用户

### 推荐使用
- `start.bat` - 标准启动脚本（中文）
- `start_en.bat` - 英文版启动脚本（避免编码问题）

### 简化版本
- `start_simple.bat` - 简化启动脚本（中文）
- `start_simple_en.bat` - 简化启动脚本（英文版）

### 环境检查
- `check_environment.bat` - 检查环境是否正确配置
- `check_env_en.bat` - 环境检查（英文版）

### 后端单独启动
- `start_backend.bat` - 仅启动后端服务

## Linux/Mac 用户

使用 Python 启动器：
```bash
python launcher.py
```

或手动启动：
```bash
# 后端
cd backend
poetry install
poetry run uvicorn main:app --reload --port 8000

# 前端（新终端）
npm install
npm run dev
```

## 构建脚本

- `build.bat` - Windows 构建脚本
- `build.sh` - Linux/Mac 构建脚本
- `build.spec` - PyInstaller 配置文件

## 注意事项

1. **首次运行**会自动安装依赖，需要几分钟
2. **编码问题**请使用 `*_en.bat` 英文版脚本
3. **防火墙**可能需要允许访问
4. **端口占用**如果 8000 或 5173 端口被占用，请关闭占用程序
