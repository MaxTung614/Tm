# 🚀 Supabase 部署完整指南

**从零开始，30分钟完成无后端部署**

---

## 📋 准备工作

### 需要的东西

- ✅ 浏览器（Chrome/Edge/Firefox）
- ✅ 一个邮箱账号（注册 Supabase）
- ✅ 30分钟时间

### 不需要的东西

- ❌ Python
- ❌ 后端知识
- ❌ 服务器
- ❌ 复杂配置

---

## 🎯 步骤1: 创建 Supabase 项目（5分钟）

### 1.1 注册/登录 Supabase

1. 访问 https://supabase.com
2. 点击右上角 "Start your project"
3. 使用 GitHub/Google/Email 登录

### 1.2 创建新项目

1. 点击 "New Project"
2. 填写项目信息：
   ```
   Name: tmall-gift-grabber
   Database Password: [自动生成，点击"Generate"]
   Region: Northeast Asia (Tokyo) [选择最近的]
   Pricing Plan: Free [免费层足够用]
   ```
3. 点击 "Create new project"
4. **等待 2-3 分钟** 项目初始化

### 1.3 获取 API 密钥

1. 项目创建完成后，点击左侧 "Project Settings" ⚙️
2. 点击 "API" 标签
3. 记录以下信息：
   ```
   Project URL: https://xxx.supabase.co
   anon public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
4. **复制这两个值，稍后需要**

✅ **第一步完成！**

---

## 🗄️ 步骤2: 创建数据库表（5分钟）

### 2.1 打开 SQL Editor

1. 在 Supabase 项目中，点击左侧 "SQL Editor" 📝
2. 点击 "New query"

### 2.2 执行建表脚本

1. 打开项目中的 `supabase-setup.sql` 文件
2. **复制全部内容**
3. **粘贴到 SQL Editor**
4. 点击右下角 "Run" ▶️ 按钮
5. 等待执行完成，看到 "Success. No rows returned"

### 2.3 验证表创建

1. 点击左侧 "Table Editor" 📊
2. 应该看到 4 个表：
   - `accounts` - 账号管理
   - `risk_params` - 风控参数
   - `purchase_tasks` - 抢购任务
   - `purchase_logs` - 抢购日志

✅ **第二步完成！**

---

## ⚙️ 步骤3: 配置前端环境变量（2分钟）

### 3.1 创建环境变量文件

在项目根目录：

```bash
# Windows
copy .env.local.example .env.local

# Mac/Linux
cp .env.local.example .env.local
```

### 3.2 填写 Supabase 信息

打开 `.env.local` 文件，填写：

```bash
# 步骤1.3 中复制的 Project URL
VITE_SUPABASE_URL=https://your-project-id.supabase.co

# 步骤1.3 中复制的 anon public key
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 生成一个 32 位加密密钥（见下方）
VITE_ENCRYPTION_KEY=your-32-character-key
```

### 3.3 生成加密密钥

选择以下任一方法：

#### 方法1: 在线生成（最简单）

1. 访问 https://www.random.org/strings/
2. 设置：
   - Number of strings: 1
   - String length: 32
   - Character set: Alphanumeric
3. 点击 "Get Strings"
4. 复制生成的字符串

#### 方法2: 使用浏览器控制台

1. 打开浏览器
2. 按 F12 打开开发者工具
3. 切换到 Console
4. 执行：
   ```javascript
   Array.from({length:32}, () => 
     'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random()*36)]
   ).join('')
   ```
5. 复制输出的字符串

#### 方法3: 使用命令行（如果有）

```bash
# OpenSSL
openssl rand -hex 16

# Node.js
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"

# Python
python -c "import secrets; print(secrets.token_hex(16))"
```

### 3.4 保存文件

确保 `.env.local` 文件保存成功，内容类似：

```bash
VITE_SUPABASE_URL=https://abcdefgh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODAwMDAwMDAsImV4cCI6MTk5NTU3NjAwMH0.xxxxxxxxxxxxxxxxxxxxx
VITE_ENCRYPTION_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

✅ **第三步完成！**

---

## 📦 步骤4: 安装依赖（3分钟）

### 4.1 安装 Supabase 相关依赖

```bash
npm install @supabase/supabase-js crypto-js
```

### 4.2 安装类型定义（TypeScript）

```bash
npm install --save-dev @types/crypto-js
```

### 4.3 验证安装

```bash
npm list @supabase/supabase-js crypto-js
```

应该看到：
```
├── @supabase/supabase-js@2.x.x
└── crypto-js@4.x.x
```

✅ **第四步完成！**

---

## ✅ 步骤5: 验证代码文件（1分钟）

确保以下文件已创建：

```
项目根目录/
├── lib/
│   ├── supabase.ts        ✅ Supabase 客户端
│   ├── tsdk.ts            ✅ TSDK JavaScript 版本
│   └── usePurchase.ts     ✅ 抢购逻辑 Hook
├── supabase-setup.sql     ✅ 数据库脚本
├── .env.local.example     ✅ 环境变量模板
└── .env.local             ✅ 你的环境变量（已填写）
```

**检查**：
```bash
# Windows
dir /s lib\*.ts

# Mac/Linux  
ls -la lib/*.ts
```

应该看到 3 个 TypeScript 文件。

✅ **第五步完成！**

---

## 🚀 步骤6: 启动测试（5分钟）

### 6.1 启动开发服务器

