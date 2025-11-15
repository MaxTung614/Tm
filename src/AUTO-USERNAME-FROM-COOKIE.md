# ✅ 自动从 Cookie 提取账号名称功能

## 🎯 功能说明

**改进前 ❌**：
- 用户扫码登录后，需要手动输入账号名称
- 容易输错或遗忘真实账号名

**改进后 ✅**：
- 扫码成功后，自动从 Cookie 中提取淘宝用户名
- 用户无需手动输入，直接点击保存即可

---

## 🔧 实现方案

### **1️⃣ 后端：从 Cookie 提取用户名**

淘宝 Cookie 中包含多个用户名字段，按优先级尝试提取：

| 字段名 | 说明 | 示例 |
|--------|------|------|
| `_nk_` | 用户昵称（URL 编码） | `_nk_=%E5%BC%A0%E4%B8%89` → 张三 |
| `tracknick` | 跟踪昵称（URL 编码） | `tracknick=zhangsan123` |
| `lgc` | 登录账号 | `lgc=zhangsan%40example.com` |

**代码实现**（`/supabase/functions/server/index.tsx`）：

```typescript
// ✅ 提取用户名（从 Cookie 中）
let username = "未知用户";

// 方法1: 尝试从 _nk_ 字段提取（URL 编码的用户名）
const nkMatch = cookieString.match(/_nk_=([^;]+)/);
if (nkMatch) {
  try {
    username = decodeURIComponent(nkMatch[1]);
    console.log(`[QR] 从 _nk_ 提取用户名: ${username}`);
  } catch (err) {
    console.error(`[QR] 解码 _nk_ 失败:`, err);
  }
}

// 方法2: 尝试从 tracknick 字段提取
if (username === "未知用户") {
  const tracknickMatch = cookieString.match(/tracknick=([^;]+)/);
  if (tracknickMatch) {
    try {
      username = decodeURIComponent(tracknickMatch[1]);
      console.log(`[QR] 从 tracknick 提取用户名: ${username}`);
    } catch (err) {
      console.error(`[QR] 解码 tracknick 失败:`, err);
    }
  }
}

// 方法3: 尝试从 lgc 字段提取（登录账号）
if (username === "未知用户") {
  const lgcMatch = cookieString.match(/lgc=([^;]+)/);
  if (lgcMatch) {
    try {
      username = decodeURIComponent(lgcMatch[1]);
      console.log(`[QR] 从 lgc 提取用户名: ${username}`);
    } catch (err) {
      console.error(`[QR] 解码 lgc 失败:`, err);
    }
  }
}

console.log(`[QR] 🏷️ 最终用户名: ${username}`);

// 返回给前端
return c.json({
  success: true,
  data: {
    status: "confirmed",
    cookie: cookieString,
    username: username, // ← 新增：返回用户名
  },
});
```

---

### **2️⃣ 前端：接收并使用用户名**

#### **修改 QRCodeLogin 组件**

```typescript
// 修改接口定义
interface QRCodeLoginProps {
  onSuccess: (cookie: string, username: string) => void; // ← 添加 username 参数
}

// 轮询检查时提取 username
const { status: qrStatus, cookie, username } = response.data;

if (qrStatus === 'confirmed' && cookie && username) {
  setTimeout(() => {
    onSuccess(cookie, username); // ← 传递 username
  }, 500);
}
```

---

#### **修改 Accounts.tsx 页面**

```typescript
// 扫码登录成功回调
const handleQRCodeSuccess = (cookie: string, username: string) => {
  setFormData(prev => ({ 
    ...prev, 
    cookie,
    name: username // ← 自动填充用户名
  }));
  toast.success(`扫码成功！已获取账号：${username}`, {
    duration: 3000,
  });
};
```

---

#### **修改 UI 显示**

扫码登录标签页中，移除手动输入账号名称的输入框，改为显示自动获取的用户名：

```tsx
{formData.cookie && formData.name && (
  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
    <div className="flex items-start space-x-2">
      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
      <div className="text-sm text-green-800">
        <p className="font-medium mb-1">✅ 登录成功</p>
        <p className="text-xs">
          账号名称：<span className="font-semibold">{formData.name}</span>
        </p>
        <p className="text-xs mt-1">
          Cookie 已获取，点击保存按钮完成添加
        </p>
      </div>
    </div>
  </div>
)}
```

---

## 📊 用户体验对比

### **改进前 ❌**

```
1. 用户扫码
   ↓
2. 扫码成功
   ↓
3. 提示"请输入账号名称"
   ↓
4. 用户手动输入（可能输错）
   ↓
5. 点击保存
```

---

### **改进后 ✅**

```
1. 用户扫码
   ↓
2. 扫码成功
   ↓
3. 自动显示"账号名称：张三"
   ↓
4. 用户直接点击保存
```

