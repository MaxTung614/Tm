# 🎯 Supabase 后端快速设置指南

**项目**: 天猫礼享金自动抢购系统  
**架构**: Supabase 无后端方案  
**状态**: ✅ 已就绪，等待配置

---

## 📦 您需要做的 3 件事

### 1️⃣ 创建 Supabase 项目 (5分钟)

1. 访问 [https://supabase.com](https://supabase.com) 并注册
2. 创建新项目：
   - **名称**: `tmall-gift-grabber`
   - **区域**: 选择 Tokyo 或 Singapore（最快）
   - **计划**: Free（完全免费）
3. 等待项目初始化完成

### 2️⃣ 初始化数据库 (2分钟)

1. 在 Supabase Dashboard 打开 **SQL Editor**
2. 复制 `/supabase-setup.sql` 文件的全部内容
3. 粘贴并点击 **Run** 执行
4. 看到 "Success" 即完成

### 3️⃣ 配置环境变量 (1分钟)

您已经通过弹窗输入了以下变量（如果还没有，请现在输入）：

**在 Supabase Dashboard → Settings → API 找到：**

1. **VITE_SUPABASE_URL**
   - 复制 "Project URL"
   - 格式: `https://xxxxx.supabase.co`

2. **VITE_SUPABASE_ANON_KEY**
   - 复制 "Project API keys → anon public"
   - 格式: `eyJhbGciOiJIUzI1NiIsInR5...` (很长的字符串)

⚠️ **重要**: 只使用 `anon public` key，不要泄露 `service_role` key！

---

## ✅ 验证连接

配置完成后，启动应用：

```bash
npm run dev
```

访问 **Dashboard** 页面，您会看到：

### 🟢 成功连接的标志：
- ✅ 顶部显示 "Supabase 已连接" 绿色状态卡片
- ✅ 控制台显示 `[REAL] 使用真实 API 服务`
- ✅ 统计卡片显示实时数据
- ✅ 可以添加账号和查看任务

### 🔴 未连接的标志：
- ❌ 顶部显示 "Supabase 未配置" 红色状态卡片
- ⚠️ 控制台显示 `[MOCK] 使用模拟 API 服务`
- 📝 仅显示模拟数据

---

## 🗄️ 数据库架构

您的 Supabase 数据库包含 4 个表：

| 表名 | 用途 | 记录数 |
|------|------|--------|
| **accounts** | 存储账号和 Cookie | 根据您添加的账号数 |
| **risk_params** | 存储风控参数（UA、umidToken） | 1条（默认） |
| **purchase_tasks** | 存储抢购任务 | 根据您创建的任务数 |
| **purchase_logs** | 存储操作日志 | 自动增长 |

---

## 🚀 功能对比

| 功能 | Mock 模式 | Real 模式（Supabase） |
|------|-----------|----------------------|
| **查看红包列表** | ✅ 模拟11个红包 | ✅ 天猫真实红包 |
| **抢购红包** | ✅ 模拟成功 | ✅ 真实抢购 |
| **账号管理** | ❌ 无法保存 | ✅ 持久化存储 |
| **定时任务** | ❌ 无法执行 | ✅ 自动执行 |
| **操作日志** | ❌ 仅控制台 | ✅ 数据库存储 |
| **统计数据** | ✅ 模拟数据 | ✅ 真实统计 |

---

## 🎯 连接后的工作流程

### 第一步：添加账号
1. 访问 **Accounts** 页面
2. 使用扫码登录获取 Cookie
3. Cookie 会自动加密存储到 Supabase

### 第二步：提取风控参数
1. 访问 **ExtractParams** 页面
2. 提取您的 UA 和 umidToken
3. 参数会自动保存到 Supabase

### 第三步：查看红包
1. 访问 **Dashboard** 页面
2. 系统会从天猫 API 获取真实红包列表
3. 自动过滤出 11 个目标红包

### 第四步：开始抢购
1. 点击单个红包的 **"立即抢购"** 按钮
2. 或点击右上角 **"一键抢购"** 批量领取
3. 抢购结果实时更新

### 第五步：设置定时任务
1. 访问 **Tasks** 页面
2. 创建定时抢购任务
3. 系统会在指定时间自动执行

---

## 📚 详细文档

- **完整设置指南**: `/docs/SUPABASE-SETUP-GUIDE.md`
- **前后端适配报告**: `/docs/project/frontend-backend-fix-complete.md`
- **数据库脚本**: `/supabase-setup.sql`

---

## 🔧 故障排除

### 问题 1: 连接失败

**检查清单**:
- [ ] VITE_SUPABASE_URL 格式正确（https://xxxxx.supabase.co）
- [ ] VITE_SUPABASE_ANON_KEY 已正确复制
- [ ] 数据库脚本已执行
- [ ] 刷新页面（Ctrl+Shift+R）

### 问题 2: 表不存在

**解决方案**:
1. 重新执行 `/supabase-setup.sql` 脚本
2. 在 Table Editor 中确认 4 个表已创建
3. 刷新页面

### 问题 3: 仍显示 Mock 模式

**解决方案**:
1. 打开浏览器控制台（F12）
2. 检查是否有错误信息
3. 确认环境变量已正确设置
4. 硬刷新页面（Ctrl+Shift+R）

---

## 💡 最佳实践

### 安全性
- ✅ 只使用 `anon public` key
- ✅ 不要分享 `service_role` key
- ✅ 定期更新 Cookie（会过期）

### 性能
- ✅ Cookie 加密存储在 Supabase
- ✅ 自动过滤只显示 11 个目标红包
- ✅ 批量抢购优化网络请求

### 维护
- ✅ 定期清理旧日志（Settings → 导出数据）
- ✅ 监控 Supabase 使用量（免费计划 500MB）
- ✅ 备份重要数据

---

## 🎉 完成！

配置完成后，您的系统将：
- ✅ 自动连接 Supabase 后端
- ✅ 安全存储账号和 Cookie
- ✅ 从天猫 API 获取真实红包
- ✅ 支持真实抢购操作
- ✅ 记录完整操作日志
- ✅ 支持定时任务调度

**现在开始使用吧！** 🚀

---

**需要帮助?** 
- 查看 `/docs/SUPABASE-SETUP-GUIDE.md` 获取详细说明
- 检查浏览器控制台获取错误信息
- Dashboard 顶部的连接状态卡片会显示具体问题

**状态**: ✅ 系统已就绪，等待您的 Supabase 配置
