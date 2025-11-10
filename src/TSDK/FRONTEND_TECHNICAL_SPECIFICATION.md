# 🎨 前端技术方案说明书

**项目名称**: 天猫礼享金红包抢购系统 - Web前端  
**版本**: v1.0.0  
**日期**: 2025-11-10

---

## 📋 技术栈选型

### 前端技术栈

```
核心框架:     React 18+
UI框架:       Tailwind CSS v4.0
组件库:       shadcn/ui
图标库:       lucide-react
状态管理:     React Hooks (useState, useEffect, useContext)
HTTP客户端:   fetch API
路由:         React Router v6
动画:         motion/react (Framer Motion)
表单管理:     react-hook-form + zod
通知:         sonner (toast)
日期处理:     date-fns
```

### 后端技术栈

```
Web框架:      FastAPI
CORS:         fastapi-cors
认证:         JWT
API文档:      自动生成 (FastAPI)
部署:         Uvicorn
```

### 部署方案

```
前端部署:     Vercel / Netlify
后端部署:     云服务器 / Docker
数据库:       SQLite (开发) / PostgreSQL (生产)
```

---

## 🎯 功能模块设计

### 1. 用户认证模块

**功能**:
- Cookie导入和管理
- 多账号支持
- Cookie有效性检测
- 自动登录

**页面**:
- 登录页面 (`/login`)
- Cookie管理页面 (`/settings/cookies`)

### 2. 红包管理模块

**功能**:
- 红包列表展示
- 实时余额显示
- 一键抢购
- 批量抢购
- 定时抢购

**页面**:
- 红包列表页 (`/dashboard`)
- 红包详情页 (`/red-packet/:id`)

### 3. 任务管理模块

**功能**:
- 创建定时任务
- 任务列表展示
- 任务状态监控
- 任务历史记录

**页面**:
- 任务中心 (`/tasks`)
- 创建任务 (`/tasks/create`)

### 4. 设置模块

**功能**:
- Cookie管理
- 参数配置
- 账号切换
- 系统设置

**页面**:
- 设置页面 (`/settings`)

---

## 🎨 界面设计规范

### 设计原则

```
1. 简洁明了 - 核心功能一目了然
2. 响应迅速 - 即时反馈用户操作
3. 视觉统一 - 保持设计语言一致
4. 移动优先 - 优先考虑移动端体验
```

### 颜色系统

```css
/* 主色调 */
--primary: #FF6B35        /* 红包橙色 */
--primary-dark: #E85A2A   /* 深橙色 */
--primary-light: #FF8C61  /* 浅橙色 */

/* 中性色 */
--background: #FFFFFF     /* 背景白色 */
--foreground: #1A1A1A     /* 文字黑色 */
--muted: #F5F5F5         /* 次要背景 */
--border: #E5E5E5        /* 边框颜色 */

/* 状态色 */
--success: #22C55E       /* 成功绿色 */
--warning: #F59E0B       /* 警告黄色 */
--error: #EF4444         /* 错误红色 */
--info: #3B82F6          /* 信息蓝色 */
```

### 布局规范

```
容器宽度:     max-w-7xl (1280px)
间距基准:     4px (Tailwind spacing scale)
圆角:         rounded-lg (8px)
阴影:         shadow-sm, shadow-md, shadow-lg
```

### 字体系统

```
标题H1:      text-3xl font-bold (30px)
标题H2:      text-2xl font-semibold (24px)
标题H3:      text-xl font-semibold (20px)
正文:        text-base (16px)
小字:        text-sm (14px)
极小:        text-xs (12px)
```

---

## 📱 响应式设计

### 断点设置

```css
/* Tailwind 默认断点 */
sm:  640px   /* 手机横屏 */
md:  768px   /* 平板 */
lg:  1024px  /* 笔记本 */
xl:  1280px  /* 桌面 */
2xl: 1536px  /* 大屏 */
```

### 响应式策略

**移动端 (< 768px)**
```
- 单列布局
- 底部导航栏
- 全屏弹窗
- 触摸优化按钮
```

**平板 (768px - 1024px)**
```
- 两列布局
- 侧边导航栏
- 弹出式弹窗
- 混合交互
```

**桌面 (> 1024px)**
```
- 多列布局
- 固定侧边栏
- 模态弹窗
- 鼠标优化
```

---

## 🔌 后端集成方案

### API架构

```
前端 (React)  <-->  API Gateway  <-->  Python后端 (FastAPI)
                         |
                         v
                    Cookie存储
                    任务队列
```

### API端点设计

#### 认证相关

```
POST   /api/auth/login              # Cookie登录
POST   /api/auth/logout             # 登出
GET    /api/auth/verify             # 验证Cookie有效性
GET    /api/auth/user               # 获取用户信息
```

#### 红包相关

```
GET    /api/red-packets             # 获取红包列表
GET    /api/red-packets/:id         # 获取红包详情
POST   /api/red-packets/:id/claim   # 兑换红包
GET    /api/balance                 # 获取余额
```

#### 任务相关

```
GET    /api/tasks                   # 获取任务列表
POST   /api/tasks                   # 创建任务
GET    /api/tasks/:id               # 获取任务详情
PUT    /api/tasks/:id               # 更新任务
DELETE /api/tasks/:id               # 删除任务
POST   /api/tasks/:id/start         # 启动任务
POST   /api/tasks/:id/stop          # 停止任务
```

#### 设置相关

```
GET    /api/settings                # 获取设置
PUT    /api/settings                # 更新设置
GET    /api/cookies                 # 获取Cookie列表
POST   /api/cookies                 # 添加Cookie
DELETE /api/cookies/:id             # 删除Cookie
```

### API响应格式

