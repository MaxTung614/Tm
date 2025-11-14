# 🎯 天猫礼享金抢购系统

**Supabase 无后端版本 - 完全无需本地部署！**

<div align="center">

![Status](https://img.shields.io/badge/status-production%20ready-brightgreen)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![React](https://img.shields.io/badge/react-18.2.0-61dafb)
![Supabase](https://img.shields.io/badge/supabase-2.39.0-3ecf8e)
![TypeScript](https://img.shields.io/badge/typescript-5.2.2-3178c6)

[快速开始](#-快速开始) • [功能特性](#-功能特性) • [部署指南](#-部署) • [使用教程](#-使用流程) • [文档索引](#-文档)

</div>

---

## 📖 项目简介

这是一个基于 Supabase 的**完全无后端**天猫礼享金抢购系统。告别复杂的 Python 环境配置，只需浏览器即可使用！

### ✨ 为什么选择这个版本？

- ✅ **零配置后端** - 无需 Python、无需本地服务器
- ✅ **30分钟部署** - 从零到上线只需半小时
- ✅ **跨设备访问** - 电脑、手机、平板都能用
- ✅ **云端同步** - 数据实时同步，永不丢失
- ✅ **完全免费** - Supabase 免费层足够使用
- ✅ **经过验证** - 基于真实抓包数据开发，已成功兑换

### 🎯 核心目标

本系统专门针对 **11个指定的天猫红包** 进行优化抢购：

| 红包金额 | Benefit Code | 优先级 |
|---------|--------------|--------|
| 800元 | `ljx6666` | ⭐⭐⭐ |
| 500元 | `ljx888` | ⭐⭐⭐ |
| 300元 | `ljx999` | ⭐⭐⭐ |
| 其他8个 | 详见 [TARGET_RED_PACKETS.md](./TARGET_RED_PACKETS.md) | ⭐⭐ |

---

## 🚀 快速开始

### 📋 准备工作检查清单

开始前请确认：

- [ ] 已注册 Supabase 账号（免费）
- [ ] 已安装 Node.js 18+
- [ ] 已准备好 30 分钟时间
- [ ] 已准备好天猫账号

### ⚡ 3步快速部署

#### Step 1: 克隆并安装

```bash
# 1. 克隆项目
git clone <your-repo-url>
cd tmall-gift-snatcher

# 2. 安装依赖
npm install
```

#### Step 2: 配置 Supabase

```bash
# 1. 访问 https://supabase.com 创建项目
# 2. 在 SQL Editor 中执行 supabase-setup.sql
# 3. 复制 Project URL 和 anon key

# 4. 配置环境变量
cp .env.local.example .env.local

# 5. 编辑 .env.local
VITE_SUPABASE_URL=你的_项目_URL
VITE_SUPABASE_ANON_KEY=你的_匿名_密钥
VITE_ENCRYPTION_KEY=随机生成的32位密钥
```

#### Step 3: 启动应用

```bash
# 启动开发服务器
npm run dev

# 访问应用
# 打开浏览器访问：http://localhost:5173
# 使用测试账号登录：admin / admin
```

### 🎓 学习路径

**第1天：了解和部署**
1. 阅读本 README（10分钟）
2. 跟随 [Supabase部署指南.md](./Supabase部署指南.md) 完成部署（30分钟）
3. 验证应用可以正常启动

**第2天：配置参数**
1. 阅读 [风控参数提取完整指南.md](./风控参数提取完整指南.md)
2. 登录天猫，获取 Cookie
3. 提取 ua 和 umidToken 参数
4. 保存到系统并验证

**第3天：测试功能**
1. 添加测试账号
2. 获取红包列表
3. 选择小额红包测试抢购
4. 查看日志和结果

**第4天：正式使用**
1. 添加所有账号
2. 配置抢购策略
3. 开始抢购目标红包
4. 监控日志和统计

**详细步骤**：查看 [Supabase部署指南.md](./Supabase部署指南.md)

---

## ✨ 功能特性

### 🔐 账号管理

- 📱 **扫码登录** - 支持淘宝扫码，安全便捷
- 👥 **多账号支持** - 无限制添加多个天猫账号
- 🔒 **加密存储** - Cookie 使用 AES-256 加密
- 🔄 **自动同步** - 云端实时同步，多设备共享
- ✅ **状态验证** - 自动验证账号登录状态

### 🎯 抢购功能

- 📋 **礼品列表** - 实时获取可兑换红包列表
- ⚡ **立即抢购** - 毫秒级响应，极速兑换
- ⏰ **定时任务** - 精准到秒的定时抢购
- 🔁 **批量操作** - 支持多账号同时抢购
- 🎯 **智能重试** - 失败自动重试，提升成功率

### 📊 数据统计

- 📈 **实时统计** - 成功率、失败率实时展示
- 📝 **操作日志** - 详细记录每次操作
- 📊 **可视化展示** - 图表直观展示数据
- 🔍 **日志查询** - 支持按时间、状态筛选
- 💾 **数据导出** - 支持导出统计数据

### ⚙️ 参数管理

- 🔧 **风控参数** - UA、umidToken 智能提取
- 📱 **设备管理** - 支持多设备指纹管理
- ✅ **参数验证** - 自动检查参数有效性
- 🔄 **参数刷新** - asac 参数自动刷新（2分钟缓存）
- 📊 **参数监控** - 实时监控参数状态

### 🛡️ 风控对策

基于 10个真实抓包记录和 2次成功兑换的深入分析：

- ✅ **UA 指纹** - 实时生成，模拟真实浏览器
- ✅ **UMID Token** - 支持数字型和 Base64 型
- ✅ **asac 参数** - 从列表接口获取，2分钟有效期
- ✅ **签名算法** - 完整实现阿里 MD5 签名
- ✅ **Cookie 管理** - 自动维护 _m_h5_tk

---

## 💻 技术栈

### 前端架构

```
React 18.2.0          UI 框架
├─ TypeScript 5.2.2   类型安全
├─ Vite 5.0.8        快速构建
├─ Tailwind CSS 3.4  现代样式
├─ shadcn/ui         优质组件库
└─ React Router 6     路由管理
```

### 后端服务 (Supabase)

```
Supabase 2.39.0       BaaS 平台
├─ PostgreSQL        数据库
├─ Row Level Security 数据安全
├─ Realtime          实时更新
└─ Auth (可选)        用户认证
```

### 核心库

```typescript
@supabase/supabase-js  // Supabase 客户端
crypto-js              // AES 加密
react-router-dom       // 路由
lucide-react          // 图标库
sonner                // Toast 通知
```

### 自研核心模块

```typescript
lib/tsdk.ts           // 天猫 SDK（JavaScript 版本）
lib/supabase.ts       // 数据服务封装
lib/usePurchase.ts    // 抢购逻辑 Hook
```

---

## 📁 项目结构

```
天猫礼享金抢购系统/
│
├─ 📂 lib/                    # 核心库 (1200+ 行)
│  ├─ supabase.ts            # Supabase 客户端和数据服务
│  ├─ tsdk.ts                # JavaScript 版天猫 SDK
│  ├─ usePurchase.ts         # 抢购逻辑 React Hook
│  ├─ api-services.ts        # API 服务层
│  ├─ constants.ts           # 常量定义（11个红包配置）
│  ├─ error-handler.ts       # 统一错误处理
│  └─ network-interceptor.ts # 网络拦截器
│
├─ 📂 components/            # React 组件
│  ├─ auth/                 # 认证组件
│  │  └─ QRCodeLogin.tsx    # 扫码登录
│  ├─ layout/               # 布局组件
│  │  └─ Layout.tsx         # 主布局
│  ├─ ui/                   # UI 组件库 (shadcn/ui)
│  └─ ErrorBoundary.tsx     # 错误边界
│
├─ 📂 pages/                 # 页面组件 (7个)
│  ├─ Login.tsx             # 登录页
│  ├─ Dashboard.tsx         # 仪表盘（统计概览）
│  ├─ Accounts.tsx          # 账号管理（扫码登录）
│  ├─ Tasks.tsx             # 任务管理（创建抢购任务）
│  ├─ Monitor.tsx           # 实时监控（任务状态）
│  ├─ ExtractParams.tsx     # 参数提取（风控参数）
│  └─ Settings.tsx          # 系统设置
│
├─ 📂 contexts/              # React Context
│  └─ AuthContext.tsx       # 认证状态管理
│
├─ 📂 docs/                  # 文档目录
│  ├─ api-analysis/         # API 分析文档（15个）
│  │  ├─ README.md          # 索引
│  │  ├─ SUCCESS_COMPARISON.md  # 成功案例对比
│  │  ├─ AWSC_SECURITY_COMPONENTS.md  # 风控组件分析
│  │  └─ ...                # 其他 API 文档
│  └─ guidelines/           # 开发指南
│
├─ 📂 styles/
│  └─ globals.css           # 全局样式
│
├─ 📄 supabase-setup.sql    # 数据库初始化脚本
├─ 📄 package.json          # 项目配置
├─ 📄 tsconfig.json         # TypeScript 配置
├─ 📄 vite.config.ts        # Vite 配置
├─ 📄 tailwind.config.js    # Tailwind 配置
│
└─ 📚 文档文件
   ├─ README.md             # 项目主文档（本文件）
   ├─ DOCUMENTATION_INDEX.md # 文档索引（NEW!）
   ├─ Supabase部署指南.md   # 部署教程
   ├─ 风控参数提取完整指南.md # 参数提取教程
   ├─ TARGET_RED_PACKETS.md  # 目标红包配置
   ├─ PROJECT_STATUS.md      # 项目状态
   └─ ...                   # 其他文档
```

**完整结构**：查看 [PROJECT_STATUS.md](./PROJECT_STATUS.md)

---

## 📚 文档

### 🌟 新用户必读（推荐顺序）

| # | 文档 | 说明 | 时长 |
|---|------|------|------|
| 1 | [README.md](./README.md) | 项目概览（本文件）| 10分钟 |
| 2 | [Supabase部署指南.md](./Supabase部署指南.md) | 详细部署步骤 | 30分钟 |
| 3 | [风控参数提取完整指南.md](./风控参数提取完整指南.md) | 参数提取教程 | 15分钟 |

### 📖 核心文档

| 文档 | 说明 | 适用人群 |
|------|------|---------|
| [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md) | 📑 完整文档索引 | 所有人 |
| [TARGET_RED_PACKETS.md](./TARGET_RED_PACKETS.md) | 🎯 目标红包配置 | 使用者 |
| [PROJECT_STATUS.md](./PROJECT_STATUS.md) | 📊 项目状态报告 | 开发者 |
| [本地部署vs云端部署对比.md](./本地部署vs云端部署对比.md) | ⚖️ 方案对比分析 | 决策者 |

### 🔧 技术文档

| 文档 | 说明 | 适用人群 |
|------|------|---------|
| [Supabase无后端方案.md](./Supabase无后端方案.md) | 架构设计详解 | 开发者 |
| [SYSTEM_AUDIT_REPORT.md](./SYSTEM_AUDIT_REPORT.md) | 系统审计报告 | 开发者 |
| [FIXES_COMPLETED.md](./FIXES_COMPLETED.md) | 修复记录 | 开发者 |

### 📊 API 分析文档

**完整列表**：查看 [docs/api-analysis/README.md](./docs/api-analysis/README.md)

**核心文档**：
- [SUCCESS_COMPARISON.md](./docs/api-analysis/SUCCESS_COMPARISON.md) - 成功案例对比分析
- [AWSC_SECURITY_COMPONENTS.md](./docs/api-analysis/AWSC_SECURITY_COMPONENTS.md) - 阿里风控组件详解
- [CORE_EXCHANGE_API.md](./docs/api-analysis/CORE_EXCHANGE_API.md) - 核心兑换接口
- [IMPLEMENTATION_CHECKLIST.md](./docs/api-analysis/IMPLEMENTATION_CHECKLIST.md) - 实现检查清单

---

## 🔧 部署

### 环境要求

| 工具 | 版本 | 必需 |
|------|------|------|
| Node.js | 18.0+ | ✅ |
| npm | 9.0+ | ✅ |
| Supabase 账号 | 免费版 | ✅ |
| 现代浏览器 | - | ✅ |

### 详细部署步骤

#### 1. 创建 Supabase 项目

```bash
# 1. 访问 https://supabase.com
# 2. 点击 "New Project"
# 3. 填写项目信息：
#    - Name: tmall-gift-snatcher
#    - Database Password: 设置强密码
#    - Region: 选择离你最近的区域
# 4. 等待项目创建完成（约 2 分钟）
```

#### 2. 初始化数据库

```sql
-- 在 Supabase Dashboard 中：
-- 1. 进入 SQL Editor
-- 2. 点击 "New Query"
-- 3. 复制 supabase-setup.sql 的全部内容
-- 4. 点击 "Run" 执行

-- 将创建 4 张表：
-- ✅ accounts        (账号信息)
-- ✅ risk_params     (风控参数)
-- ✅ purchase_tasks  (抢购任务)
-- ✅ purchase_logs   (操作日志)
```

#### 3. 配置环境变量

```bash
# 1. 复制环境变量模板
cp .env.local.example .env.local

# 2. 在 Supabase Dashboard 中获取配置：
#    - 进入 Settings > API
#    - 复制 Project URL
#    - 复制 anon public key

# 3. 编辑 .env.local 文件
VITE_SUPABASE_URL=你的_项目_URL
VITE_SUPABASE_ANON_KEY=你的_匿名_密钥
VITE_ENCRYPTION_KEY=随机生成的32位字符串

# 4. 生成加密密钥（可选）
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### 4. 安装依赖

```bash
# 安装所有依赖
npm install

# 依赖包括：
# - @supabase/supabase-js  (Supabase 客户端)
# - crypto-js              (加密库)
# - react-router-dom       (路由)
# - lucide-react          (图标)
# - sonner                (通知)
# 以及其他...
```

#### 5. 启动应用

```bash
# 开发模式
npm run dev

# 应用将在以下地址启动：
# http://localhost:5173

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

**详细指南**：[Supabase部署指南.md](./Supabase部署指南.md)

---

## 🎯 使用流程

### 1. 登录系统

```
访问 http://localhost:5173
├─ 方式1: 使用测试账号
│  用户名: admin
│  密码: admin
│
└─ 方式2: 配置 Supabase Auth（可选）
```

### 2. 添加天猫账号

```
进入「账号管理」页面
├─ 点击「扫码登录」
├─ 使用手机淘宝扫码
├─ 系统自动保存 Cookie
└─ 验证账号状态（显示昵称和 UID）
```

### 3. 提取风控参数

```
进入「参数提取」页面
├─ Step 1: 提取 UA 指纹
│  └─ 在浏览器控制台执行脚本
│
├─ Step 2: 提取 UMID Token
│  └─ 从 localStorage 获取
│
└─ Step 3: 保存参数
   └─ 系统自动验证并保存
```

**详细教程**：[风控参数提取完整指南.md](./风控参数提取完整指南.md)

### 4. 配置抢购任务

```
进入「任务管理」页面
├─ 选择目标红包（11个指定红包）
├─ 选择抢购账号
├─ 设置抢购时间（立即/定时）
└─ 启动任务
```

### 5. 监控抢购结果

```
进入「实时监控」页面
├─ 查看任务状态（运行/成功/失败）
├─ 查看详细日志
├─ 查看成功率统计
└─ 导出数据（可选）
```

---

## 📊 数据库设计

### 核心表结构

#### 1. accounts - 账号信息表

```sql
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100),              -- 账号名称
  cookie TEXT,                    -- 加密的 Cookie
  is_active BOOLEAN DEFAULT true, -- 是否激活
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2. risk_params - 风控参数表

```sql
CREATE TABLE risk_params (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ua TEXT,                        -- UA 指纹
  umid_token TEXT,                -- UMID Token
  asac TEXT,                      -- asac 参数
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3. purchase_tasks - 抢购任务表

```sql
CREATE TABLE purchase_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES accounts(id),
  benefit_code VARCHAR(50),       -- 红包代码
  amount DECIMAL(10,2),          -- 红包金额
  scheduled_time TIMESTAMPTZ,     -- 定时执行时间
  status VARCHAR(20),             -- pending/running/success/failed
  result JSONB,                   -- 执行结果
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 4. purchase_logs - 操作日志表

```sql
CREATE TABLE purchase_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES purchase_tasks(id),
  account_id UUID REFERENCES accounts(id),
  level VARCHAR(20),              -- info/success/warning/error
  message TEXT,                   -- 日志消息
  details JSONB,                  -- 详细信息
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**完整 SQL**：[supabase-setup.sql](./supabase-setup.sql)

---

## 🔒 安全性

### 数据安全

```
Cookie 加密
├─ 算法: AES-256
├─ 密钥: 环境变量配置
└─ 存储: Supabase PostgreSQL

通信安全
├─ 协议: HTTPS
├─ 认证: Supabase Auth（可选）
└─ RLS: Row Level Security
```

### 隐私保护

- ✅ Cookie 在数据库中加密存储
- ✅ 不收集用户个人隐私信息
- ✅ 数据完全由用户控制
- ✅ 可随时删除所有数据
- ✅ 开源代码，完全透明

### 风控安全

```
UA 指纹
├─ 实时生成
├─ 模拟真实浏览器
└─ 每次请求更新

UMID Token
├─ 支持数字型
├─ 支持 Base64 型
└─ 从浏览器提取

asac 参数
├─ 从列表接口获取
├─ 2分钟缓存
└─ 自动刷新

签名算法
├─ MD5 签名
├─ 完整实现阿里算法
└─ 每次请求重新计算
```

---

## 🌟 核心优势

### vs 本地部署版本

| 特性 | 本地部署 | Supabase 版本 |
|------|----------|---------------|
| 后端环境 | ❌ 需要 Python 3.10+ | ✅ 无需后端 |
| 部署时间 | ❌ 2-4 小时 | ✅ 30 分钟 |
| 配置难度 | ❌ 复杂（环境、依赖）| ✅ 简单（3 个环境变量）|
| 跨设备使用 | ❌ 单机运行 | ✅ 任意设备访问 |
| 数据同步 | ❌ 不支持 | ✅ 实时同步 |
| 数据备份 | ❌ 需手动备份 | ✅ 自动备份 |
| 维护成本 | ❌ 高（需要维护服务器）| ✅ 极低（Supabase 管理）|
| 扩展性 | ❌ 受限于本地资源 | ✅ 云端自动扩展 |
| 成本 | 免费 | ✅ 免费（Supabase 免费层）|

### 技术亮点

**1. 完整的风控对策**
- ✅ 基于 10个真实抓包记录
- ✅ 2次成功兑换验证
- ✅ 100% 复现阿里风控算法

**2. 无服务器架构**
- ✅ 零后端配置
- ✅ 云端自动扩展
- ✅ 高可用性保障

**3. 类型安全**
- ✅ 全栈 TypeScript
- ✅ 编译时类型检查
- ✅ 智能代码提示

**4. 现代化 UI**
- ✅ 响应式设计
- ✅ 暗色模式支持
- ✅ 优秀的用户体验

---

## 🐛 问题排查

### 常见问题

#### 1. 应用无法启动

```bash
# 症状：npm run dev 报错

# 解决方案：
# 1. 检查 Node.js 版本
node --version  # 应该 >= 18.0

# 2. 清除依赖重新安装
rm -rf node_modules package-lock.json
npm install

# 3. 检查环境变量
cat .env.local  # 确认配置正确

# 4. 重启开发服务器
npm run dev
```

#### 2. 连接 Supabase 失败

```bash
# 症状：控制台显示连接错误

# 解决方案：
# 1. 检查 .env.local 配置
#    确认 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY 正确

# 2. 检查 Supabase 项目状态
#    访问 Supabase Dashboard，确认项目在线

# 3. 检查网络连接
#    确认可以访问 supabase.com

# 4. 查看浏览器控制台
#    按 F12 查看详细错误信息
```

#### 3. Cookie 保存失败

```bash
# 症状：扫码后提示保存失败

# 解决方案：
# 1. 检查加密密钥配置
#    确认 VITE_ENCRYPTION_KEY 已设置

# 2. 确认数据库表已创建
#    在 Supabase Dashboard 查看 accounts 表

# 3. 检查浏览器控制台错误
#    查看详细错误信息

# 4. 验证 Supabase 权限
#    确认 RLS 策略正确配置
```

#### 4. 参数提取失败

```bash
# 症状：无法提取 UA 或 umidToken

# 解决方案：
# 1. 确认在正确的页面
#    必须在天猫礼享金页面：
#    https://pages.tmall.com/wow/z/tmtjb/tjbshare/coin-exchange

# 2. 检查浏览器控制台
#    按 F12 打开控制台，粘贴提取脚本

# 3. 确认已登录天猫
#    未登录无法获取参数

# 4. 查看详细教程
#    参考：风控参数提取完整指南.md
```

#### 5. 抢购失败

```bash
# 症状：任务执行但抢购失败

# 可能原因及解决方案：

# 1. Cookie 过期
#    → 重新扫码登录

# 2. 参数过期
#    → 重新提取 UA 和 umidToken
#    → asac 自动刷新，无需手动

# 3. 红包已被抢完
#    → 查看红包状态
#    → 选择其他红包

# 4. 触发风控
#    → 检查参数是否正确
#    → 降低请求频率
#    → 查看日志详细错误

# 5. 网络问题
#    → 检查网络连接
#    → 重试操作
```

**更多问题**：查看各文档的「常见问题」章节或 [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)

---

## 📦 构建和部署

### 构建生产版本

```bash
# 构建
npm run build

# 输出目录：dist/
# 包含：
# - index.html
# - assets/*.js
# - assets/*.css
```

### 部署到 Vercel

```bash
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 登录 Vercel
vercel login

# 3. 部署
vercel

# 4. 配置环境变量
# 在 Vercel Dashboard 中添加：
# - VITE_SUPABASE_URL
# - VITE_SUPABASE_ANON_KEY
# - VITE_ENCRYPTION_KEY

# 5. 重新部署
vercel --prod
```

### 部署到 Netlify

```bash
# 1. 安装 Netlify CLI
npm i -g netlify-cli

# 2. 登录 Netlify
netlify login

# 3. 初始化
netlify init

# 4. 配置环境变量
netlify env:set VITE_SUPABASE_URL "你的URL"
netlify env:set VITE_SUPABASE_ANON_KEY "你的Key"
netlify env:set VITE_ENCRYPTION_KEY "你的密钥"

# 5. 部署
netlify deploy --prod
```

### 部署配置

**Vercel:**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "env": {
    "VITE_SUPABASE_URL": "@supabase-url",
    "VITE_SUPABASE_ANON_KEY": "@supabase-key",
    "VITE_ENCRYPTION_KEY": "@encryption-key"
  }
}
```

**Netlify:**
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 开发规范

```typescript
// 1. 代码风格
- 使用 TypeScript
- 遵循 ESLint 规则
- 使用 Prettier 格式化

// 2. 提交规范
- feat: 新功能
- fix: 修复 Bug
- docs: 文档更新
- style: 代码格式
- refactor: 重构
- test: 测试
- chore: 构建/工具

// 3. 分支管理
- main: 生产分支
- develop: 开发分支
- feature/*: 功能分支
- bugfix/*: 修复分支
```

### 参与方式

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## ⚠️ 免责声明

本项目仅供学习交流使用，请勿用于非法用途。

- ⚠️ 本工具仅用于技术研究和学习
- ⚠️ 使用本工具产生的任何后果由使用者自行承担
- ⚠️ 请遵守淘宝/天猫的用户协议和相关法律法规
- ⚠️ 不建议用于商业用途
- ⚠️ 开发者不对使用本工具造成的任何损失负责

---

## 📄 开源协议

MIT License

Copyright (c) 2025 Tmall Gift Snatcher

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## 📞 联系方式

- 📖 **完整文档**：查看 [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)
- 🐛 **问题反馈**：提交 GitHub Issue
- 💬 **讨论交流**：GitHub Discussions
- 📧 **邮件联系**：（如需要可添加）

---

## 🙏 致谢

### 技术支持

- [Supabase](https://supabase.com) - 提供优秀的 BaaS 平台
- [Vite](https://vitejs.dev) - 快速的构建工具
- [shadcn/ui](https://ui.shadcn.com) - 精美的 UI 组件库
- [Tailwind CSS](https://tailwindcss.com) - 现代化的 CSS 框架

### 参考项目

- 原始 TSDK Python 版本 - 提供了核心算法参考
- 天猫礼享金活动 - 提供了业务场景

---

<div align="center">

**✨ 祝您抢购成功！✨**

Made with ❤️ using React + Supabase + TypeScript

---

**快速链接**

[📖 文档索引](./DOCUMENTATION_INDEX.md) • 
[🚀 部署指南](./Supabase部署指南.md) • 
[🔧 参数提取](./风控参数提取完整指南.md) • 
[🎯 目标红包](./TARGET_RED_PACKETS.md)

---

[⬆ 返回顶部](#-天猫礼享金抢购系统)

</div>

---

**最后更新**: 2025-11-13  
**项目版本**: 1.0.0  
**项目状态**: ✅ 生产就绪  
**文档版本**: 2.0.0 (优化版)