**节省步骤**：1 步  
**减少错误**：避免手动输入错误  
**提升体验**：更加自动化和智能

---

## 🔍 Cookie 字段说明

### **_nk_ 字段**

- **含义**：淘宝用户昵称（URL 编码）
- **格式**：`_nk_=%E5%BC%A0%E4%B8%89`
- **解码后**：`张三`
- **优先级**：⭐⭐⭐⭐⭐（最高，通常存在）

---

### **tracknick 字段**

- **含义**：用于跟踪的用户昵称
- **格式**：`tracknick=zhangsan123`
- **优先级**：⭐⭐⭐⭐（次高）

---

### **lgc 字段**

- **含义**：登录账号（Login Account）
- **格式**：`lgc=zhangsan%40example.com`
- **解码后**：`zhangsan@example.com`
- **优先级**：⭐⭐⭐（备用）

---

## ✅ 测试流程

### **1. 部署后端代码**

1. 复制更新后的 `/supabase/functions/server/index.tsx`
2. 在 Supabase Dashboard 中部署 Edge Function
3. 确认部署成功

---

### **2. 测试扫码登录**

1. **打开应用**
   - 进入账号管理页面
   - 点击"添加账号"
   - 选择"扫码登录"标签

2. **扫码**
   - 用手机淘宝扫描二维码
   - 在手机上点击"确认登录"

3. **检查日志**
   ```bash
   # Supabase 日志中应该看到：
   [QR] 从 _nk_ 提取用户名: 张三
   [QR] 🏷️ 最终用户名: 张三
   ```

4. **验证前端**
   - ✅ 显示"登录成功"
   - ✅ 显示"账号名称：张三"
   - ✅ 无需手动输入

5. **保存账号**
   - 点击"保存"按钮
   - ✅ 账号列表中显示"张三"

---

## 🐛 故障排查

### **问题1：显示"未知用户"**

**原因**：
- Cookie 中没有 `_nk_`、`tracknick`、`lgc` 字段
- 字段值为空

**解决方案**：
1. 查看 Supabase 日志中的 Cookie 内容
2. 检查是否包含用户名字段
3. 如果确实没有，需要手动输入（回退到手动模式）

---

### **问题2：用户名乱码**

**原因**：
- URL 编码的用户名解码失败
- 编码格式不是 UTF-8

**解决方案**：
```typescript
// 添加错误处理
try {
  username = decodeURIComponent(nkMatch[1]);
} catch (err) {
  // 如果解码失败，尝试不解码
  username = nkMatch[1];
}
```

---

### **问题3：用户名包含特殊字符**

**示例**：`%E5%BC%A0%E4%B8%89%40example.com`

**解决方案**：
- `decodeURIComponent` 会自动处理
- 结果：`张三@example.com`

---

## 🎯 核心修改点总结

| 修改点 | 文件 | 说明 |
|--------|------|------|
| **后端提取用户名** | `/supabase/functions/server/index.tsx` | 从 Cookie 提取 `_nk_`、`tracknick`、`lgc` |
| **返回用户名** | `/supabase/functions/server/index.tsx` | API 响应中添加 `username` 字段 |
| **组件接口** | `/components/auth/QRCodeLogin.tsx` | `onSuccess` 回调添加 `username` 参数 |
| **自动填充** | `/pages/Accounts.tsx` | `handleQRCodeSuccess` 自动填充 `formData.name` |
| **UI 显示** | `/pages/Accounts.tsx` | 移除手动输入，显示自动获取的用户名 |

---

## 📄 相关文件

- `/supabase/functions/server/index.tsx` - 后端用户名提取逻辑
- `/components/auth/QRCodeLogin.tsx` - 二维码登录组件
- `/pages/Accounts.tsx` - 账号管理页面

---

## 🎉 功能优势

1. **✅ 自动化**：无需手动输入用户名
2. **✅ 准确性**：直接使用淘宝返回的用户名，避免输入错误
3. **✅ 用户体验**：一键登录，流程更顺畅
4. **✅ 容错性**：多字段优先级尝试，提高成功率
5. **✅ 兼容性**：如果无法提取，可回退到手动输入

---

## 🚀 扩展功能（未来）

**可能的改进方向**：

1. **提取更多用户信息**
   - 用户 ID（`unb` 字段）
   - 用户等级
   - 会员类型

2. **用户名去重检测**
   - 如果已存在同名账号，自动添加后缀（如"张三_2"）

3. **用户名编辑**
   - 允许用户在保存前修改自动提取的用户名

4. **用户名验证**
   - 检查用户名是否合法（长度、字符等）

---

**功能已完成！扫码登录现在会自动提取并填充淘宝用户名！** ✅