```json
{
  "success": true,
  "data": {
    // 数据内容
  },
  "message": "操作成功",
  "timestamp": "2025-11-10T12:00:00Z"
}
```

### 错误处理

```json
{
  "success": false,
  "error": {
    "code": "COOKIE_EXPIRED",
    "message": "Cookie已过期，请重新登录",
    "details": {}
  },
  "timestamp": "2025-11-10T12:00:00Z"
}
```

---

## 🚀 数据流设计

### 状态管理

```
全局状态 (Context API):
- 用户信息 (UserContext)
- 认证状态 (AuthContext)
- 主题设置 (ThemeContext)

本地状态 (useState):
- 表单数据
- UI状态
- 临时数据

服务端状态 (SWR / React Query):
- 红包列表
- 任务列表
- 用户余额
```

### 实时更新

```
方案1: 轮询 (Polling)
- 每5秒请求一次最新数据
- 适用于红包列表、余额更新

方案2: WebSocket
- 实时推送任务状态变化
- 适用于任务执行监控

方案3: Server-Sent Events (SSE)
- 单向实时推送
- 适用于通知消息
```

---

## 🛠️ 开发流程

### 项目结构

```
/frontend/
├── public/                    # 静态资源
├── src/
│   ├── components/            # 组件
│   │   ├── ui/               # shadcn/ui组件
│   │   ├── layout/           # 布局组件
│   │   ├── red-packet/       # 红包相关组件
│   │   └── task/             # 任务相关组件
│   │
│   ├── pages/                # 页面
│   │   ├── Dashboard.tsx     # 仪表板
│   │   ├── Login.tsx         # 登录页
│   │   ├── Tasks.tsx         # 任务中心
│   │   └── Settings.tsx      # 设置页
│   │
│   ├── contexts/             # 上下文
│   │   ├── AuthContext.tsx
│   │   └── UserContext.tsx
│   │
│   ├── hooks/                # 自定义Hooks
│   │   ├── useAuth.ts
│   │   ├── useRedPackets.ts
│   │   └── useTasks.ts
│   │
│   ├── services/             # API服务
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   ├── redPacket.ts
│   │   └── task.ts
│   │
│   ├── utils/                # 工具函数
│   │   ├── format.ts
│   │   └── validate.ts
│   │
│   ├── types/                # 类型定义
│   │   └── index.ts
│   │
│   ├── App.tsx               # 主应用
│   └── main.tsx              # 入口文件
│
└── package.json
```

### 开发步骤

```
阶段1: 环境搭建
1. 创建React项目
2. 配置Tailwind CSS
3. 安装shadcn/ui组件
4. 配置路由

阶段2: 基础功能
1. 实现登录页面
2. 实现Cookie管理
3. 实现API集成
4. 实现认证流程

阶段3: 核心功能
1. 实现红包列表
2. 实现一键抢购
3. 实现余额显示
4. 实现实时更新

阶段4: 高级功能
1. 实现任务管理
2. 实现定时抢购
3. 实现批量操作
4. 实现历史记录

阶段5: 优化部署
1. 性能优化
2. 响应式适配
3. 错误处理
4. 部署上线
```

---

## 🔒 安全考虑

### 前端安全

```
1. Cookie加密存储
2. 敏感信息脱敏显示
3. XSS防护
4. CSRF Token
5. 输入验证
```

### 后端安全

```
1. JWT认证
2. Rate Limiting
3. CORS配置
4. 输入验证
5. SQL注入防护
```

---

## 📊 性能优化

### 前端优化

```
1. 代码分割 (Code Splitting)
2. 懒加载 (Lazy Loading)
3. 图片优化
4. 缓存策略
5. 虚拟滚动 (Virtual Scrolling)
```

### 后端优化

```
1. 响应缓存
2. 数据库索引
3. 连接池
4. 异步处理
5. CDN加速
```

---

## 🧪 测试策略

### 前端测试

```
单元测试:     Jest + React Testing Library
组件测试:     Storybook
端到端测试:   Playwright
```

### 后端测试

```
单元测试:     pytest
API测试:      pytest + httpx
集成测试:     pytest
```

---

## 📦 部署方案

### 前端部署

```
平台:    Vercel (推荐)
流程:    Git push → 自动构建 → 自动部署
域名:    自定义域名
CDN:     全球加速
```

### 后端部署

```
方案1: 云服务器
- 使用 Docker 容器化
- Nginx 反向代理
- 自动重启机制

方案2: Serverless
- 使用云函数
- 按需付费
- 自动扩容
```

---

## 🎯 MVP功能清单

### 第一版必须功能

```
✅ 用户登录 (Cookie导入)
✅ 红包列表展示
✅ 一键抢购
✅ 余额显示
✅ 基础设置
```

### 第二版计划功能

```
□ 定时抢购
□ 批量操作
□ 任务队列
□ 历史记录
□ 数据统计
```

### 未来功能

```
□ 多账号切换
□ 数据导出
□ 通知推送
□ 主题切换
□ 语言切换
```

---

## 📝 开发时间估算

```
环境搭建:        2天
基础功能:        5天
核心功能:        7天
高级功能:        7天
测试优化:        4天
───────────────────────
总计:           25天
```

---

## 📞 技术支持

### 文档资源

- React官方文档: https://react.dev
- Tailwind CSS: https://tailwindcss.com
- shadcn/ui: https://ui.shadcn.com
- FastAPI: https://fastapi.tiangolo.com

### 开发工具

- VS Code + React插件
- Chrome DevTools
- Postman (API测试)
- Git + GitHub

---

**文档版本**: v1.0.0  
**最后更新**: 2025-11-10  
**状态**: ✅ 已完成
