# 🔄 多账号管理指南

## 📱 风控参数绑定机制

### **核心结论** ⭐

**风控参数绑定的是设备，不是账号！**

| 参数 | 绑定对象 | 是否可跨账号 | 说明 |
|------|----------|------------|------|
| **umidToken** | 🔵 设备 | ✅ **可以** | 设备唯一标识，只要是同一设备就可以 |
| **ua** | 🔵 设备 | ✅ **可以** | 设备指纹，不绑定账号 |
| **asac** | 🔵 固定值 | ✅ **可以** | 所有账号通用 |
| **cookies** | 🟠 账号 | ❌ **不可以** | 每个账号独立的身份凭证 |

---

## ✅ **多账号使用方案**

### **方案：一套参数 + 多个 Cookie**

```
同一设备提取一次风控参数
        ↓
账号 A 扫码 → Cookie A
账号 B 扫码 → Cookie B  
账号 C 扫码 → Cookie C
        ↓
都使用同一套 umidToken + ua + asac
```

**优势：**
- ✅ 只需提取一次风控参数
- ✅ 多个账号可以共享
- ✅ 切换账号只需换 Cookie
- ✅ 大幅简化配置流程

---

## 🔧 实现方案

### **文件结构**

```
data/
├── risk_params.json          # 共享的风控参数（一次配置）
└── accounts/                 # 账号管理目录（新建）
    ├── account_a.json        # 账号 A 的 Cookie
    ├── account_b.json        # 账号 B 的 Cookie
    └── account_c.json        # 账号 C 的 Cookie
```

---

### **配置格式**

#### **1. 风控参数（共享）**
**文件：** `data/risk_params.json`

```json
{
  "ua": "140#nmuoUceczzPKwQo2+bsbK3N...",
  "umidToken": "T2gArl5MCqpJaBLQXh3b0Xps...",
  "asac": "2A21B24LA1SI0HB0EEVN03",
  "last_update": "2025-11-10 15:56:17",
  "device_info": "iPhone 15 Pro",
  "notes": "此参数所有账号共享，绑定设备不绑定账号"
}
```

**说明：** 这个文件**所有账号共享**，只需配置一次

---

#### **2. 账号 Cookie（独立）**
**文件：** `data/accounts/account_a.json`

```json
{
  "account_name": "账号A",
  "account_id": "account_a",
  "cookies": "your_cookies_here...",
  "login_time": "2025-11-10 16:00:00",
  "last_used": "2025-11-10 16:30:00",
  "status": "active",
  "notes": "主账号"
}
```

**说明：** 每个账号一个文件，独立管理

---

## 🚀 使用流程

### **第 1 步：提取风控参数（只需一次）**

```bash
# 使用任意一个账号提取
python tools/umid_token_extractor.py

# 参数会保存到 data/risk_params.json
# 这个参数所有账号都可以使用
```

**✅ 完成后就不需要再提取了！**

---

### **第 2 步：添加账号 Cookie**

#### **方法 1：Web 界面添加（推荐）**

```
1. 打开系统：http://localhost:5173
2. 进入"账号管理"页面（新增）
3. 点击"添加账号"
4. 扫码登录
5. 系统自动保存 Cookie
```

#### **方法 2：手动配置**

```bash
# 创建账号目录
mkdir -p data/accounts

# 账号 A 扫码登录后，Cookie 保存为
data/accounts/account_a.json

# 账号 B 扫码登录后，Cookie 保存为
data/accounts/account_b.json
```

---

### **第 3 步：切换账号抢购**

```
1. 在"账号管理"页面选择账号
2. 点击"切换到此账号"
3. 返回"抢购中心"
4. 点击"一键抢购"
5. 完成！
```

---

## 📁 多账号配置示例

### **场景：3个账号同时管理**

#### **风控参数（共享）**
```
data/risk_params.json
- umidToken: T2gArl5MCqpJaBLQXh3b0Xps...
- ua: 140#nmuoUceczzPKwQo2+bsbK3N...
- asac: 2A21B24LA1SI0HB0EEVN03
```

