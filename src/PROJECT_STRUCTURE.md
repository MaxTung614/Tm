# 天猫礼享金抢购系统 - 项目结构

## 📁 项目目录结构

```
天猫礼享金抢购系统/
├── 📂 backend/                    # 后端服务
│   ├── api/                       # API 路由
│   │   ├── accounts.py           # 账号管理接口
│   │   ├── auth.py               # 认证接口
│   │   ├── gifts.py              # 礼品接口
│   │   ├── risk_params.py        # 风控参数接口
│   │   ├── settings.py           # 设置接口
│   │   ├── stats.py              # 统计接口
│   │   └── tasks.py              # 任务接口
│   ├── models/                    # 数据模型
│   │   └── schemas.py            # Pydantic 模型
│   ├── services/                  # 业务逻辑
│   │   ├── account_service.py    # 账号服务
│   │   ├── auth_service.py       # 认证服务
│   │   ├── device_service.py     # 设备服务
│   │   ├── gift_service.py       # 礼品服务
│   │   ├── risk_params_service.py # 风控参数服务
│   │   ├── settings_service.py   # 设置服务
│   │   ├── stats_service.py      # 统计服务
│   │   └── task_service.py       # 任务服务
│   ├── utils/                     # 工具类
│   │   └── cookie_storage.py    # Cookie 存储
│   └── main.py                    # FastAPI 入口
│
├── 📂 TSDK/                       # 淘宝 SDK
│   ├── api/                       # API 封装
│   │   ├── taobao/               # 淘宝 API
│   │   │   ├── gift.py          # 礼享金 API
│   │   │   └── h5.py            # H5 登录 API
│   │   ├── types/                # 类型定义
│   │   │   └── taobao.py        # 淘宝类型
│   │   └── base.py               # 基础 API 类
│   ├── storage/                   # 存储管理
│   │   └── cookie_manager.py    # Cookie 管理器
│   ├── tools/                     # 工具集
│   │   └── extract_browser_params.py  # 参数提取
│   └── main.py                    # TSDK 主程序
│
├── 📂 tools/                      # 独立工具集
│   ├── umid_token_extractor.py   # UMID Token 提取器
│   ├── auto_extract_params.py    # 自动参数提取器
│   ├── param_manager.py          # 参数管理器
│   ├── validate_params.py        # 参数验证器
│   └── README.md                 # 工具使用说明
│
├── 📂 components/                 # React 组件
│   ├── auth/                     # 认证组件
│   │   └── QRCodeLogin.tsx      # 二维码登录
│   ├── layout/                   # 布局组件
│   │   └── Layout.tsx           # 主布局
│   └── ui/                       # UI 组件（shadcn/ui）
│
├── 📂 pages/                      # 页面组件
│   ├── Dashboard.tsx             # 仪表盘
│   ├── Accounts.tsx              # 账号管理
│   ├── Tasks.tsx                 # 任务管理
│   ├── Settings.tsx              # 系统设置
│   ├── ExtractParams.tsx         # 参数提取
│   └── Login.tsx                 # 登录页
│
├── 📂 contexts/                   # React Context
│   └── AuthContext.tsx           # 认证上下文
│
├── 📂 lib/                        # 工具库
│   ├── api-client.ts             # API 客户端
│   ├── api-config.ts             # API 配置
│   └── api-services.ts           # API 服务
│
├── 📂 data/                       # 数据目录
│   └── risk_params.json          # 风控参数配置
│
├── 📂 styles/                     # 样式文件
│   └── globals.css               # 全局样式
│
├── 📂 guidelines/                 # 项目指南
│   └── Guidelines.md             # 开发指南
│
├── 📄 App.tsx                     # React 主组件
├── 📄 main.tsx                    # React 入口
├── 📄 index.html                  # HTML 入口
│
├── 📄 pyproject.toml              # Python 项目配置
├── 📄 poetry.lock                 # Python 依赖锁定
├── 📄 package.json                # Node.js 项目配置
│
├── 📄 vite.config.ts              # Vite 配置
├── 📄 tsconfig.json               # TypeScript 配置
│
├── 📄 start_backend.bat           # Windows 启动脚本
│
└── 📄 文档目录/
    ├── README.md                  # 项目主文档
    ├── FINAL_ANSWER.md            # 完整解答文档
    ├── AUTO_RED_PACKET_GUIDE.md   # 自动抢购指南
    ├── MULTI_ACCOUNT_GUIDE.md     # 多账号指南
    ├── DEVICE_MANAGEMENT_GUIDE.md # 设备管理指南
    └── API_DOCUMENTATION.md       # API 文档
```

