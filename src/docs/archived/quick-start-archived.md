# 🚀 开始使用 - Supabase 版本

**快速开始指南 - 无需后端！**

---

## ✅ 你已经选择了 Supabase 方案

恭喜！这是最简单的方案，无需 Python 后端。

---

## 📝 快速检查清单

### 已完成的工作

我已经为你创建了以下文件：

- ✅ `/lib/supabase.ts` - Supabase 客户端和数据服务
- ✅ `/lib/tsdk.ts` - JavaScript 版本的 TSDK
- ✅ `/lib/usePurchase.ts` - 抢购逻辑 Hook
- ✅ `/supabase-setup.sql` - 数据库初始化脚本
- ✅ `/.env.local.example` - 环境变量模板
- ✅ `/package.json` - 已添加 Supabase 依赖

---

## 🎯 现在开始！

### Step 1: 创建 Supabase 项目

**时间：5分钟**

1. 访问 https://supabase.com
2. 注册/登录
3. 创建新项目：
   - Name: `tmall-gift-grabber`
   - Region: `Northeast Asia (Tokyo)`
4. 等待项目创建完成
5. 记录 Project URL 和 anon key

**详细步骤**: 见 [Supabase部署指南.md](./Supabase部署指南.md) 步骤1

---

### Step 2: 创建数据库表

**时间：3分钟**

1. 在 Supabase Dashboard，点击 "SQL Editor"
2. 点击 "New query"
3. 复制 `supabase-setup.sql` 的全部内容
4. 粘贴并点击 "Run"
5. 验证：Table Editor 中看到 4 个表

**详细步骤**: 见 [Supabase部署指南.md](./Supabase部署指南.md) 步骤2

---

### Step 3: 配置环境变量

**时间：2分钟**

```bash
# 复制模板文件
cp .env.local.example .env.local

# 编辑 .env.local
# 填写你的 Supabase URL、anon key 和加密密钥
```

**详细步骤**: 见 [Supabase部署指南.md](./Supabase部署指南.md) 步骤3

---

### Step 4: 安装依赖

**时间：3分钟**

```bash
# 安装 Supabase 和加密库
npm install @supabase/supabase-js crypto-js

# 安装类型定义
npm install --save-dev @types/crypto-js
```

---

### Step 5: 启动应用

**时间：1分钟**

```bash
npm run dev
```

访问 http://localhost:5173

---

### Step 6: 测试功能

**时间：5分钟**

1. **添加账号**
   - 进入账号管理
   - 添加你的淘宝 Cookie
   - 验证保存成功

2. **配置风控参数**
   - 进入参数提取
   - 提取 UA 和 umidToken
   - 保存参数

3. **获取红包列表**
   - 选择账号
   - 刷新红包列表
   - 查看可用红包

4. **测试抢购**
   - 选择一个红包
   - 点击立即抢购
   - 查看结果

---

## 📚 完整文档

### 核心文档

1. **[Supabase部署指南.md](./Supabase部署指南.md)** ⭐ 详细部署步骤
2. **[风控参数提取完整指南.md](./风控参数提取完整指南.md)** - 参数提取教程
3. **[抓包数据分析.md](./抓包数据分析.md)** - 你的 curl 请求分析

### 架构文档

4. **[Supabase无后端方案.md](./Supabase无后端方案.md)** - 完整架构设计
5. **[本地部署vs云端部署对比.md](./本地部署vs云端部署对比.md)** - 方案对比

---

## 🔧 代码说明

### 核心文件

#### `/lib/supabase.ts`

```typescript
// Supabase 客户端
export const supabase = createClient(url, key);

// 数据服务
export const accountService = {
  save(),      // 保存账号
  getAll(),    // 获取所有账号
  delete()     // 删除账号
};

export const riskParamsService = {
  save(),      // 保存风控参数
  get()        // 获取风控参数
};

export const purchaseTaskService = {
  create(),    // 创建任务
  updateStatus(), // 更新状态
  getAll()     // 获取所有任务
};

export const logService = {
  add(),       // 添加日志
  getAll()     // 获取所有日志
};
```

#### `/lib/tsdk.ts`

