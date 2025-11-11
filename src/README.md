# 天猫礼享金抢购系统

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Python](https://img.shields.io/badge/python-3.10+-green.svg)
![Node](https://img.shields.io/badge/node-18+-green.svg)
![License](https://img.shields.io/badge/license-MIT-orange.svg)

**一个高效、稳定、安全的天猫礼享金自动抢购系统**

[快速开始](#-快速开始) • [功能特点](#-功能特点) • [技术栈](#-技术栈) • [文档](#-文档)

</div>

---

## 📖 项目简介

天猫礼享金抢购系统是一个基于 TSDK 的自动化抢购工具，采用前后端分离架构，支持多账号管理、定时任务、实时监控等功能。

### 核心优势

- ✅ **毫秒级响应** - 精准的抢购时机控制
- ✅ **多账号管理** - 支持无限账号，批量操作
- ✅ **安全可靠** - Cookie 加密存储，风控参数保护
- ✅ **简单易用** - 可视化界面，一键启动
- ✅ **灵活配置** - 支持多设备、多参数管理

---

## 🚀 快速开始

### Windows 用户

```bash
# 双击运行启动脚本（推荐）
start.bat

# 或使用英文版（避免编码问题）
start_en.bat
```

### Linux/Mac 用户

```bash
# 使用 Python 启动器
python launcher.py
```

### 首次使用

1. 系统启动后自动打开浏览器 `http://localhost:5173`
2. 点击"扫码登录"，使用手机淘宝扫码
3. 进入"参数提取"页面提取风控参数
4. 开始抢购！

📚 **详细教程**: 
- [快速开始](./QUICK_START.md) - 3分钟上手指南
- [完整文档](./docs/README.md) - 查看所有文档
- [项目结构](./PROJECT_STRUCTURE.md) - 了解代码结构

---

## ✨ 功能特点

### 🔐 账号管理
- 多账号支持，无限制添加
- 扫码登录，安全便捷
- Cookie 加密存储
- 设备参数自动提取

### 🎯 抢购功能
- 实时礼品列表
- 一键立即抢购
- 定时任务调度
- 多账号批量抢购

### 📊 数据统计
- 实时抢购统计
- 成功率分析
- 任务执行日志
- 可视化数据展示

### ⚙️ 系统设置
- 风控参数管理
- 多设备配置
- 参数验证工具
- 系统配置优化

---

## 💻 技术栈

### 后端
- **Python 3.10+** - 核心语言
- **FastAPI** - 高性能 Web 框架
- **TSDK** - 淘宝 SDK
- **APScheduler** - 任务调度
- **Cryptography** - 加密存储

### 前端
- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **Tailwind CSS** - 样式框架
- **shadcn/ui** - UI 组件库

---

## 📁 项目结构

```
├── backend/           # Python 后端
│   ├── api/          # API 路由
│   ├── services/     # 业务逻辑
│   ├── models/       # 数据模型
│   └── utils/        # 工具函数
├── src/              # React 前端（通过符号链接）
├── components/       # React 组件
├── pages/           # 页面组件
├── TSDK/            # 淘宝 SDK
├── tools/           # 工具脚本
├── docs/            # 📚 文档中心
└── scripts/         # 启动脚本
```

---

## 📚 文档

- 📖 [文档中心](./docs/README.md) - 所有文档汇总
- 🚀 [快速开始](./docs/guides/QUICK_START.md) - 3分钟快速上手
- 📱 [完整指南](./docs/guides/USER_GUIDE.md) - 详细使用说明
- 🛠️ [API 文档](./docs/api/API_DOCUMENTATION.md) - 接口文档
- 🐛 [故障排除](./docs/troubleshooting/TROUBLESHOOTING.md) - 问题解决

---

## 🔧 环境要求

### 开发环境
- Python 3.10+
- Node.js 18+
- Poetry (Python 包管理)

### 生产环境
- 仅需下载打包后的 `.exe` 文件（无需安装任何环境）

---

## 📦 打包分发

```bash
# Windows
build.bat

# Linux/Mac
./build.sh
```

生成的可执行文件位于 `dist/` 目录。

详细说明: [打包指南](./docs/deployment/PACKAGING.md)

---

## ⚠️ 免责声明

本项目仅供学习交流使用，请勿用于非法用途。使用本工具产生的任何后果由使用者自行承担。

---

## 📄 开源协议

MIT License - 详见 [LICENSE](./LICENSE) 文件

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

<div align="center">

**祝您抢购成功！** 🎉

Made with ❤️ by Community

</div>