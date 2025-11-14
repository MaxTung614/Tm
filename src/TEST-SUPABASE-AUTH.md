# 🧪 测试 Supabase Auth - 完整步骤

## 📋 测试前准备

### ✅ 确认以下条件：
- [ ] 已安装依赖：`npm install`
- [ ] 已创建 `.env.local` 文件
- [ ] 已填写 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`
- [ ] 已设置 `VITE_USE_MOCK_API=false`
- [ ] 开发服务器正在运行：`npm run dev`

---

## 🎯 测试步骤

### 第 1 步：创建测试用户（5 分钟）

#### 1.1 访问 Supabase Dashboard
```
https://supabase.com/dashboard
```

#### 1.2 进入 Authentication
```
左侧菜单 → Authentication → Users
```

#### 1.3 添加用户
```
点击 "Add User" 按钮

填写信息：
├─ Email: test@example.com
├─ Password: test123456
└─ ✅ Auto Confirm User ← 必须勾选！

点击 "Create User"
```

#### 1.4 验证用户已创建
```
在用户列表中应该看到：
├─ test@example.com
├─ Status: Confirmed
└─ Created at: [当前时间]
```

**截图位置**：
```
Supabase Dashboard
└─ Authentication
   └─ Users
      └─ [您的新用户]
```

---

### 第 2 步：测试登录（5 分钟）

#### 2.1 打开登录页面
```
http://localhost:5173/login
```

#### 2.2 检查控制台日志（F12）
```
应该看到：
✅ 使用 Real API 服务（生产模式）
✅ Supabase 客户端初始化成功
```

如果看到：
```
⚠️ Supabase 环境变量未配置
```
说明 `.env.local` 配置有误，请检查。

#### 2.3 输入登录信息
```
邮箱: test@example.com
密码: test123456
```

#### 2.4 点击"立即登录"

**预期结果**：
- ✅ Toast 提示"登录成功！"
- ✅ 自动跳转到 Dashboard
- ✅ 地址栏变为 `http://localhost:5173/`

**如果失败**：
- ❌ Toast 提示"邮箱或密码错误"
- ❌ 查看控制台错误信息
- ❌ 参考故障排除章节

---

### 第 3 步：验证登录状态（2 分钟）

#### 3.1 检查 Dashboard
```
应该看到：
├─ 顶部导航栏
├─ 统计卡片
└─ 红包列表
```

#### 3.2 在控制台验证 Session
```javascript
// 在浏览器控制台（F12）输入：
await supabase.auth.getSession().then(console.log)

// 应该看到：
{
  data: {
    session: {
      access_token: "eyJhbGci...",
      user: {
        id: "550e8400-...",
        email: "test@example.com",
        ...
      }
    }
  }
}
```

#### 3.3 检查 Supabase 连接状态
```
Dashboard 顶部应显示：
🟢 Supabase 已连接
```

---

### 第 4 步：测试 Session 持久化（2 分钟）

#### 4.1 刷新页面
```
按 F5 或点击刷新按钮
```

**预期结果**：
- ✅ 不需要重新登录
- ✅ 仍然在 Dashboard 页面
- ✅ Session 自动恢复

#### 4.2 打开新标签页
```
Ctrl + T (Windows/Linux)
Cmd + T (Mac)

访问：http://localhost:5173
```

**预期结果**：
- ✅ 自动登录
- ✅ 直接显示 Dashboard
- ✅ 不需要输入密码

#### 4.3 检查多标签同步
```
在任一标签页点击：
设置 → 退出登录
```

**预期结果**：
- ✅ 所有标签页同时登出
- ✅ 所有标签页跳转到登录页

---

### 第 5 步：测试登出功能（1 分钟）

#### 5.1 重新登录
```
邮箱: test@example.com
密码: test123456
```

#### 5.2 进入设置页面
```
左侧菜单 → 设置
```

#### 5.3 点击"退出登录"

**预期结果**：
- ✅ 自动跳转到登录页
- ✅ 地址栏变为 `/login`
- ✅ 再次访问 `/` 会被重定向到 `/login`

#### 5.4 验证 Session 已清除
```javascript
// 在浏览器控制台输入：
await supabase.auth.getSession().then(console.log)

// 应该看到：
{
  data: {
    session: null
  }
}
```

---

### 第 6 步：测试错误处理（3 分钟）

#### 6.1 测试错误的密码
```
邮箱: test@example.com
密码: wrong-password
```

**预期结果**：
- ❌ Toast 提示"邮箱或密码错误，请检查后重试"
- ❌ 停留在登录页
- ❌ 控制台显示错误日志

#### 6.2 测试不存在的邮箱
```
邮箱: notexist@example.com
密码: test123456
```

**预期结果**：
- ❌ Toast 提示"邮箱或密码错误，请检查后重试"

#### 6.3 测试无效的邮箱格式
```
邮箱: invalid-email
密码: test123456
```

**预期结果**：
- ❌ Toast 提示"请输入有效的邮箱地址"
- ❌ 不会发送请求到服务器

#### 6.4 测试空字段
```
邮箱: [空]
密码: [空]
```

**预期结果**：
- ❌ Toast 提示"请输入邮箱和密码"

---

## ✅ 测试通过标准

