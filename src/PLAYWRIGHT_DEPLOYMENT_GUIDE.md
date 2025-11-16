# 🚀 Playwright 扫码登录部署完全指南

本指南将帮助您部署 Playwright 服务，以解决淘宝扫码登录的风控问题。

---

## 📋 前置准备

- ✅ Node.js 18+ 已安装
- ✅ Git 已安装
- ✅ GitHub 账号
- ✅ Render.com 账号（或其他支持 Node.js 的托管平台）

---

## 🔧 步骤 1：创建 Playwright 服务项目

### 1.1 创建项目文件夹

```bash
mkdir taobao-playwright-service
cd taobao-playwright-service
git init
```

### 1.2 创建 `package.json`

```json
{
  "name": "taobao-playwright-service",
  "version": "1.0.0",
  "type": "module",
  "description": "淘宝扫码登录 Playwright 服务",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "playwright": "^1.40.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### 1.3 创建 `server.js`

**请从 `/playwright-service-example.js` 复制完整代码到此文件。**

关键代码片段：
```javascript
import express from 'express';
import cors from 'cors';
import { chromium } from 'playwright';

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY || 'your-secret-api-key';

// ... 完整代码见 /playwright-service-example.js
```

### 1.4 创建 `.env`

```env
PORT=3000
API_KEY=sk_live_taobao_pw_abc123xyz789_CHANGE_THIS_TO_STRONG_SECRET
```

**⚠️ 重要：** 请将 `API_KEY` 改为一个强密码（建议至少 32 位随机字符）。

生成强密码的方法（在终端中运行）：
```bash
node -e "console.log('sk_live_' + require('crypto').randomBytes(32).toString('hex'))"
```

### 1.5 创建 `.gitignore`

```
node_modules/
.env
*.log
.DS_Store
```

---

## 🧪 步骤 2：本地测试

```bash
# 安装依赖
npm install

# 安装 Playwright 浏览器
npx playwright install chromium

# 启动服务
npm start
```

您应该看到：
```
🚀 Playwright 服务已启动
📡 监听端口: 3000
🔑 API Key: sk_live_...
💚 健康检查: http://localhost:3000/health
```

### 测试健康检查

在新终端中运行：
```bash
curl http://localhost:3000/health
```

应该返回：
```json
{"status":"ok","service":"taobao-playwright","version":"1.0.0"}
```

---

## 🌐 步骤 3：推送到 GitHub

```bash
# 添加所有文件
git add .

# 提交
git commit -m "Initial commit: Playwright service for Taobao QR login"

# 在 GitHub 创建新仓库（例如：taobao-playwright-service）
# 然后运行：
git remote add origin https://github.com/YOUR_USERNAME/taobao-playwright-service.git
git branch -M main
git push -u origin main
```

---

## 🚀 步骤 4：部署到 Render

### 4.1 登录 Render

访问 https://render.com 并登录

### 4.2 创建 Web Service

1. 点击 **"New +" → "Web Service"**
2. 点击 **"Connect a repository"** 连接 GitHub
3. 选择 **`taobao-playwright-service`** 仓库

### 4.3 配置服务

填写以下信息：

| 字段 | 值 |
|------|-----|
| **Name** | `taobao-playwright-service` |
| **Region** | Singapore（新加坡）或最近的区域 |
| **Branch** | `main` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npx playwright install chromium` |
| **Start Command** | `npm start` |
| **Instance Type** | Starter ($7/月) 或更高 |

### 4.4 添加环境变量

在 **"Environment"** 标签下，添加：

| Key | Value |
|-----|-------|
| `API_KEY` | 粘贴您在 `.env` 中生成的强密码 |

### 4.5 部署

点击 **"Create Web Service"**

⏳ 等待部署完成（约 10-15 分钟，首次部署较慢）

### 4.6 获取服务 URL

部署成功后，您会看到服务 URL，例如：
```
https://taobao-playwright-service.onrender.com
```

**⚠️ 请复制并保存此 URL，后面需要用到！**

### 4.7 测试部署

在浏览器中访问：
```
https://taobao-playwright-service.onrender.com/health
```

应该返回：
```json
{"status":"ok","service":"taobao-playwright","version":"1.0.0"}
```

---

## ⚙️ 步骤 5：配置 Supabase

### 5.1 登录 Supabase Dashboard

访问：https://supabase.com/dashboard/project/nnkficulyzphkyarzagr

### 5.2 添加环境变量

1. 点击 **Settings → Edge Functions**
2. 找到 **"Environment variables"** 部分
3. 添加以下两个变量：

