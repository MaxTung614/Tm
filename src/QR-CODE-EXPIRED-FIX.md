# ✅ 二维码"已过期"问题修复

## ⚠️ 问题描述

**症状**：
- ✅ 可以正常生成二维码
- ✅ 可以用手机扫码
- ✅ 手机上显示登录确认页面
- ❌ **点击"确认登录"后，二维码显示"已过期"**

---

## 🎯 问题根源

### **关键发现**

淘宝扫码登录是一个**有状态的会话过程**：

1. **生成二维码时**，淘宝服务器会返回 `Set-Cookie` 响应头
2. **检查登录状态时**，必须携带这些 Cookie
3. **如果不携带 Cookie**，淘宝会认为是无效请求，导致二维码过期

### **原来的错误代码**

```tsx
// ❌ 生成二维码时：没有保存 Cookie
const response = await fetch(qrGenUrl.toString(), {
  method: "GET",
  headers: { ... }
});

await kv.set(`qr_session:${sessionId}`, JSON.stringify({
  t: t,
  ck: ck,
  csrf: csrf,
  umidToken: umidToken,
  // ❌ 缺少 cookies
}));

// ❌ 检查状态时：没有使用 Cookie
const response = await fetch(checkUrl, {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    // ❌ 缺少 Cookie 请求头
  }
});
```

**结果**：
- 第一次轮询：可能成功（状态：waiting）
- 第二次轮询：淘宝检测到没有 Cookie，认为会话无效
- 用户点击确认：淘宝拒绝请求，返回"已过期"

---

## ✅ 修复方案

### **1️⃣ 生成二维码时：提取并保存 Cookie**

```tsx
// ✅ 修复后：提取 Set-Cookie 响应头
const response = await fetch(qrGenUrl.toString(), {
  method: "GET",
  headers: { ... }
});

// ✅ 提取 Cookie
const setCookieHeaders = response.headers.getSetCookie?.() || [];
const cookies: string[] = [];

for (const setCookie of setCookieHeaders) {
  // 提取 cookie 名称和值（去掉过期时间、path 等属性）
  const cookiePair = setCookie.split(';')[0];
  if (cookiePair) {
    cookies.push(cookiePair.trim());
  }
}

const cookieString = cookies.join('; ');
console.log(`[QR] 🍪 提取到 ${cookies.length} 个 Cookie`);

// ✅ 保存到会话
await kv.set(`qr_session:${sessionId}`, JSON.stringify({
  t: t,
  ck: ck,
  csrf: csrf,
  umidToken: umidToken,
  cookies: cookieString, // ← 保存 Cookie
  ...
}));
```

---

### **2️⃣ 检查状态时：使用保存的 Cookie**

```tsx
// ✅ 修复后：从会话中读取 Cookie
const session = JSON.parse(sessionData);

const headers: Record<string, string> = {
  "Content-Type": "application/x-www-form-urlencoded",
  "User-Agent": "...",
  "Referer": "https://login.taobao.com/",
  "Accept": "application/json, text/javascript, */*; q=0.01",
};

// ✅ 添加 Cookie 请求头
if (session.cookies) {
  headers["Cookie"] = session.cookies;
  console.log(`[QR] 🍪 使用 Cookie: ${session.cookies.substring(0, 100)}...`);
} else {
  console.log(`[QR] ⚠️ 警告：没有可用的 Cookie`);
}

const response = await fetch(checkUrl, {
  method: "POST",
  headers: headers, // ← 使用包含 Cookie 的 headers
  body: new URLSearchParams(checkData as any).toString(),
});
```

---

## 📊 修复前后对比

### **修复前 ❌**

```
生成二维码
  ↓
淘宝返回 Cookie: _m_h5_tk=abc123; cna=xyz789
  ↓
❌ 没有保存 Cookie
  ↓
第1次轮询检查状态
  ↓
请求头：❌ 没有 Cookie
  ↓
淘宝：勉强接受（第一次）
  ↓
第2次轮询检查状态
  ↓
请求头：❌ 没有 Cookie
  ↓
淘宝：检测到会话异常，标记为过期
  ↓
用户点击"确认登录"
  ↓
❌ 二维码显示"已过期"
```

---

### **修复后 ✅**

```
生成二维码
  ↓
淘宝返回 Cookie: _m_h5_tk=abc123; cna=xyz789
  ↓
✅ 提取并保存 Cookie
  ↓
第1次轮询检查状态
  ↓
请求头：✅ Cookie: _m_h5_tk=abc123; cna=xyz789
  ↓
淘宝：✅ 会话有效，返回状态 waiting
  ↓
第2次轮询检查状态
  ↓
请求头：✅ Cookie: _m_h5_tk=abc123; cna=xyz789
  ↓
淘宝：✅ 会话有效，返回状态 waiting
  ↓
用户点击"确认登录"
  ↓
第3次轮询检查状态
  ↓
请求头：✅ Cookie: _m_h5_tk=abc123; cna=xyz789
  ↓
淘宝：✅ 会话有效，返回状态 confirmed
  ↓
✅ 登录成功！提取用户 Cookie
```

---

## 🔍 关键技术细节

### **1. Set-Cookie 响应头处理**

淘宝返回的 `Set-Cookie` 格式：
```
Set-Cookie: _m_h5_tk=abc123def456; Path=/; Domain=.taobao.com; Max-Age=3600
Set-Cookie: cna=xyz789ghi012; Path=/; Domain=.taobao.com; Expires=...
Set-Cookie: XSRF-TOKEN=jkl345mno678; Path=/; HttpOnly
```