#### **账号配置（独立）**
```
data/accounts/
├── main_account.json        # 主账号
│   └── cookies: "cookie_main..."
├── sub_account_1.json       # 小号1
│   └── cookies: "cookie_sub1..."
└── sub_account_2.json       # 小号2
    └── cookies: "cookie_sub2..."
```

#### **使用时**
```
选择账号 → 系统自动加载该账号的 Cookie
         → 使用共享的风控参数
         → 开始抢购
```

---

## 🎯 完整工作流程

### **初始配置（只需一次）**

```
Step 1: 提取风控参数
  python tools/umid_token_extractor.py
  ↓
  保存到 data/risk_params.json
  ✅ 所有账号共享

Step 2: 添加账号
  账号A 扫码 → data/accounts/account_a.json
  账号B 扫码 → data/accounts/account_b.json
  账号C 扫码 → data/accounts/account_c.json
  ✅ 每个账号独立 Cookie
```

---

### **日常使用**

```
打开系统
  ↓
选择要使用的账号
  ↓
系统自动：
  - 加载该账号的 Cookie
  - 使用共享的风控参数
  ↓
点击"一键抢购"
  ↓
完成！
```

---

## ⚠️ 重要注意事项

### **1. 设备一致性**

**规则：** 所有账号必须使用**同一设备**扫码

```
❌ 错误做法：
  - 账号A用手机A扫码
  - 账号B用手机B扫码
  → 风控参数不匹配，会失败

✅ 正确做法：
  - 账号A用手机A扫码
  - 账号B也用手机A扫码
  - 账号C也用手机A扫码
  → 风控参数完全匹配，成功率高
```

---

### **2. Cookie 有效期**

**说明：**
- Cookie 通常 1-7 天有效
- 过期后需要重新扫码
- 风控参数不需要重新提取

**更新流程：**
```
Cookie 过期
  ↓
用该账号重新扫码
  ↓
更新 Cookie
  ↓
风控参数不变（继续使用）
```

---

### **3. 风控参数更新**

**更新周期：**
- umidToken：7-30 天
- ua：很少需要更新
- asac：固定值，无需更新

**更新时：**
```
风控参数过期
  ↓
重新运行：python tools/umid_token_extractor.py
  ↓
更新 data/risk_params.json
  ↓
所有账号自动使用新参数
```

---

## 🧪 测试验证

### **验证流程**

#### **Step 1: 提取风控参数**
```bash
python tools/umid_token_extractor.py
```

#### **Step 2: 账号A测试**
```
1. 账号A扫码登录
2. 保存 Cookie 到 account_a.json
3. 测试抢购
4. 记录结果
```

#### **Step 3: 账号B测试**
```
1. 账号B扫码登录（同一设备）
2. 保存 Cookie 到 account_b.json
3. 使用相同的风控参数
4. 测试抢购
5. 记录结果
```

#### **Step 4: 对比验证**
```
如果账号A和账号B都能成功：
✅ 证明风控参数可以跨账号使用
✅ 可以正式使用多账号管理

如果账号B失败：
❌ 可能需要每个账号独立配置
❌ 参考后面的"独立配置方案"
```

---

## 📊 预期效果

### **场景1：正常情况（推荐）**

```
配置：
- 1套风控参数（共享）
- 3个账号 Cookie（独立）

结果：
✅ 3个账号都能成功抢购
✅ 切换账号只需切换 Cookie
✅ 管理简单，效率高
```

---

### **场景2：特殊情况**

```
如果发现某个账号抢购失败：

可能原因：
1. Cookie 过期 → 重新扫码
2. 风控参数过期 → 重新提取
3. 账号被限制 → 换账号
4. 网络问题 → 检查网络

解决方案：
- 先更新 Cookie
- 如果还是失败，更新风控参数
- 如果还是失败，可能需要独立配置
```

---

## 🔄 账号切换方案

### **方案1：手动切换**

