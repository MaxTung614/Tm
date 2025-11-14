# 🔐 快速登录指南

## ⚡ 立即登录（无需配置）

### 测试账号
```
用户名: admin
密码: admin
```

### 登录步骤
1. 访问 http://localhost:5173/login
2. 输入用户名: `admin`
3. 输入密码: `admin`
4. 点击"立即登录"

✅ **就这么简单！**

---

## ❓ 为什么 Supabase 创建的账号不能用？

**简短回答**: 当前登录系统没有连接 Supabase Auth。

**详细说明**: 查看 `/LOGIN-ISSUE-SOLUTION.md`

---

## 🔄 如何切换到 Supabase Auth？

告诉我："我想使用 Supabase 登录"，我会帮您：

1. ✅ 修改 AuthContext 集成 Supabase
2. ✅ 改为邮箱登录
3. ✅ 支持多用户
4. ✅ 密码修改/重置

**预计用时**: 5 分钟

---

## 🎯 当前系统架构

```
登录系统 (测试账号 admin/admin)
   ↓
Dashboard
   ↓
其他功能 (账号管理、抢购等)
   ↓
Supabase 数据库 ✅ (已连接)
```

**重点**: 只有登录页面没连接 Supabase，其他功能都已连接！

---

## ✅ 推荐做法

### 个人使用/快速测试
→ 使用测试账号 `admin/admin`

### 生产环境/多用户
→ 集成 Supabase Auth（告诉我，我帮您修改）

---

**需要帮助？** 随时告诉我！
