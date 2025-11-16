# ⚡ Playwright 服务快速启动

**5 分钟部署指南** - 适合想快速上手的用户

---

## 📦 第一步：创建本地项目（2分钟）

### 方法 A：一键脚本（推荐）

在终端中运行以下命令：

```bash
# 创建项目文件夹
mkdir taobao-playwright-service && cd taobao-playwright-service

# 下载项目文件（需要先安装 curl）
curl -o package.json https://raw.githubusercontent.com/你的用户名/你的仓库/main/package.json
curl -o server.js https://raw.githubusercontent.com/你的用户名/你的仓库/main/server.js

# 或者手动创建文件（见方法 B）
```

### 方法 B：手动创建（推荐新手）

1. **创建文件夹：**
   ```bash
   mkdir taobao-playwright-service
   cd taobao-playwright-service
   ```

2. **复制代码：**
   - 从 `/playwright-service-example.js` 复制所有代码
   - 保存为 `server.js`

3. **创建 package.json：**
   ```bash
   npm init -y
   npm pkg set type="module"
   npm pkg set engines.node=">=18.0.0"
   npm install express playwright cors dotenv
   ```

4. **创建 .env：**
   ```bash
   echo "PORT=3000" > .env
   echo "API_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")" >> .env
   ```

---

## 🧪 第二步：本地测试（1分钟）

```bash
# 安装 Playwright 浏览器
npx playwright install chromium

# 启动服务
npm start
```

**成功标志：** 看到 `🚀 Playwright 服务已启动`

**测试：** 在浏览器打开 `http://localhost:3000/health`

---

## 🌐 第三步：部署到 Render（5分钟）

### 3.1 推送到 GitHub

```bash
git init
git add .
git commit -m "Initial commit"

# 在 GitHub 创建新仓库，然后：
git remote add origin https://github.com/你的用户名/taobao-playwright-service.git
git push -u origin main
```

### 3.2 一键部署

点击下方按钮一键部署到 Render：

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com)

**或手动部署：**
1. 访问 https://render.com
2. New + → Web Service
3. 连接 GitHub 仓库
4. 填写配置（见下方）

### 3.3 Render 配置

| 字段 | 值 |
|------|-----|
| Build Command | `npm install && npx playwright install chromium` |
| Start Command | `npm start` |
| Instance Type | Starter ($7/月) |

**环境变量：**
- `API_KEY` = 复制 `.env` 中的值

---

## ⚙️ 第四步：配置 Supabase（2分钟）

1. **访问 Supabase Dashboard：**
   https://supabase.com/dashboard/project/nnkficulyzphkyarzagr/settings/functions

2. **添加环境变量：**
   ```
   PLAYWRIGHT_SERVICE_URL = https://你的服务名.onrender.com
   PLAYWRIGHT_API_KEY = 你的API_KEY
   ```

3. **重新部署 Edge Functions**

---

## 🎯 第五步：启用并测试（1分钟）

### 5.1 启用 Playwright 模式

编辑 `/lib/config.ts`：
```typescript
export const USE_PLAYWRIGHT = true;
```

### 5.2 测试扫码登录

1. 访问 https://lixiangjin.figma.site/
2. 账号管理 → 扫码登录
3. 扫码确认
4. 检查 Cookie 长度是否 > 1000

---

## ✅ 成功标志

- ✅ Cookie 长度 > 1000
- ✅ 包含 `cookie2`, `t`, `_tb_token_` 等字段
- ✅ 自动提取用户名成功

---

## 🆘 遇到问题？

### 常见问题速查

| 问题 | 解决方法 |
|------|----------|
| 本地启动失败 | 确认 Node.js >= 18，运行 `npx playwright install chromium` |
| Render 部署失败 | 检查 Build Command 是否正确，查看部署日志 |
| Supabase 调用失败 | 确认环境变量已设置，重新部署 Edge Functions |
| Cookie 仍然很短 | 查看 Render 日志，确认 Playwright 正常运行 |

### 查看日志

**Render 日志：**
```
Render Dashboard → 你的服务 → Logs 标签
```

**Supabase 日志：**
```
Supabase Dashboard → Logs → Edge Functions
```

---

## 💡 提示

- 首次部署 Render 可能需要 10-15 分钟
- 免费 Render 服务会在 15 分钟无活动后休眠
- 建议升级到 Starter 方案（$7/月）以保持服务常驻

---

## 📞 仍需帮助？

请查看完整部署指南：`/PLAYWRIGHT_DEPLOYMENT_GUIDE.md`
