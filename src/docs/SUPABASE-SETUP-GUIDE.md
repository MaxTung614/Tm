# 🚀 Supabase 后端设置完整指南

**更新时间**: 2025-11-14  
**适用场景**: 天猫礼享金自动抢购系统 - Supabase 无后端方案

---

## 📋 目录

1. [创建 Supabase 项目](#1-创建-supabase-项目)
2. [初始化数据库](#2-初始化数据库)
3. [获取 API 凭证](#3-获取-api-凭证)
4. [配置环境变量](#4-配置环境变量)
5. [验证连接](#5-验证连接)
6. [故障排除](#6-故障排除)

---

## 1. 创建 Supabase 项目

### 步骤 1.1: 注册 Supabase 账号

1. 访问 [https://supabase.com](https://supabase.com)
2. 点击 **"Start your project"** 注册账号
3. 可以使用 GitHub 账号快速登录

### 步骤 1.2: 创建新项目

1. 登录后点击 **"New Project"**
2. 填写项目信息：
   - **Name**: `tmall-gift-grabber`（或您喜欢的名称）
   - **Database Password**: 设置一个强密码（请保存好）
   - **Region**: 选择 **Northeast Asia (Tokyo)** 或 **Southeast Asia (Singapore)** 最快
   - **Pricing Plan**: 选择 **Free** 计划（完全够用）
3. 点击 **"Create new project"**
4. 等待 1-2 分钟，项目创建完成

---

## 2. 初始化数据库

### 步骤 2.1: 打开 SQL Editor

1. 在 Supabase Dashboard 左侧菜单找到 **"SQL Editor"**
2. 点击 **"New query"** 创建新查询

### 步骤 2.2: 执行初始化脚本

1. 复制 `/supabase-setup.sql` 文件的全部内容
2. 粘贴到 SQL Editor 中
3. 点击右下角的 **"Run"** 按钮执行
4. 看到 **"Success. No rows returned"** 表示成功

### 步骤 2.3: 验证表创建

1. 点击左侧菜单的 **"Table Editor"**
2. 应该能看到 4 个表：
   - ✅ `accounts` - 账号表
   - ✅ `risk_params` - 风控参数表
   - ✅ `purchase_tasks` - 抢购任务表
   - ✅ `purchase_logs` - 操作日志表

---

## 3. 获取 API 凭证

### 步骤 3.1: 找到项目设置

1. 点击左侧菜单的 **"Project Settings"**（齿轮图标）
2. 点击 **"API"** 选项卡

### 步骤 3.2: 复制凭证

您需要复制以下两个值：

#### A. Project URL
```
格式: https://xxxxxxxxxxxxx.supabase.co
位置: Configuration → Project URL
```

**示例**:
```
https://abcdefghijklmn.supabase.co
```

#### B. API Key (anon, public)
```
位置: Project API keys → anon public
```

**示例**:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTU5OTk5OTksImV4cCI6MjAxMTU3NTk5OX0.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

⚠️ **安全提醒**:
- ✅ `anon public` key 是安全的，可以在前端使用
- ❌ **不要泄露** `service_role` key（这是管理员密钥）

---

## 4. 配置环境变量

### 步骤 4.1: 在 Figma Make 中配置

您已经通过弹窗输入了这两个变量，请确认：

1. **VITE_SUPABASE_URL**
   - 输入您在步骤 3.2.A 复制的 Project URL
   - 格式: `https://xxxxxxxxxxxxx.supabase.co`

2. **VITE_SUPABASE_ANON_KEY**
   - 输入您在步骤 3.2.B 复制的 API Key
   - 格式: `eyJhbGciOiJIUzI1NiIsInR5...`

### 步骤 4.2: 切换到 Real 模式

环境变量配置完成后，系统会自动切换到 Real 模式：

```typescript
// 系统会自动检测 VITE_SUPABASE_URL 是否配置
// 如果配置了，就使用 Real API（连接 Supabase）
// 如果没有，就使用 Mock API（模拟数据）
```

您可以在 `/lib/api-services.ts` 中查看自动切换逻辑。

---

## 5. 验证连接

### 步骤 5.1: 启动应用

```bash
npm run dev
```

### 步骤 5.2: 检查连接状态

1. 打开浏览器控制台（F12）
2. 访问应用首页
3. 查看控制台日志：

**成功连接**:
```
✅ [REAL] 使用真实 API 服务
✅ [REAL] Supabase 连接成功
```

**使用 Mock 模式**:
```
⚠️ [MOCK] 使用模拟 API 服务
⚠️ [MOCK] Supabase 未配置，使用模拟数据
```

### 步骤 5.3: 测试数据库连接

1. 访问 **Settings** 页面
2. 点击 **"导出数据"** 按钮
3. 如果能成功导出（即使是空数据），说明数据库连接正常

### 步骤 5.4: 添加测试账号

1. 访问 **Accounts** 页面
2. 点击 **"添加账号"** 按钮
3. 输入测试信息：
   - **账号名称**: `测试账号`
   - **Cookie**: 随便输入一些测试文本
4. 点击保存
5. 去 Supabase Dashboard → Table Editor → accounts 表
6. 应该能看到刚刚添加的记录

---

## 6. 故障排除

### 问题 1: 连接失败 - "Failed to fetch"

**原因**: 环境变量未正确配置

**解决方案**:
1. 检查 VITE_SUPABASE_URL 是否正确
   - 必须以 `https://` 开头
   - 必须以 `.supabase.co` 结尾
2. 检查 VITE_SUPABASE_ANON_KEY 是否正确
   - 必须是一个很长的 JWT token
   - 开头是 `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.`

### 问题 2: 数据库表不存在

**原因**: 数据库初始化脚本未执行

**解决方案**:
1. 重新执行 `/supabase-setup.sql` 脚本
2. 确保在 SQL Editor 中看到 "Success" 消息
3. 刷新 Table Editor 查看表是否创建

### 问题 3: RLS Policy 错误

**原因**: 行级安全策略阻止访问

**解决方案**:
脚本已经禁用了 RLS，但如果仍然遇到问题：

```sql
-- 在 SQL Editor 中执行
ALTER TABLE accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE risk_params DISABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_logs DISABLE ROW LEVEL SECURITY;
```

### 问题 4: CORS 错误

**原因**: Supabase 域名限制

**解决方案**:
1. 进入 Project Settings → API → CORS Configuration
2. 确保允许您的域名（Figma Make 的域名应该已自动添加）

### 问题 5: 仍然显示 Mock 模式

**原因**: 环境变量未生效或检测逻辑问题

**解决方案**:
1. 刷新页面（Ctrl+Shift+R 强制刷新）
2. 检查浏览器控制台是否有错误
3. 查看 `/lib/api-services.ts` 中的检测逻辑

---

## 📊 数据库架构说明

### accounts 表（账号表）
```
id: UUID - 主键
name: VARCHAR(100) - 账号名称
cookie: TEXT - 加密的 Cookie 字符串
is_active: BOOLEAN - 是否激活
created_at: TIMESTAMP - 创建时间
updated_at: TIMESTAMP - 更新时间
```

### risk_params 表（风控参数）
```
id: UUID - 主键
ua: TEXT - User Agent
umid_token: TEXT - umidToken（唯一设备标识）
asac: VARCHAR(50) - 固定值 2A21B24LA1SI0HB0EEVN03
created_at: TIMESTAMP - 创建时间
updated_at: TIMESTAMP - 更新时间
```

### purchase_tasks 表（抢购任务）
```
id: UUID - 主键
account_id: UUID - 关联账号
benefit_code: VARCHAR(100) - 红包编码
amount: INTEGER - 红包金额
scheduled_time: TIMESTAMP - 计划执行时间
status: VARCHAR(20) - 状态（pending/running/success/failed）
result: JSONB - 执行结果（JSON格式）
created_at: TIMESTAMP - 创建时间
updated_at: TIMESTAMP - 更新时间
```

### purchase_logs 表（操作日志）
```
id: UUID - 主键
task_id: UUID - 关联任务
account_id: UUID - 关联账号
level: VARCHAR(10) - 日志级别（info/success/warning/error）
message: TEXT - 日志消息
details: JSONB - 详细信息（JSON格式）
created_at: TIMESTAMP - 创建时间
```

---

## 🎯 后续步骤

### 1. 配置风控参数

访问 **ExtractParams** 页面提取您的浏览器参数：
- User Agent (UA)
- umidToken
- asac（已硬编码为 `2A21B24LA1SI0HB0EEVN03`）

### 2. 添加真实账号

1. 使用扫码登录获取 Cookie
2. 在 Accounts 页面添加账号
3. Cookie 会自动加密存储到 Supabase

### 3. 测试抢购功能

1. 访问 Dashboard
2. 系统会从天猫 API 获取真实红包列表
3. 点击抢购测试功能

### 4. 设置定时任务

1. 访问 Tasks 页面
2. 创建定时抢购任务
3. 系统会自动在指定时间执行

---

## 🔒 安全最佳实践

1. **不要分享您的 service_role key**
   - 只使用 anon public key
   - service_role key 有完整数据库访问权限

2. **定期更新 Cookie**
   - Cookie 会过期，需要重新扫码登录
   - 系统会提示 Cookie 失效

3. **监控数据库使用量**
   - 免费计划有 500MB 存储限制
   - 定期清理旧日志

4. **备份重要数据**
   - 使用 Settings 页面的导出功能
   - 定期备份账号和任务数据

---

## 📞 需要帮助？

如果遇到问题：

1. **检查控制台日志** - 打开浏览器 F12 查看错误
2. **查看 Supabase 日志** - Dashboard → Logs 查看数据库日志
3. **重新初始化** - 必要时重新执行 SQL 脚本

---

## ✅ 检查清单

配置完成后，请确认：

- [ ] Supabase 项目已创建
- [ ] 数据库初始化脚本已执行
- [ ] 4 个表已创建（accounts, risk_params, purchase_tasks, purchase_logs）
- [ ] VITE_SUPABASE_URL 已配置
- [ ] VITE_SUPABASE_ANON_KEY 已配置
- [ ] 应用已切换到 Real 模式
- [ ] 能成功添加测试账号
- [ ] 控制台无连接错误

---

**设置完成！您的 Supabase 后端现在已准备就绪！** 🎉

现在可以：
- ✅ 使用扫码登录获取 Cookie
- ✅ 自动获取天猫红包列表
- ✅ 执行真实抢购操作
- ✅ 创建定时任务
- ✅ 查看完整操作日志

---

**文档版本**: v1.0  
**最后更新**: 2025-11-14