### 所有以下测试都应通过：

- [x] **用户创建**
  - [x] 在 Supabase Dashboard 成功创建用户
  - [x] 用户状态为 Confirmed

- [x] **登录功能**
  - [x] 正确的邮箱密码可以登录
  - [x] 登录后跳转到 Dashboard
  - [x] Toast 提示"登录成功！"

- [x] **Session 管理**
  - [x] Session 自动保存
  - [x] 刷新页面不需要重新登录
  - [x] 新标签页自动登录

- [x] **登出功能**
  - [x] 可以正常登出
  - [x] 登出后跳转到登录页
  - [x] 多标签页同步登出

- [x] **错误处理**
  - [x] 错误密码有提示
  - [x] 不存在的邮箱有提示
  - [x] 无效邮箱格式有提示
  - [x] 空字段有提示

---

## 🐛 常见问题和解决方案

### 问题 1: "邮箱或密码错误"（但确定是正确的）

**可能原因**：
1. 创建用户时忘记勾选 "Auto Confirm User"
2. Supabase 项目暂停（免费版会自动暂停）
3. 环境变量配置错误

**解决方案**：
```bash
# 1. 检查 Supabase Dashboard
# Authentication → Users → 查看用户状态

# 2. 检查项目是否暂停
# 项目首页 → 如果暂停会有提示 → 点击 "Resume"

# 3. 检查环境变量
cat .env.local
# 确认 URL 和 ANON_KEY 正确

# 4. 重启开发服务器
npm run dev
```

---

### 问题 2: 一直显示"加载中..."

**可能原因**：
1. Supabase URL 或 KEY 错误
2. 网络连接问题
3. Supabase 服务不可用

**解决方案**：
```bash
# 1. 检查控制台错误
# F12 → Console → 查看错误信息

# 2. 检查环境变量
cat .env.local
# 确认格式正确，没有多余的空格或引号

# 3. 测试 Supabase 连接
# 在控制台输入：
await supabase.auth.getSession()
# 如果返回错误，说明配置有问题

# 4. 重新生成 ANON_KEY
# Supabase Dashboard → Settings → API
# 复制新的 anon public key
```

---

### 问题 3: 登录成功但立即退出

**可能原因**：
1. 浏览器禁用了 Cookie
2. LocalStorage 被清除
3. Supabase Client 配置错误

**解决方案**：
```bash
# 1. 检查浏览器 Cookie 设置
# 浏览器设置 → 隐私和安全 → Cookie → 允许

# 2. 清除所有缓存
# F12 → Application → Clear storage → Clear site data

# 3. 使用隐私模式测试
# Ctrl + Shift + N (Chrome)
# 访问 http://localhost:5173

# 4. 检查 supabase client 初始化
# 控制台应该看到：
# ✅ Supabase 客户端初始化成功
```

---

### 问题 4: Toast 不显示

**可能原因**：
1. Sonner 未正确导入
2. Toaster 组件未添加

**解决方案**：
```tsx
// 检查 App.tsx
import { Toaster } from './components/ui/sonner';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
        <Toaster position="top-center" /> {/* 必须有这行 */}
      </Router>
    </AuthProvider>
  );
}
```

---

## 📊 测试报告模板

### 测试日期：___________
### 测试人：___________

| 测试项 | 结果 | 备注 |
|--------|------|------|
| 创建用户 | ☐ 通过 ☐ 失败 | |
| 正确登录 | ☐ 通过 ☐ 失败 | |
| 错误密码 | ☐ 通过 ☐ 失败 | |
| 刷新页面 | ☐ 通过 ☐ 失败 | |
| 新标签页 | ☐ 通过 ☐ 失败 | |
| 登出功能 | ☐ 通过 ☐ 失败 | |
| 多标签同步 | ☐ 通过 ☐ 失败 | |
| 错误提示 | ☐ 通过 ☐ 失败 | |

**总体评分**: _____ / 8

**问题记录**:
- ________________________________
- ________________________________
- ________________________________

**建议**:
- ________________________________
- ________________________________

---

## 🎓 高级测试（可选）

### 测试 Token 刷新
```javascript
// 1. 登录后获取 token
const { data: { session } } = await supabase.auth.getSession();
console.log('Initial token:', session.access_token);

// 2. 等待一段时间（或手动修改 token 过期时间）

// 3. 刷新页面或触发 API 请求

// 4. 检查 token 是否自动刷新
const { data: { session: newSession } } = await supabase.auth.getSession();
console.log('New token:', newSession.access_token);
// 应该是不同的 token
```

### 测试并发登录
```
1. 在浏览器 A 登录 user1@example.com
2. 在浏览器 B 登录 user2@example.com
3. 两个 session 应该独立工作
4. 在 A 登出不影响 B
```

### 测试 Session 过期
```javascript
// 1. 登录
// 2. 在 Supabase Dashboard 手动删除该用户
// 3. 刷新页面
// 4. 应该自动跳转到登录页
```

---

## ✅ 测试完成！

如果所有测试都通过，恭喜！🎉

您的 Supabase Auth 集成完全正常，可以投入使用！

---

**下一步**：开始使用系统的其他功能（账号管理、红包抢购等）

**需要帮助**：随时告诉我！
