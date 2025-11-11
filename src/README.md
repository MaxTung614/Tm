# 天猫礼享金抢购系统

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Python](https://img.shields.io/badge/python-3.10+-green.svg)
![Node](https://img.shields.io/badge/node-18+-green.svg)
![License](https://img.shields.io/badge/license-MIT-orange.svg)

**一个高效、稳定、安全的天猫礼享金自动抢购系统**

[功能特点](#-功能特点) • [快速开始](#-快速开始) • [使用文档](#-使用文档) • [打包分发](#-打包分发) • [技术栈](#-技术栈)

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

## 🚀 功能特点

### 1. 用户认证
- 📱 扫码登录 - 手机淘宝扫码，安全快捷
- 🔐 Cookie 管理 - 自动保存、加密存储、定期刷新
- 👤 多账号支持 - 无限账号，批量管理

### 2. 抢购功能
- ⚡ 自动抢购 - 定时任务，自动执行
- 🎯 精准控制 - 毫秒级时间精度
- 📊 实时监控 - 任务状态、执行日志
- 📈 数据统计 - 成功率分析、历史记录

### 3. 风控管理
- 🛡️ 参数提取 - 自动提取 UA、UMID Token
- 🔧 参数验证 - 实时验证参数有效性
- 📱 多设备支持 - 不同设备独立配置

### 4. 系统设置
- ⚙️ 灵活配置 - 自定义抢购策略
- 📝 日志记录 - 完整的操作日志
- 🔔 通知提醒 - 任务执行结果通知

---

## 🎯 快速开始

### 方式一：打包版（推荐普通用户）⭐

适合不懂技术的用户，无需配置环境！

```bash
# 1. 下载打包好的可执行文件
TmallGiftSnatcher.exe

# 2. 双击运行
# 浏览器会自动打开

# 3. 按照页面提示操作
# - 提取风控参数
# - 添加账号
# - 创建任务
# - 开始抢购！
```

📖 **详细教程**: [3 分钟快速上手指南](./QUICK_START_GUIDE.md)

---

### 方式二：源码版（推荐开发者）

适合想要自定义开发的用户。

#### 环境要求

- Python 3.10+
- Node.js 18+
- Poetry

#### 安装步骤

```bash
# 1. 克隆项目
git clone <项目地址>
cd 天猫礼享金抢购系统

# 2. 安装 Poetry（如果未安装）
# Windows (PowerShell 管理员模式)
(Invoke-WebRequest -Uri https://install.python-poetry.org -UseBasicParsing).Content | python -

# Linux/Mac
curl -sSL https://install.python-poetry.org | python3 -

# 3. 安装依赖
poetry install  # Python 依赖
npm install     # Node.js 依赖

# 4. 启动系统
# Windows: 双击 start.bat
# Linux/Mac: 见下方命令
```

#### Linux/Mac 启动

```bash
# 终端 1: 启动后端
cd backend
poetry run uvicorn main:app --reload --port 8000

# 终端 2: 启动前端
npm run dev
```

#### 访问系统

- 🌐 前端页面: http://localhost:5173
- 🔌 后端 API: http://localhost:8000
- 📚 API 文档: http://localhost:8000/docs

---

## 📚 使用文档

### 核心文档

| 文档 | 说明 | 适合人群 |
|------|------|---------|
| [快速上手指南](./QUICK_START_GUIDE.md) | 3 分钟入门教程 | 🔰 新手 |
| [用户操作指南](./USER_GUIDE.md) | 完整使用手册 | 👤 所有用户 |
| [打包分发指南](./PACKAGING_GUIDE.md) | 打包成 .exe 文件 | 👨‍💻 开发者 |
| [API 文档](./API_DOCUMENTATION.md) | API 接口说明 | 👨‍💻 开发者 |
| [完整技术解答](./FINAL_ANSWER.md) | 技术实现细节 | 🔧 高级用户 |

### 功能指南

| 文档 | 说明 |
|------|------|
| [自动抢购指南](./AUTO_RED_PACKET_GUIDE.md) | 抢购功能使用 |
| [多账号管理](./MULTI_ACCOUNT_GUIDE.md) | 多账号操作 |
| [设备管理](./DEVICE_MANAGEMENT_GUIDE.md) | 风控参数管理 |

### 技术文档

| 文档 | 说明 |
|------|------|
| [项目结构](./PROJECT_STRUCTURE.md) | 目录结构说明 |
| [开发规范](./guidelines/Guidelines.md) | 代码规范 |
| [工具使用](./tools/README.md) | 工具集说明 |
| [TSDK 说明](./TSDK/README.md) | TSDK 模块 |

---

## 📦 打包分发

### 自动打包（一键生成 .exe）

#### Windows

```bash
# 运行打包脚本
build.bat

# 等待打包完成
# 生成文件: dist/TmallGiftSnatcher.exe
```

#### Linux/Mac

```bash
# 添加执行权限
chmod +x build.sh

# 运行打包脚本
./build.sh

# 生成文件: dist/TmallGiftSnatcher
```

### 打包流程

```
前端构建 (npm run build)
    ↓
后端打包 (PyInstaller)
    ↓
合并为单个可执行文件
    ↓
TmallGiftSnatcher.exe
```

### 分发文件

```
TmallGiftSnatcher/
├── TmallGiftSnatcher.exe    # 主程序
├── data/
│   └── risk_params.json     # 风控参数
└── README.txt               # 使用说明
```

📖 **详细教程**: [打包分发指南](./PACKAGING_GUIDE.md)

---

## 🛠️ 技术栈

### 后端

- **框架**: FastAPI
- **语言**: Python 3.10+
- **依赖管理**: Poetry
- **API**: RESTful

### 前端

- **框架**: React 18
- **语言**: TypeScript
- **构建工具**: Vite
- **样式**: Tailwind CSS
- **UI 库**: shadcn/ui

### 核心模块

- **TSDK**: 淘宝 SDK 封装
- **Cookie 管理**: 加密存储
- **任务调度**: 定时执行
- **风控处理**: 参数管理

---

## 📋 功能清单

- [x] 扫码登录
- [x] Cookie 管理
- [x] 多账号管理
- [x] 礼享金抢购
- [x] 定时任务
- [x] 实时监控
- [x] 数据统计
- [x] 风控参数提取
- [x] 多设备管理
- [x] 批量操作
- [x] 日志记录
- [x] 错误处理
- [x] 打包分发

---

## 🎬 使用流程

```
1. 安装/下载
   ↓
2. 启动系统
   ↓
3. 提取风控参数（首次）
   ↓
4. 添加账号（扫码登录）
   ↓
5. 创建抢购任务
   ↓
6. 启动任务
   ↓
7. 监控执行
   ↓
8. 查看结果
```

---

## ⚠️ 注意事项

### 安全提示

1. **账号安全**
   - 不要泄露 Cookie
   - 定期更换密码
   - 不要在公共网络使用

2. **风控风险**
   - 不要频繁抢购
   - 建议间隔 3-5 秒
   - 避免同一账号多设备

3. **合法使用**
   - 仅供学习研究
   - 不要商业用途
   - 遵守平台规则

### 最佳实践

1. **参数管理**
   - 定期更新风控参数
   - 每个设备单独配置
   - 备份重要配置

2. **任务配置**
   - 合理设置执行时间
   - 避免任务冲突
   - 及时清理失败任务

3. **监控维护**
   - 定期查看日志
   - 关注系统通知
   - 及时处理异常

---

## ❓ 常见问题

### Q: 完全不懂编程，能用吗？

A: 能！下载打包版 `.exe` 文件，双击运行即可。[查看教程](./QUICK_START_GUIDE.md)

### Q: start.bat 运行后闪退怎么办？

A: 这通常是环境配置问题。[查看详细解决方案](./TROUBLESHOOTING.md#问题-1-startbat-闪退)

**快速解决**：
```bash
# 1. 运行环境诊断
check_environment.bat

# 2. 按提示安装缺失软件

# 3. 或使用简易启动（无需 Poetry）
start_simple.bat
```

### Q: 风控参数怎么提取？

A: 系统提供自动提取工具，也支持手动提取。[查看教程](./USER_GUIDE.md#风控参数提取)

### Q: 支持多个账号吗？

A: 支持！可以添加无限个账号，支持批量操作。

### Q: 抢购失败怎么办？

A: 检查风控参数是否正确，Cookie 是否过期。[查看故障排除](./TROUBLESHOOTING.md)

### Q: 支持哪些操作系统？

A: Windows 10/11、macOS 10.15+、Linux (Ubuntu/Debian)

📖 **更多问题**: [完整 FAQ](./USER_GUIDE.md#常见问题解答) | [故障排除指南](./TROUBLESHOOTING.md)