**变量 1：PLAYWRIGHT_SERVICE_URL**
```
Name: PLAYWRIGHT_SERVICE_URL
Value: https://taobao-playwright-service.onrender.com
```
（替换为您的 Render 服务 URL）

**变量 2：PLAYWRIGHT_API_KEY**
```
Name: PLAYWRIGHT_API_KEY
Value: sk_live_taobao_pw_abc123xyz789_...
```
（与 Render 中的 API_KEY 完全一致）

4. 点击 **"Save"**

### 5.3 重新部署 Edge Functions

环境变量更新后需要重新部署：

1. 在 Supabase Dashboard 中进入 **Edge Functions**
2. 找到 `make-server-c6898dcb` 函数
3. 点击 **"Deploy to Production"** 或触发重新部署

---

## 🎯 步骤 6：启用 Playwright 模式

### 6.1 修改配置文件

在 Figma Make 项目中，编辑 `/lib/config.ts`：

```typescript
export const USE_PLAYWRIGHT = true; // ⬅️ 改为 true
```

### 6.2 测试完整流程

1. 访问您的应用：https://lixiangjin.figma.site/
2. 进入 **"账号管理"** → **"扫码登录"**
3. 生成二维码
4. 用淘宝 App 扫码
5. 确认登录
6. 查看控制台日志：
   ```
   [REAL] authService.generateQRCode - 调用后端生成二维码 (Playwright模式)
   [Playwright] ✅ Cookie 提取完成
   [Playwright] Cookie 长度: XXXX (应该 > 1000)
   [Playwright] 包含登录凭证: true
   ```

---

## ✅ 验证成功的标志

扫码登录成功后，您应该看到：

### 在前端控制台：
```
[前端] 当前状态: confirmed | Cookie长度: 1500+
✅ 账号添加成功！
```

### 在后端日志（Supabase）：
```
[Playwright] ✅ Cookie 提取完成
[Playwright] Cookie 数量: 15+
[Playwright] 用户名: tb12345678_xxx
[Playwright] 包含登录凭证: true
[Playwright] 是否验证页面: false
```

### Cookie 应该包含的关键字段：
- ✅ `cookie2` - 登录凭证
- ✅ `t` - 用户令牌
- ✅ `_tb_token_` - 防伪令牌
- ✅ `_nk_` - 用户名
- ✅ `_m_h5_tk` - H5 令牌

---

## 🐛 故障排查

### 问题 1：Playwright 服务无法访问

**症状：** 访问健康检查 URL 失败

**解决方法：**
1. 检查 Render 部署日志
2. 确认服务状态为 "Live"
3. 尝试重新部署

### 问题 2：Supabase 调用 Playwright 失败

**症状：** 前端显示 "未配置 Playwright 服务"

**解决方法：**
1. 检查 Supabase 环境变量是否正确配置
2. 确认 `PLAYWRIGHT_SERVICE_URL` 和 `PLAYWRIGHT_API_KEY` 已设置
3. 重新部署 Edge Functions

### 问题 3：仍然获取不到完整 Cookie

**症状：** Cookie 长度仍然很短（< 500）

**解决方法：**
1. 查看 Render 服务日志，检查是否有错误
2. 确认淘宝没有返回验证页面
3. 检查 Playwright 版本是否最新

### 查看 Render 日志

在 Render Dashboard 中：
1. 进入您的服务
2. 点击 **"Logs"** 标签
3. 查看实时日志

---

## 💰 费用说明

### Render 费用
- **Starter 方案：** $7/月
- **Standard 方案：** $25/月（如果需要更好的性能）

### 免费替代方案
如果您想省钱，可以考虑：
- **Railway.app** - 免费额度 $5/月
- **Fly.io** - 免费额度
- **自托管 VPS** - DigitalOcean、Vultr 等（$5/月起）

---

## 📝 后续维护

### 定期检查
- 每周检查一次 Playwright 服务状态
- 确认扫码登录功能正常

### 更新 Playwright
当 Playwright 有新版本时：
```bash
# 本地更新
npm update playwright
npx playwright install chromium

# 提交并推送
git add package.json package-lock.json
git commit -m "Update Playwright"
git push

# Render 会自动重新部署
```

---

## 🎉 完成！

恭喜！您已经成功部署了 Playwright 扫码登录服务。

现在您可以：
- ✅ 绕过淘宝风控，成功扫码登录
- ✅ 获取完整的 Cookie（长度 1000+）
- ✅ 自动提取淘宝用户名
- ✅ 正常使用所有抢购功能

---

## 📞 需要帮助？

如果遇到问题，请检查：
1. Render 服务日志
2. Supabase Edge Functions 日志
3. 前端浏览器控制台