我们需要：
- ✅ 提取 cookie 名称和值：`_m_h5_tk=abc123def456`
- ❌ 去掉属性：`Path`、`Domain`、`Max-Age`、`Expires`、`HttpOnly` 等

**代码实现**：
```tsx
const setCookieHeaders = response.headers.getSetCookie?.() || [];
const cookies: string[] = [];

for (const setCookie of setCookieHeaders) {
  // split(';')[0] 只取第一部分
  const cookiePair = setCookie.split(';')[0];
  if (cookiePair) {
    cookies.push(cookiePair.trim());
  }
}

// 结果：["_m_h5_tk=abc123def456", "cna=xyz789ghi012", "XSRF-TOKEN=jkl345mno678"]
```

---

### **2. Cookie 请求头格式**

发送请求时，Cookie 请求头格式：
```
Cookie: _m_h5_tk=abc123def456; cna=xyz789ghi012; XSRF-TOKEN=jkl345mno678
```

**代码实现**：
```tsx
const cookieString = cookies.join('; ');
// 结果："_m_h5_tk=abc123def456; cna=xyz789ghi012; XSRF-TOKEN=jkl345mno678"

headers["Cookie"] = cookieString;
```

---

### **3. 会话数据结构**

```typescript
interface QRSession {
  t: string;           // 时间戳参数
  ck: string;          // 会话令牌
  csrf: string;        // CSRF Token
  umidToken: string;   // 设备指纹
  cookies: string;     // ← 新增：Cookie 字符串
  qrCodeUrl: string;   // 二维码 URL
  status: string;      // 状态：waiting/scanned/confirmed
  createdAt: number;   // 创建时间
  expiresAt: number;   // 过期时间
}
```

---

## ✅ 验证步骤

### **测试流程**

1. **清除旧会话**
   - 删除 Supabase 中的旧 `qr_session:*` 数据
   - 确保使用新的修复代码

2. **生成二维码**
   ```bash
   # 查看 Supabase 日志
   [QR] 🍪 提取到 3 个 Cookie: _m_h5_tk=abc...; cna=xyz...; XSRF-TOKEN=jkl...
   ```

3. **用手机扫码**
   - 手机上显示登录确认页面
   - ✅ 页面正常显示

4. **查看轮询日志**
   ```bash
   [QR] ========== 检查二维码状态: qr_xxx ==========
   [QR] 🍪 使用 Cookie: _m_h5_tk=abc...; cna=xyz...; XSRF-TOKEN=jkl...
   [QR] 状态: qrCodeStatus = SCANED
   ```

5. **点击"确认登录"**
   - ✅ 不应该显示"已过期"
   - ✅ 应该成功登录

6. **查看成功日志**
   ```bash
   [QR] 状态: qrCodeStatus = CONFIRMED
   [QR] ✅ 登录成功！开始提取 Cookie
   [QR] ✅ Cookie 提取完成，长度: 1234
   ```

---

### **检查点**

**生成二维码时**：
- ✅ 日志显示：`提取到 X 个 Cookie`
- ✅ Cookie 长度 > 0
- ✅ Cookie 包含 `_m_h5_tk`、`cna` 等关键字段

**检查状态时**：
- ✅ 日志显示：`使用 Cookie: ...`
- ✅ 没有警告：`没有可用的 Cookie`
- ✅ 状态正常切换：waiting → scanned → confirmed

**确认登录后**：
- ✅ 不显示"已过期"
- ✅ 成功提取用户 Cookie
- ✅ 账号添加成功

---

## 🎯 核心修复点总结

| 修复点 | 修复前 ❌ | 修复后 ✅ |
|--------|----------|----------|
| **生成二维码** | 不提取 Cookie | 提取并保存 Cookie |
| **保存会话** | 不包含 cookies 字段 | 包含 cookies 字段 |
| **检查状态** | 请求头无 Cookie | 请求头包含 Cookie |
| **会话状态** | 被淘宝标记为异常 | 被淘宝认为是合法会话 |
| **用户体验** | 点击确认后过期 | 点击确认后成功登录 |

---

## 📄 修复文件

- `/supabase/functions/server/index.tsx` - 修复扫码登录 Cookie 处理

---

## 🎓 技术要点

### **为什么淘宝需要 Cookie？**

1. **会话跟踪**：淘宝用 Cookie 跟踪同一个二维码会话
2. **安全防护**：防止攻击者伪造请求
3. **设备指纹**：结合 Cookie 和 umidToken 验证设备合法性
4. **反爬虫**：检测异常请求模式

### **为什么之前没发现？**

1. **TSDK 代码不明显**：Cookie 处理隐藏在底层库中
2. **淘宝容错性**：第一次请求可能不严格检查
3. **异步问题**：用户点击确认时才触发严格验证

### **类似的坑**

其他需要注意 Cookie 的场景：
- 登录流程中的多步验证
- OAuth 授权流程
- Session-based 的 API
- 需要保持会话的爬虫

---

## ✅ 总结

**根本原因**：
- 淘宝扫码登录是有状态会话，必须携带 Cookie

**修复方法**：
1. 生成二维码时提取 Set-Cookie
2. 保存到会话数据
3. 检查状态时携带 Cookie 请求头

**预期效果**：
- ✅ 二维码不再提前过期
- ✅ 确认登录后正常完成
- ✅ 成功提取用户 Cookie

---

**修复已完成！请重新部署 Supabase Edge Function 并测试！** ✅

**测试步骤**：
1. 部署 Edge Function
2. 生成新二维码
3. 扫码
4. 确认登录
5. ✅ 成功！

---

**如果还有问题，检查 Supabase 日志中的 Cookie 信息！** 🔍