```bash
# 切换到账号A
cp data/accounts/account_a.json data/current_account.json

# 切换到账号B
cp data/accounts/account_b.json data/current_account.json

# 重启后端
python -m backend.main
```

---

### **方案2：Web界面切换（推荐）**

```
界面布局：
┌──────────────────────────────────┐
│ 账号管理                          │
├──────────────────────────────────┤
│ 当前账号：账号A    [切换账号▼]   │
├──────────────────────────────────┤
│ 账号列表：                        │
│  ○ 账号A (当前)                  │
│  ○ 账号B                         │
│  ○ 账号C                         │
│  [+ 添加新账号]                  │
└──────────────────────────────────┘
```

---

### **方案3：API切换**

```javascript
// 切换到账号B
await fetch('http://localhost:5000/api/auth/switch-account', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ accountId: 'account_b' })
});
```

---

## 🎯 最佳实践

### **1. 账号命名规范**

```
推荐格式：
- main_account     （主账号）
- sub_account_1    （小号1）
- sub_account_2    （小号2）
- test_account     （测试账号）

避免使用：
- 123456           （不直观）
- temp             （容易混淆）
- account          （太通用）
```

---

### **2. 定期维护**

```
每周检查清单：
□ 验证所有账号 Cookie 是否有效
□ 检查风控参数是否需要更新
□ 清理过期的账号配置
□ 备份重要配置文件
```

---

### **3. 安全建议**

```
安全措施：
✅ 不要在公共场所扫码
✅ 定期更换 Cookie
✅ 不要分享配置文件
✅ 备份重要数据
✅ 使用强密码保护账号
```

---

## 📈 性能优化

### **多账号并发抢购**

```javascript
// 同时用多个账号抢购
const accounts = ['account_a', 'account_b', 'account_c'];

const results = await Promise.all(
  accounts.map(async (accountId) => {
    // 切换账号
    await switchAccount(accountId);
    
    // 抢购
    return await grabAllRedPackets();
  })
);

console.log('抢购结果:', results);
```

**优势：**
- 提高成功率
- 覆盖更多红包
- 效率最大化

---

## 🛠️ 故障排查

### **问题1：账号B无法抢购**

**检查项：**
1. Cookie 是否有效
2. 是否使用同一设备扫码
3. 风控参数是否正确
4. 网络是否正常

**解决：**
```bash
# 1. 验证参数
python tools/validate_params.py

# 2. 重新扫码（账号B）
# 使用同一设备扫码

# 3. 测试抢购
# 尝试抢购一个小额红包
```

---

### **问题2：频繁切换账号失败**

**原因：**
- 切换过快导致缓存问题
- Cookie 未正确加载

**解决：**
```
1. 切换账号后等待2-3秒
2. 刷新页面
3. 重新加载红包列表
4. 再次尝试抢购
```

---

### **问题3：某个账号被限制**

**迹象：**
- 抢购总是失败
- 提示"非法访问"
- 其他账号正常

**解决：**
```
1. 暂停使用该账号
2. 等待24小时后重试
3. 使用其他账号继续抢购
4. 必要时更新风控参数
```

---

## 📚 相关文档

- **[自动红包抢购指南](./AUTO_RED_PACKET_GUIDE.md)** - 基础使用
- **[风控参数完整指南](./RISK_PARAMS_COMPLETE.md)** - 参数详解
- **[快速启动指南](./START_NOW.md)** - 系统启动

---

## 🎉 总结

### **核心优势**

✅ **一次配置**：风控参数只需提取一次  
✅ **多账号支持**：可以管理无限个账号  
✅ **简单切换**：切换账号只需更换 Cookie  
✅ **高效管理**：统一管理，效率最大化

### **关键要点**

🔵 **风控参数**：绑定设备，所有账号共享  
🟠 **Cookie**：绑定账号，每个账号独立  
🔄 **切换账号**：只需更换 Cookie 即可  
📱 **设备一致**：所有账号必须用同一设备扫码

---

**祝你多账号管理成功，收益翻倍！** 💰✨🚀

---

**最后更新：** 2025-11-10  
**版本：** 1.0.0