```typescript
// 淘宝 API 客户端
export class TmallGiftAPI {
  getRedPackets()           // 获取红包列表
  exchangeRedPacket()       // 兑换红包
  getUserBalance()          // 获取余额
}
```

#### `/lib/usePurchase.ts`

```typescript
// React Hook
export function usePurchase() {
  return {
    getRedPackets,      // 获取红包
    purchaseNow,        // 立即抢购
    schedulePurchase,   // 定时抢购
    batchPurchase,      // 批量抢购
    getUserBalance      // 获取余额
  };
}
```

---

## 💡 使用示例

### 在组件中使用

```typescript
import { usePurchase } from './lib/usePurchase';

function MyComponent() {
  const { purchaseNow, loading } = usePurchase();

  const handlePurchase = async () => {
    const result = await purchaseNow(
      'account-id',
      'benefit-code',
      50  // 金额
    );

    if (result.success) {
      alert('抢购成功！');
    } else {
      alert(`失败: ${result.error}`);
    }
  };

  return (
    <button onClick={handlePurchase} disabled={loading}>
      {loading ? '抢购中...' : '立即抢购'}
    </button>
  );
}
```

---

## ⚠️ 重要提示

### 环境变量

- ✅ 确保 `.env.local` 文件存在
- ✅ 变量名必须以 `VITE_` 开头
- ✅ 修改后需要重启开发服务器

### Cookie 安全

- ✅ Cookie 在 Supabase 中加密存储
- ✅ 使用 HTTPS 传输（部署后）
- ✅ 不要分享你的加密密钥

### 风控参数

- ✅ UA 和 umidToken 必须真实提取
- ✅ 不要使用占位符值
- ✅ 建议每周更新一次

---

## 🐛 常见问题

### Q1: 无法连接 Supabase

```bash
# 检查环境变量
cat .env.local  # Mac/Linux
type .env.local  # Windows

# 重启服务器
npm run dev
```

### Q2: Cookie 保存失败

```typescript
// 检查 Cookie 格式
import { validateCookie } from './lib/tsdk';

const { valid, missing } = validateCookie(cookieString);
console.log('有效:', valid);
console.log('缺失:', missing);
```

### Q3: 抢购失败

1. 检查 Cookie 是否过期
2. 验证风控参数是否正确
3. 查看浏览器控制台错误
4. 查看 Supabase 日志表

---

## 🎯 下一步

### 1. 完善前端界面

根据你现有的 UI 组件，集成 Supabase 功能：

- 账号管理页面 → 使用 `accountService`
- 参数提取页面 → 使用 `riskParamsService`
- 抢购页面 → 使用 `usePurchase` hook
- 日志页面 → 使用 `logService`

### 2. 提取风控参数

按照 [风控参数提取完整指南.md](./风控参数提取完整指南.md) 提取真实参数。

### 3. 测试抢购

使用小额红包测试功能是否正常。

### 4. 部署上线（可选）

参考 [Supabase部署指南.md](./Supabase部署指南.md) 部署到 Vercel/Netlify。

---

## 📞 需要帮助？

### 查看文档

- 部署问题 → [Supabase部署指南.md](./Supabase部署指南.md)
- 参数提取 → [风控参数提取完整指南.md](./风控参数提取完整指南.md)
- API 理解 → [抓包数据分析.md](./抓包数据分析.md)

### 检查日志

```typescript
// 浏览器控制台（F12）
// 查看详细的 TSDK 日志

// Supabase Dashboard
// Table Editor → purchase_logs
// 查看所有操作日志
```

---

## ✅ 启动检查清单

开始使用前，确认以下项目：

- [ ] Supabase 项目已创建
- [ ] 数据库表已创建
- [ ] `.env.local` 已配置
- [ ] 依赖已安装 (`npm install`)
- [ ] 开发服务器已启动 (`npm run dev`)
- [ ] 可以访问 http://localhost:5173
- [ ] 浏览器控制台无错误

**全部完成 → 🎉 开始使用！**

---

**祝你抢购成功！** 🚀

有任何问题，随时查看文档或在 Issues 中提问。