```bash
npm run dev
```

### 6.2 访问应用

打开浏览器，访问：
```
http://localhost:5173
```

### 6.3 测试功能

#### 测试1: 添加账号

1. 进入"账号管理"页面
2. 点击"添加账号"
3. 输入：
   - 账号名称：测试账号
   - Cookie：你的淘宝 Cookie
4. 点击"保存"
5. **检查**：账号列表中出现新账号

#### 测试2: 配置风控参数

1. 进入"参数提取"或"设置"页面
2. 输入：
   - UA：从浏览器提取
   - umidToken：从浏览器提取
3. 点击"保存"
4. **检查**：显示"保存成功"

#### 测试3: 查看数据库

1. 回到 Supabase Dashboard
2. 点击 "Table Editor"
3. 选择 `accounts` 表
4. **检查**：看到你刚添加的账号（Cookie已加密）

### 6.4 检查浏览器控制台

按 F12，切换到 Console：

✅ **无红色错误**  
✅ **可以看到 TSDK 日志**  
✅ **Supabase 连接正常**

✅ **第六步完成！**

---

## 🎯 步骤7: 完整功能测试（10分钟）

### 7.1 提取风控参数

按照 [风控参数提取完整指南](./parameter-extraction.md) 提取真实的 ua 和 umidToken。

### 7.2 测试获取红包列表

1. 选择一个账号
2. 点击"刷新红包"或类似按钮
3. **检查**：看到红包列表

### 7.3 测试抢购功能

**⚠️ 注意：真实抢购会消耗礼享金，建议先用小额测试**

1. 选择一个红包
2. 点击"立即抢购"
3. **检查**：
   - 显示执行中
   - 查看日志
   - 结果显示成功/失败

### 7.4 查看日志

1. 进入"日志"或"历史"页面
2. **检查**：
   - 看到抢购记录
   - 看到详细日志
   - 时间正确

✅ **第七步完成！**

---

## 🎉 部署完成！

恭喜！你已经成功部署了无后端的 Supabase 版本！

### 现在你可以

- ✅ 随时随地打开网页使用
- ✅ 无需启动后端服务
- ✅ 数据云端同步
- ✅ 多设备访问

---

## 🌐 可选：部署到云端（永久访问）

### 方案A：Vercel（推荐）

```bash
# 1. 安装 Vercel CLI
npm install -g vercel

# 2. 登录
vercel login

# 3. 部署
vercel

# 4. 设置环境变量
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add VITE_ENCRYPTION_KEY

# 5. 重新部署
vercel --prod
```

访问 Vercel 提供的网址，例如：
```
https://your-project.vercel.app
```

### 方案B：Netlify

```bash
# 1. 构建项目
npm run build

# 2. 访问 https://app.netlify.com
# 3. 拖拽 dist/ 文件夹到网页
# 4. 在 Site settings → Environment variables 添加：
#    VITE_SUPABASE_URL
#    VITE_SUPABASE_ANON_KEY
#    VITE_ENCRYPTION_KEY
# 5. 触发重新部署
```

---

## 🔧 常见问题

### Q1: 无法连接 Supabase

**检查**：
- ✅ `.env.local` 文件是否存在
- ✅ 环境变量是否正确
- ✅ Supabase 项目是否正常运行
- ✅ 网络连接是否正常

**解决**：
```bash
# 重启开发服务器
# Ctrl+C 停止
npm run dev
```

### Q2: Cookie 保存失败

**检查**：
- ✅ Cookie 格式是否正确
- ✅ 加密密钥是否配置
- ✅ Supabase 表是否创建

**解决**：
```sql
-- 在 Supabase SQL Editor 中检查表
SELECT * FROM accounts;
```

### Q3: 抢购失败

**检查**：
- ✅ Cookie 是否过期（重新登录淘宝）
- ✅ 风控参数是否正确
- ✅ ua 和 umidToken 是否真实提取

**解决**：
- 重新登录淘宝
- 重新提取风控参数
- 查看详细错误日志

### Q4: 环境变量不生效

**解决**：
```bash
# 1. 确保文件名是 .env.local（不是 .env）
# 2. 确保变量名以 VITE_ 开头
# 3. 重启开发服务器
npm run dev
```

---

## 📚 下一步

### 学习资源

- [Supabase 官方文档](https://supabase.com/docs)
- [风控参数提取指南](./parameter-extraction.md)
- [API 技术文档](../technical/api/)

### 功能扩展

- ✅ 添加多账号轮换
- ✅ 添加定时任务持久化
- ✅ 添加统计图表
- ✅ 添加 Telegram 通知

### 优化建议

- ✅ 使用 React Query 缓存数据
- ✅ 添加请求重试机制
- ✅ 优化 UI/UX
- ✅ 添加暗色主题

---

## ✅ 部署检查清单

完成以下检查，确保部署成功：

- [ ] Supabase 项目已创建
- [ ] 数据库表已创建（4个表）
- [ ] `.env.local` 已配置
- [ ] 依赖已安装
- [ ] 开发服务器可启动
- [ ] 可以添加账号
- [ ] 可以保存风控参数
- [ ] 可以获取红包列表
- [ ] 可以执行抢购（测试）
- [ ] 可以查看日志

**全部完成 → 🎉 部署成功！**

---

**需要帮助？** 查看详细文档或在 Issues 中提问！

祝你使用愉快！🚀
