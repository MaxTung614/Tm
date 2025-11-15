# ✅ 二维码"已过期"问题 - 终极修复

## ⚠️ 问题现象

用户扫码后点击确认，二维码仍然显示"已过期"。

---

## 🎯 根本原因

淘宝扫码登录需要**完整的 Cookie 会话链**：

```
初始化页面 → 获取初始 Cookie
  ↓
生成二维码 → 携带初始 Cookie → 获取新 Cookie
  ↓
检查状态 → 携带完整 Cookie → 验证成功
```

**之前的问题**：
1. ❌ 初始化时获取了 Cookie，但没有保存
2. ❌ 生成二维码时没有携带初始 Cookie
3. ❌ 检查状态时 Cookie 不完整

**结果**：
- 淘宝检测到 Cookie 不完整或会话异常
- 返回"已过期"状态

---

## 🔧 完整修复方案

### **1️⃣ 初始化阶段：提取并返回初始 Cookie**

```typescript
async function initLoginBefore() {
  const res = await fetch(
    "https://login.taobao.com/member/login.jhtml?redirectURL=https://www.taobao.com/",
    {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0...",
        Referer: "https://www.taobao.com/",
      },
    },
  );

  // ✅ 提取初始 Cookie（关键！）
  const setCookieHeaders = res.headers.getSetCookie?.() || [];
  const cookies: string[] = [];
  
  for (const setCookie of setCookieHeaders) {
    const cookiePair = setCookie.split(';')[0];
    if (cookiePair) {
      cookies.push(cookiePair.trim());
    }
  }
  
  const initialCookies = cookies.join('; ');
  console.log(`[QR] 🍪 初始 Cookie 提取: ${cookies.length} 个`);

  // 提取 csrf 和 umidToken...

  return {
    csrf: csrf,
    umidToken: umidToken,
    initialCookies: initialCookies, // ← 返回初始 Cookie
  };
}
```

---

### **2️⃣ 生成二维码阶段：携带初始 Cookie 并合并新 Cookie**

```typescript
// 获取初始 Cookie
const { csrf, umidToken, initialCookies } = await initLoginBefore();

// ✅ 携带初始 Cookie 生成二维码
const genHeaders: Record<string, string> = {
  "User-Agent": "Mozilla/5.0...",
  Referer: "https://login.taobao.com/",
  Accept: "application/json, text/javascript, */*; q=0.01",
};

if (initialCookies) {
  genHeaders["Cookie"] = initialCookies; // ← 携带初始 Cookie
  console.log(`[QR] 🍪 使用初始 Cookie 生成二维码`);
}

const response = await fetch(qrGenUrl.toString(), {
  method: "GET",
  headers: genHeaders,
});

// ✅ 提取新 Cookie
const setCookieHeaders = response.headers.getSetCookie?.() || [];
const newCookies: string[] = [];

for (const setCookie of setCookieHeaders) {
  const cookiePair = setCookie.split(';')[0];
  if (cookiePair) {
    newCookies.push(cookiePair.trim());
  }
}

const newCookieString = newCookies.join('; ');
console.log(`[QR] 🍪 二维码生成请求返回 ${newCookies.length} 个 Cookie`);

// ✅ 合并初始 Cookie 和新 Cookie（关键！）
const allCookies = new Set<string>();

// 添加初始 Cookie
if (initialCookies) {
  initialCookies.split(';').forEach(cookie => {
    const trimmed = cookie.trim();
    if (trimmed) {
      allCookies.add(trimmed);
    }
  });
}

// 添加新 Cookie（会覆盖同名的旧 Cookie）
if (newCookieString) {
  newCookieString.split(';').forEach(cookie => {
    const trimmed = cookie.trim();
    if (trimmed) {
      // 提取 cookie 名称
      const cookieName = trimmed.split('=')[0];
      // 删除旧的同名 cookie
      allCookies.forEach(existingCookie => {
        if (existingCookie.startsWith(cookieName + '=')) {
          allCookies.delete(existingCookie);
        }
      });
      // 添加新 cookie
      allCookies.add(trimmed);
    }
  });
}

const finalCookieString = Array.from(allCookies).join('; ');
console.log(`[QR] 🍪 合并后的 Cookie (${allCookies.size} 个)`);

// ✅ 保存完整 Cookie
await kv.set(
  `qr_session:${sessionId}`,
  JSON.stringify({
    t: t,
    ck: ck,
    csrf: csrf,
    umidToken: umidToken,
    cookies: finalCookieString, // ← 保存完整 Cookie
    qrCodeUrl: qrUrl,
    status: "waiting",
    createdAt: Date.now(),
    expiresAt: Date.now() + 300000,
  }),
);
```

---

### **3️⃣ 检查状态阶段：使用完整 Cookie**

