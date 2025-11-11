# 项目结构说明

## 📁 目录结构

```
天猫礼享金抢购系统/
│
├── 📚 docs/                    # 文档中心
│   ├── guides/                # 使用指南
│   └── README.md             # 文档索引
│
├── 🔧 scripts/                # 启动脚本
│   └── README.md             # 脚本说明
│
├── 🐍 backend/                # Python 后端
│   ├── api/                  # API 路由
│   ├── services/             # 业务逻辑
│   ├── models/               # 数据模型
│   ├── utils/                # 工具函数
│   └── main.py              # 后端入口
│
├── ⚛️ 前端文件（根目录）
│   ├── components/           # React 组件
│   │   ├── auth/            # 认证组件
│   │   ├── layout/          # 布局组件
│   │   └── ui/              # UI组件库
│   ├── pages/               # 页面组件
│   ├── contexts/            # React上下文
│   ├── lib/                 # 工具库
│   ├── styles/              # 样式文件
│   ├── main.tsx            # 前端入口
│   └── index.html          # HTML模板
│
├── 📦 TSDK/                   # 淘宝SDK
│   ├── api/                  # API封装
│   ├── tools/                # 工具函数
│   └── storage/              # 存储管理
│
├── 🛠️ tools/                  # 工具脚本
│   ├── auto_extract_params.py  # 自动提取参数
│   ├── umid_token_extractor.py # UMID提取
│   ├── validate_params.py      # 参数验证
│   └── param_manager.py        # 参数管理
│
├── 💾 data/                   # 数据存储（运行时生成）
│   ├── cookies/              # Cookie存储
│   ├── accounts/             # 账号数据
│   └── risk_params.json     # 风控参数
│
├── 📝 配置文件
│   ├── package.json          # Node.js依赖
│   ├── pyproject.toml        # Python依赖
│   ├── vite.config.ts        # Vite配置
│   ├── tsconfig.json         # TypeScript配置
│   └── tailwind.config.js    # Tailwind配置
│
├── 🚀 启动文件
│   ├── launcher.py           # Python启动器
│   ├── start.bat            # Windows启动
│   ├── start_en.bat         # Windows启动（英文）
│   └── build.bat            # Windows构建
│
└── 📄 README.md              # 项目说明

```

## 🔍 关键文件说明

### 入口文件
- `launcher.py` - 主启动器，同时启动前后端
- `main.tsx` - React应用入口
- `backend/main.py` - FastAPI应用入口

### 配置文件
- `pyproject.toml` - Python项目配置（Poetry）
- `package.json` - Node.js项目配置
- `vite.config.ts` - Vite构建配置
- `tsconfig.json` - TypeScript配置

### 核心模块
- `backend/services/` - 核心业务逻辑
- `components/` - React组件
- `TSDK/` - 淘宝SDK封装
- `tools/` - 辅助工具脚本

## 📊 数据流向

```
用户界面 (React)
    ↓
API 路由 (FastAPI)
    ↓
业务服务 (Services)
    ↓
TSDK / 数据存储
```

## 🔐 数据存储

所有敏感数据存储在 `data/` 目录下：
- Cookie加密存储
- 账号信息加密
- 风控参数本地保存

## 🚀 运行流程

1. **启动**：`launcher.py` 或 `start.bat`
2. **后端**：启动 FastAPI 服务（端口 8000）
3. **前端**：启动 Vite 开发服务器（端口 5173）
4. **浏览器**：自动打开 `http://localhost:5173`

## 📦 构建输出

- `dist/` - 前端构建输出
- `build/` - Python打包临时文件
- `dist/TmallGiftSnatcher.exe` - 最终可执行文件

## 🔧 开发建议

### 添加新功能
1. 后端：在 `backend/services/` 添加业务逻辑
2. API：在 `backend/api/` 添加路由
3. 前端：在 `pages/` 或 `components/` 添加组件

### 修改样式
- 全局样式：`styles/globals.css`
- 组件样式：使用 Tailwind CSS 类

### 调试
- 后端：查看终端日志
- 前端：使用浏览器开发者工具
- 日志文件：`logs/app.log`

## 📚 更多信息

查看 [docs/README.md](./docs/README.md) 获取完整文档。
