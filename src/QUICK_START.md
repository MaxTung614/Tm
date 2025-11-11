# ⚡ 快速开始

## 🚀 一键启动

### Windows
```bash
start.bat          # 标准启动
start_en.bat       # 英文版（推荐，避免编码问题）
```

### Linux/Mac
```bash
python launcher.py
```

## 📱 访问系统

启动后自动打开：`http://localhost:5173`

## 🔑 首次配置

1. **扫码登录** - 使用手机淘宝扫码
2. **提取参数** - 进入"参数提取"页面
3. **开始抢购** - 创建任务或立即抢购

## 📚 完整文档

查看 [README.md](./README.md) 或 [docs/](./docs/) 目录

## ❓ 遇到问题

- **编码问题** → 使用 `start_en.bat`
- **端口占用** → 关闭占用 8000/5173 端口的程序
- **依赖问题** → 运行 `check_environment.bat`

## 🎯 项目结构

```
├── backend/      # Python后端
├── components/   # React组件
├── pages/        # 页面组件
├── TSDK/        # 淘宝SDK
├── tools/       # 工具脚本
└── docs/        # 📚 文档
```

**详细说明**: [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)