## 🎯 核心模块说明

### 1. 后端服务（Backend）
- **FastAPI** 驱动的 RESTful API
- 多账号管理和认证
- 任务调度和执行
- Cookie 安全存储
- 风控参数管理

### 2. TSDK 模块
- 淘宝 API 封装
- 礼享金抢购逻辑
- H5 扫码登录
- Cookie 管理
- 风控参数处理

### 3. 独立工具集（Tools）
- **umid_token_extractor.py**: UMID Token 提取
- **auto_extract_params.py**: 自动参数提取
- **param_manager.py**: 参数管理
- **validate_params.py**: 参数验证

### 4. 前端应用
- **React 18** + **TypeScript**
- **Tailwind CSS** + **shadcn/ui**
- 响应式设计
- 多账号界面
- 实时数据展示

## 📦 配置文件

### Python 环境
- `pyproject.toml`: Poetry 项目配置
- `poetry.lock`: 依赖版本锁定

### Node.js 环境
- `package.json`: npm 依赖配置
- `vite.config.ts`: Vite 构建配置
- `tsconfig.json`: TypeScript 编译配置

### 数据配置
- `data/risk_params.json`: 风控参数配置

## 🚀 快速启动

### 1. 启动后端
```bash
# Windows
start_backend.bat

# Linux/Mac
cd backend
poetry run uvicorn main:app --reload --port 8000
```

### 2. 启动前端
```bash
npm install
npm run dev
```

### 3. 访问应用
打开浏览器访问: http://localhost:5173

## 📚 文档索引

| 文档 | 说明 |
|------|------|
| README.md | 项目主文档 |
| FINAL_ANSWER.md | 完整技术解答 |
| AUTO_RED_PACKET_GUIDE.md | 自动抢购使用指南 |
| MULTI_ACCOUNT_GUIDE.md | 多账号管理指南 |
| DEVICE_MANAGEMENT_GUIDE.md | 设备管理指南 |
| API_DOCUMENTATION.md | API 接口文档 |
| tools/README.md | 工具使用说明 |
| TSDK/README.md | TSDK 模块说明 |
| guidelines/Guidelines.md | 开发规范指南 |

## 🔧 开发规范

- **代码风格**: 遵循 PEP 8（Python）和 ESLint（TypeScript）
- **组件设计**: 单一职责原则，组件化开发
- **API 设计**: RESTful 风格，标准化响应
- **错误处理**: 统一的异常处理机制
- **安全性**: Cookie 加密存储，风控参数保护

## 📝 注意事项

1. **风控参数**: 已硬编码 `asac` 参数，可多账号共用
2. **Cookie 存储**: 采用加密存储，确保账号安全
3. **多设备支持**: 支持不同设备的风控参数管理
4. **定时任务**: 支持自动抢购和定时执行
5. **日志记录**: 完整的操作日志和错误追踪

## 🎉 项目特点

✅ 完整的前后端分离架构  
✅ 多账号并发抢购支持  
✅ 实时数据展示和统计  
✅ 安全的 Cookie 管理  
✅ 灵活的风控参数配置  
✅ 用户友好的界面设计  
✅ 完善的错误处理机制  
✅ 详细的开发文档  

---

**版本**: v1.0.0  
**最后更新**: 2025-11-10