```typescript
// 从 KV 获取会话信息
const session = JSON.parse(sessionData);

// ✅ 使用保存的完整 Cookie
const headers: Record<string, string> = {
  "Content-Type": "application/x-www-form-urlencoded",
  "User-Agent": "Mozilla/5.0...",
  "Referer": "https://login.taobao.com/",
  "Accept": "application/json, text/javascript, */*; q=0.01",
};

// 添加 Cookie 请求头
if (session.cookies) {
  headers["Cookie"] = session.cookies; // ← 使用完整 Cookie
  console.log(`[QR] 🍪 使用 Cookie: ${session.cookies.substring(0, 100)}...`);
} else {
  console.log(`[QR] ⚠️ 警告：没有可用的 Cookie`);
}

const response = await fetch(checkUrl, {
  method: "POST",
  headers: headers,
  body: new URLSearchParams(checkData as any).toString(),
});
```

---

## 📊 修复前后对比

### **修复前 ❌**

```
初始化
  ↓ 获取 Cookie: [cna=xxx, t=xxx]
  ↓ ❌ 没有保存
  ↓
生成二维码
  ↓ ❌ 没有携带初始 Cookie
  ↓ 获取新 Cookie: [_m_h5_tk=yyy]
  ↓ ❌ 只保存了新 Cookie
  ↓
检查状态
  ↓ ❌ 只使用新 Cookie: [_m_h5_tk=yyy]
  ↓ 淘宝：Cookie 不完整，会话无效
  ↓
❌ 返回"已过期"
```

---

### **修复后 ✅**

```
初始化
  ↓ 获取 Cookie: [cna=xxx, t=xxx]
  ↓ ✅ 保存并返回
  ↓
生成二维码
  ↓ ✅ 携带初始 Cookie: [cna=xxx, t=xxx]
  ↓ 获取新 Cookie: [_m_h5_tk=yyy]
  ↓ ✅ 合并 Cookie: [cna=xxx, t=xxx, _m_h5_tk=yyy]
  ↓
检查状态
  ↓ ✅ 使用完整 Cookie: [cna=xxx, t=xxx, _m_h5_tk=yyy]
  ↓ 淘宝：Cookie 完整，会话有效
  ↓
✅ 返回正常状态（waiting/scanned/confirmed）
```

---

## 🔍 Cookie 合并逻辑详解

### **为什么需要合并？**

淘宝的 Cookie 分为多个部分：
1. **会话 Cookie**（初始化时获取）：`cna`、`t`、`isg` 等
2. **验证 Cookie**（生成二维码时获取）：`_m_h5_tk`、`_m_h5_tk_enc` 等
3. **登录 Cookie**（确认登录时获取）：`_tb_token_`、`cookie2` 等

**每个阶段的 Cookie 都很重要**，缺少任何一个都可能导致验证失败。

---

### **如何合并？**

1. **初始 Cookie**：
   ```
   cna=abc123; t=def456; isg=ghi789
   ```

2. **新 Cookie**：
   ```
   _m_h5_tk=jkl012; _m_h5_tk_enc=mno345; t=xyz999
   ```

3. **合并规则**：
   - 保留所有初始 Cookie
   - 新 Cookie 会**覆盖**同名的旧 Cookie
   - 最终结果：
     ```
     cna=abc123; t=xyz999; isg=ghi789; _m_h5_tk=jkl012; _m_h5_tk_enc=mno345
     ```

4. **代码实现**：
   ```typescript
   const allCookies = new Set<string>();
   
   // 添加初始 Cookie
   initialCookies.split(';').forEach(cookie => {
     const trimmed = cookie.trim();
     if (trimmed) {
       allCookies.add(trimmed);
     }
   });
   
   // 添加新 Cookie（覆盖同名）
   newCookies.split(';').forEach(cookie => {
     const trimmed = cookie.trim();
     if (trimmed) {
       const cookieName = trimmed.split('=')[0];
       // 删除旧的同名 cookie
       allCookies.forEach(existingCookie => {
         if (existingCookie.startsWith(cookieName + '=')) {
           allCookies.delete(existingCookie);
         }
       });
       // 添加新 cookie
       allCookies.add(trimmed);
     }
   });
   
   const finalCookieString = Array.from(allCookies).join('; ');
   ```

---

## ✅ 核心修复点总结

| 阶段 | 修复前 ❌ | 修复后 ✅ |
|------|----------|----------|
| **初始化** | 获取 Cookie 但不保存 | 提取并返回初始 Cookie |
| **生成二维码** | 不携带初始 Cookie | 携带初始 Cookie |
| **生成二维码** | 只保存新 Cookie | 合并初始和新 Cookie |
| **检查状态** | 使用不完整 Cookie | 使用完整合并后的 Cookie |
| **结果** | 淘宝返回"已过期" | 淘宝正常返回状态 |

---

## 🚀 部署和测试

### **1. 部署后端代码**

将更新后的 `/supabase/functions/server/index.tsx` 部署到 Supabase。

