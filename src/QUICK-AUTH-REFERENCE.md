# ⚡ Supabase Auth 快速参考

## 🎉 已完成！

您的登录系统现在使用 **Supabase Authentication**！

---

## 📝 创建用户账号（3 步）

### 在 Supabase Dashboard：

1. **Authentication** → **Users**
2. 点击 **Add User**
3. 填写：
   - Email: `your-email@example.com`
   - Password: `your-password`
   - ✅ **勾选 Auto Confirm User**（重要！）
4. 点击 **Create User**

---

## 🔑 登录

访问：http://localhost:5173/login

```
邮箱: your-email@example.com
密码: your-password
```

点击"立即登录" → 进入 Dashboard

---

## ✅ 已修改的文件

1. `/contexts/AuthContext.tsx` - 集成 Supabase Auth
2. `/pages/Login.tsx` - 邮箱登录界面

---

## 🔍 检查是否正常工作

### 控制台应显示：
```
✅ 使用 Real API 服务（生产模式）
✅ Supabase 客户端初始化成功
```

### 登录成功后：
- ✅ Toast 提示"登录成功！"
- ✅ 跳转到 Dashboard
- ✅ 顶部显示用户邮箱

---

## 🐛 常见问题

### Q: 提示"邮箱或密码错误"？
**A**: 检查：
1. Supabase 用户是否已创建
2. 创建时是否勾选了"Auto Confirm"
3. 邮箱密码是否正确
4. `.env.local` 配置是否正确

### Q: 一直显示"加载中..."？
**A**: 
1. 检查 `.env.local` 文件
2. 确认 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`
3. 重启开发服务器

### Q: 想添加注册功能？
**A**: 告诉我，我立即帮您添加！

---

## 🚀 现在可以：

- ✅ 使用 Supabase 账号登录
- ✅ 创建多个用户
- ✅ 真实的 Session 管理
- ✅ 安全的密码存储

---

**完整文档**: 查看 `/SUPABASE-AUTH-SETUP.md`
