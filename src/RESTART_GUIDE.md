# 🔄 重启指南

**目的**: 修复环境变量错误后重启应用  
**适用场景**: 遇到 `import.meta.env` 相关错误

---

## ⚡ 快速重启（推荐）

```bash
# 1. 停止开发服务器
# 按 Ctrl+C 或 Cmd+C

# 2. 重启
npm run dev

# 3. 访问
# http://localhost:5173
```

---

## 🔧 完整重启（推荐首次修复后使用）

```bash
# 1. 停止开发服务器
# 按 Ctrl+C

# 2. 清理缓存
rm -rf node_modules/.vite

# 3. 重启
npm run dev
```

---

## 🔄 深度清理重启（遇到持续问题时）

```bash
# 1. 停止所有进程
# 按 Ctrl+C

# 2. 删除依赖和缓存
rm -rf node_modules
rm -rf package-lock.json
rm -rf node_modules/.vite
rm -rf dist

# 3. 重新安装
npm install

# 4. 启动
npm run dev
```

---

## ✅ 验证步骤

### 1. 检查环境变量

```bash
# 查看 .env 文件
cat .env

# 应该包含:
# VITE_API_BASE_URL=http://localhost:8000
```

### 2. 检查配置文件

```bash
# 检查 vite.config.ts
ls -la vite.config.ts

# 检查 tsconfig.json
ls -la tsconfig.json

# 检查 main.tsx
ls -la main.tsx

# 检查 index.html
ls -la index.html
```

### 3. 启动测试

```bash
# 启动开发服务器
npm run dev

# 预期输出:
#   VITE v5.x.x  ready in xxx ms
#   ➜  Local:   http://localhost:5173/
#   ➜  Network: use --host to expose
```

### 4. 浏览器验证

```
1. 打开 http://localhost:5173
2. 按 F12 打开开发者工具
3. 查看 Console 标签
4. 不应该有环境变量错误
```

---

## 🐛 常见问题

### 问题1: 端口已被占用

```
错误: Port 5173 is already in use
```

**解决方案A - 更换端口**:
```bash
# 使用不同端口启动
npm run dev -- --port 3000
```

**解决方案B - 释放端口**:
```bash
# 查找占用端口的进程
lsof -ti:5173

# 杀死进程
kill -9 $(lsof -ti:5173)

# 重新启动
npm run dev
```

### 问题2: 环境变量未生效

```
错误: API_BASE_URL 仍然是 undefined
```

**解决方案**:
```bash
# 1. 确认 .env 文件存在
ls -la .env

# 2. 确认内容正确
cat .env

# 3. 必须重启（重要！）
# 停止服务器，再重新启动
npm run dev
```

### 问题3: TypeScript 错误

```
错误: Cannot find module 'vite/client'
```

**解决方案**:
```bash
# 1. 安装 Vite 类型
npm install -D @types/node

# 2. 检查 tsconfig.json
cat tsconfig.json

# 3. 重启
npm run dev
```

### 问题4: 模块未找到

```
错误: Cannot find module './xxx'
```

**解决方案**:
```bash
# 1. 清理缓存
rm -rf node_modules/.vite

# 2. 重新安装
npm install

# 3. 重启
npm run dev
```

---

## 📋 检查清单

在重启前，确保：

- [ ] `.env` 文件存在于根目录
- [ ] `.env` 包含 `VITE_API_BASE_URL=http://localhost:8000`
- [ ] `vite.config.ts` 文件存在
- [ ] `tsconfig.json` 文件存在
- [ ] `vite-env.d.ts` 文件存在
- [ ] `index.html` 文件存在
- [ ] `main.tsx` 文件存在
- [ ] 已运行 `npm install`
- [ ] 端口 5173 未被占用

---

## 🎯 重启后的预期结果

### ✅ 成功标志

```
✅ 开发服务器在 5173 端口启动
✅ 浏览器显示登录页面
✅ Console 无错误信息
✅ 环境变量正确加载
✅ API 配置正常工作
```

### ❌ 失败标志

```
❌ 端口启动失败
❌ 页面白屏
❌ Console 显示错误
❌ 环境变量 undefined
❌ API 调用失败
```

如果遇到失败，参考上面的"常见问题"部分。

---

## 💡 提示

### 环境变量修改

```bash
# 每次修改 .env 文件后
# 必须重启开发服务器！

# 修改 .env
vim .env

# 停止服务器 (Ctrl+C)
# 重新启动
npm run dev
```

### 清理缓存的时机

```bash
# 以下情况需要清理缓存：
- 依赖更新后
- 配置文件修改后
- 遇到奇怪的错误
- 环境变量未生效

# 清理命令
rm -rf node_modules/.vite
npm run dev
```

---

## 🚀 快速命令参考

```bash
# 基础重启
npm run dev

# 更换端口
npm run dev -- --port 3000

# 清理缓存重启
rm -rf node_modules/.vite && npm run dev

# 完全重装
rm -rf node_modules package-lock.json && npm install && npm run dev

# 检查环境变量
cat .env

# 查看配置
cat vite.config.ts

# 查看类型定义
cat vite-env.d.ts
```

---

## 📞 需要帮助？

如果重启后仍有问题：

1. 查看 [ERROR_FIX_REPORT.md](ERROR_FIX_REPORT.md)
2. 查看 [QUICKSTART.md](QUICKSTART.md)
3. 检查浏览器 Console 错误信息
4. 检查终端错误信息

---

**重启指南版本**: v1.0.0  
**最后更新**: 2025-11-10  
**适用场景**: 环境变量错误修复后

**按照本指南操作，应用即可正常启动！** 🚀