---

### **2. 清除旧会话**

旧的会话数据没有完整 Cookie，必须清除：

```sql
DELETE FROM kv_store_c6898dcb 
WHERE key LIKE 'qr_session:%';
```

---

### **3. 测试流程**

1. **生成新二维码**
   - 打开应用，点击"添加账号"
   - 查看 Supabase 日志

2. **检查日志（关键！）**
   ```bash
   # 应该看到：
   [QR] 🍪 初始 Cookie 提取: 3 个，预览: cna=...
   [QR] 🍪 使用初始 Cookie 生成二维码: cna=...
   [QR] 🍪 二维码生成请求返回 2 个 Cookie: _m_h5_tk=...
   [QR] 🍪 合并后的 Cookie (5 个): cna=...; t=...; _m_h5_tk=...
   ```

3. **扫码**
   - 用手机淘宝扫描二维码

4. **检查轮询日志**
   ```bash
   [QR] 🍪 使用 Cookie: cna=...; t=...; _m_h5_tk=...
   [QR] 状态: qrCodeStatus = SCANED
   ```

5. **点击确认**
   - ✅ **不应该显示"已过期"**
   - ✅ **应该显示"已扫码，等待确认"然后"登录成功"**

6. **验证成功**
   ```bash
   [QR] 状态: qrCodeStatus = CONFIRMED
   [QR] ✅ 登录成功！开始提取 Cookie
   [QR] 从 _nk_ 提取用户名: 张三
   [QR] 🏷️ 最终用户名: 张三
   ```

---

## 🐛 故障排查

### **问题1：仍然显示"已过期"**

**检查日志**：
```bash
[QR] 🍪 初始 Cookie 提取: 0 个
```

**原因**：初始化请求失败或被拦截

**解决**：
- 检查网络连接
- 检查 Supabase 是否正常运行

---

### **问题2：Cookie 没有合并**

**检查日志**：
```bash
[QR] 🍪 合并后的 Cookie (1 个): _m_h5_tk=...
```

**原因**：初始 Cookie 没有传递到生成二维码函数

**解决**：
- 检查 `initLoginBefore` 是否返回 `initialCookies`
- 检查生成二维码时是否正确接收

---

### **问题3：Cookie 格式错误**

**检查日志**：
```bash
[QR] 🍪 使用 Cookie: cna=...;;; t=...
```

**原因**：Cookie 分隔符错误（多个分号）

**解决**：
- 检查 Cookie 合并逻辑
- 确保使用 `trim()` 去除多余空格

---

## 📄 修改文件

- `/supabase/functions/server/index.tsx` - 完整修复Cookie处理逻辑

---

## 🎉 预期效果

**修复后的完整流程**：

```
1. 用户点击"添加账号"
   ↓
2. 生成二维码
   - ✅ 提取初始 Cookie
   - ✅ 携带初始 Cookie 生成二维码
   - ✅ 合并所有 Cookie
   - ✅ 保存完整 Cookie
   ↓
3. 用户扫码
   - ✅ 前端开始轮询
   - ✅ 后端使用完整 Cookie 检查
   - ✅ 淘宝返回"已扫码"
   ↓
4. 用户点击确认
   - ✅ 后端使用完整 Cookie 检查
   - ✅ 淘宝返回"已确认"
   - ✅ 提取用户 Cookie 和用户名
   ↓
5. ✅ 登录成功！账号添加完成
```

---

## 🎓 技术要点

### **1. Cookie 会话链的重要性**

淘宝的扫码登录使用**有状态会话**，每个请求都必须携带完整的 Cookie 链，缺少任何一个都可能导致验证失败。

---

### **2. Cookie 覆盖机制**

当有同名 Cookie 时，**新的会覆盖旧的**。这是浏览器的标准行为，我们的代码模拟了这个机制。

---

### **3. Set-Cookie 响应头**

`getSetCookie()` 返回的是**数组**，每个元素是一个完整的 Set-Cookie 字符串，包含：
- Cookie 名称和值：`name=value`
- 属性：`Path=/; Domain=.taobao.com; Max-Age=3600; HttpOnly`

我们只需要**名称和值**，所以使用 `.split(';')[0]` 提取。

---

### **4. Cookie 请求头格式**

发送请求时，Cookie 请求头格式为：
```
Cookie: name1=value1; name2=value2; name3=value3
```

注意：**分号后有空格**（`; `），不是`;`。

---

## 🎯 总结

**修复的核心**：
1. ✅ 提取初始 Cookie
2. ✅ 携带初始 Cookie 生成二维码
3. ✅ 合并所有阶段的 Cookie
4. ✅ 检查状态时使用完整 Cookie

**预期效果**：
- ✅ 二维码不再提前过期
- ✅ 用户点击确认后正常登录
- ✅ 成功提取用户 Cookie 和用户名

---

**修复已完成！请重新部署并测试！** ✅
