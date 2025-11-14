# 🚀 Supabase 无后端迁移方案

**完全移除本地 Python 后端，使用 Supabase + 前端实现所有功能**

---

## 📋 目录

1. [方案概述](#方案概述)
2. [架构设计](#架构设计)
3. [Supabase 配置](#supabase-配置)
4. [前端改造](#前端改造)
5. [迁移步骤](#迁移步骤)
6. [优缺点分析](#优缺点分析)

---

## 方案概述

### 🎯 核心思路

**完全去掉本地 Python 后端，所有逻辑在浏览器中运行**

```
原架构:
前端 (React) ←→ 后端 (FastAPI + Python) ←→ 淘宝 API
                     ↓
                 本地存储

新架构:
前端 (React + TSDK.js) ←→ 淘宝 API
         ↓
    Supabase (云端存储)
```

### ✅ 主要改变

| 功能 | 原方案 | 新方案 |
|------|--------|--------|
| **API调用** | Python TSDK → FastAPI → 前端 | JavaScript TSDK → 直接在前端 |
| **Cookie存储** | 本地文件 + SQLite | Supabase PostgreSQL（加密） |
| **配置管理** | 本地 JSON 文件 | Supabase Storage / Database |
| **定时任务** | Python APScheduler | 浏览器定时器 / Edge Functions |
| **实时通知** | WebSocket | Supabase Realtime |
| **用户认证** | Cookie | Supabase Auth（可选） |

---

## 架构设计

### 🏗️ 新架构图

```
┌─────────────────────────────────────────────────────┐
│                   浏览器 (前端)                      │
│                                                     │
│  ┌──────────────┐  ┌──────────────┐                │
│  │  React UI    │  │  TSDK.js     │                │
│  │  (界面)      │  │  (淘宝API)   │────────┐       │
│  └──────────────┘  └──────────────┘        │       │
│         │                                   │       │
│         │                                   │       │
│  ┌──────▼──────────────────────────────────▼────┐  │
│  │        Supabase Client SDK                  │  │
│  └──────┬──────────────────────────────────────┘  │
└─────────┼───────────────────────────────────────────┘
          │
          │ HTTPS
          │
┌─────────▼───────────────────────────────────────────┐
│                  Supabase 云端                       │
│                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────┐  │
│  │ PostgreSQL   │  │   Storage    │  │ Realtime│  │
│  │ (Cookie/配置) │  │   (文件)     │  │ (推送)  │  │
│  └──────────────┘  └──────────────┘  └─────────┘  │
└─────────────────────────────────────────────────────┘
          │
          │ HTTPS
          │
┌─────────▼───────────────────────────────────────────┐
│                  淘宝 API                            │
│         (mtop.fisson.gift.share...)                 │
└─────────────────────────────────────────────────────┘
```

### 🔑 关键组件

#### 1. 前端 (React + TypeScript)

**职责**：
- ✅ 用户界面
- ✅ 调用淘宝 API（使用 TSDK.js）
- ✅ Cookie 管理（加密后存储到 Supabase）
- ✅ 定时任务管理
- ✅ 实时通知

**新增依赖**：
```json
{
  "@supabase/supabase-js": "^2.39.0",
  "crypto-js": "^4.2.0"  // Cookie 加密
}
```

#### 2. Supabase

**使用的服务**：

| 服务 | 用途 |
|------|------|
| **Database** | 存储 Cookie、配置、抢购记录 |
| **Storage** | 存储风控参数文件 |
| **Realtime** | 多设备同步、实时通知 |
| **Auth** | 用户认证（可选） |

#### 3. TSDK.js (JavaScript 版本)

**需要创建**：将 Python TSDK 转为 JavaScript

---

## Supabase 配置

### 📊 数据库表结构

#### 表1: accounts (账号管理)

```sql
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),  -- 可选：如果使用 Supabase Auth
  name VARCHAR(100) NOT NULL,
  cookie TEXT NOT NULL,  -- 加密的 Cookie
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_accounts_active ON accounts(is_active);
```

#### 表2: risk_params (风控参数)

```sql
CREATE TABLE risk_params (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  ua TEXT NOT NULL,
  umid_token TEXT NOT NULL,
  asac VARCHAR(50) DEFAULT '2A21B24LA1SI0HB0EEVN03',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 每个用户只有一条记录
CREATE UNIQUE INDEX idx_risk_params_user ON risk_params(user_id);
```

#### 表3: purchase_tasks (抢购任务)

```sql
CREATE TABLE purchase_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  account_id UUID REFERENCES accounts(id),
  benefit_code VARCHAR(100) NOT NULL,
  amount INTEGER NOT NULL,
  scheduled_time TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'pending',  -- pending, running, success, failed
  result JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_tasks_user ON purchase_tasks(user_id);
CREATE INDEX idx_tasks_status ON purchase_tasks(status);
CREATE INDEX idx_tasks_scheduled ON purchase_tasks(scheduled_time);
```

#### 表4: purchase_logs (抢购日志)

```sql
CREATE TABLE purchase_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  task_id UUID REFERENCES purchase_tasks(id),
  account_id UUID REFERENCES accounts(id),
  level VARCHAR(10),  -- info, success, error
  message TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_logs_user ON purchase_logs(user_id);
CREATE INDEX idx_logs_task ON purchase_logs(task_id);
CREATE INDEX idx_logs_created ON purchase_logs(created_at DESC);
```

### 🔒 行级安全策略 (RLS)

```sql
-- 启用 RLS
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_params ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_logs ENABLE ROW LEVEL SECURITY;

-- 策略：用户只能访问自己的数据
CREATE POLICY "Users can view own accounts"
  ON accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own accounts"
  ON accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own accounts"
  ON accounts FOR UPDATE
  USING (auth.uid() = user_id);

-- 同样的策略应用到其他表
-- ... (类似的策略为其他表)
```

### 📁 Storage Buckets

```sql
-- 创建存储桶
INSERT INTO storage.buckets (id, name, public)
VALUES ('risk-params', 'risk-params', false);

-- 存储策略
CREATE POLICY "Users can access own files"
  ON storage.objects FOR SELECT
  USING (auth.uid()::text = (storage.foldername(name))[1]);
```

---

## 前端改造

### 🔧 创建 JavaScript 版本的 TSDK

#### 文件: `/lib/tsdk/index.ts`

```typescript
/**
 * TSDK - JavaScript 版本
 * 淘宝 API 客户端
 */

import CryptoJS from 'crypto-js';

export class TaobaoH5Client {
  private baseUrl = 'https://h5api.m.tmall.com/h5';
  private appKey = '12574478';
  private jsv = '2.6.1';
  private timeout = 4096;
  private cookies: Record<string, string> = {};

  constructor(cookies?: Record<string, string>) {
    if (cookies) {
      this.setCookies(cookies);
    }
  }

  /**
   * 设置 Cookie
   */
  setCookies(cookies: Record<string, string>) {
    this.cookies = cookies;
  }

  /**
   * 计算签名
   */
  private sign(token: string, t: string, appKey: string, data: string): string {
    const signStr = `${token}&${t}&${appKey}&${data}`;
    return CryptoJS.MD5(signStr).toString();
  }

  /**
   * 获取当前时间戳
   */
  private getTimestamp(): string {
    return Date.now().toString();
  }

  /**
   * 从 Cookie 中提取 token
   */
  private getToken(): string {
    const m_h5_tk = this.cookies['_m_h5_tk'] || '';
    return m_h5_tk.split('_')[0] || '';
  }

  /**
   * 执行 API 请求
   */
  async request(apiName: string, version: string, data: any = {}, options: any = {}) {
    const t = this.getTimestamp();
    const token = this.getToken();
    const dataStr = JSON.stringify(data);
    const sign = this.sign(token, t, this.appKey, dataStr);

    // 构建 URL 参数
    const params = new URLSearchParams({
      jsv: this.jsv,
      appKey: this.appKey,
      t,
      sign,
      api: apiName,
      v: version,
      timeout: this.timeout.toString(),
      type: 'jsonp',
      dataType: 'jsonp',
      callback: `mtopjsonp${Math.floor(Math.random() * 100)}`,
      data: dataStr,
      ...options
    });

    const url = `${this.baseUrl}/${apiName}/${version}/?${params.toString()}`;

    // 发送请求
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Referer': 'https://pages.tmall.com/',
        'Cookie': this.formatCookies(),
      }
    });

    const text = await response.text();
    
    // 解析 JSONP 响应
    const jsonMatch = text.match(/mtopjsonp\d+\((.*)\)/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }

    throw new Error('Invalid response format');
  }

  /**
   * 格式化 Cookie
   */
  private formatCookies(): string {
    return Object.entries(this.cookies)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ');
  }
}

/**
 * 天猫礼享金 API
 */
export class TmallGiftAPI extends TaobaoH5Client {
  /**
   * 获取红包列表
   */
  async getRedPackets() {
    const result = await this.request(
      'mtop.fission.gift.share.vcoin.exchange.allpage',
      '1.0',
      {}
    );

    if (result.ret?.[0]?.startsWith('SUCCESS')) {
      const data = result.data;
      const phonePackets = data?.phoneBillModule?.redPackets || [];
      const normalPackets = data?.redPacketModule?.redPackets || [];
      
      return [...phonePackets, ...normalPackets].filter(
        p => p.status === 'AVAILABLE'
      );
    }

    throw new Error(result.ret?.[0] || 'Failed to get red packets');
  }

  /**
   * 兑换红包
   */
  async exchangeRedPacket(
    benefitCode: string,
    riskParams: { ua: string; umidToken: string; asac: string }
  ) {
    const result = await this.request(
      'mtop.fisson.gift.share.vcoin.exchange',  // 注意：fisson 不是 fission
      '1.0',
      {
        asac: riskParams.asac,
        benefitCode,
        type: 'redPacket',
        ua: riskParams.ua,
        umidToken: riskParams.umidToken
      },
      {
        ecode: '1',
        isSec: '1',
        secType: '2',
        needWua: 'true',
        isNeedWua: 'true',
        needRetry: 'true',
        asac: riskParams.asac
      }
    );

    if (result.ret?.[0]?.startsWith('SUCCESS')) {
      return result.data;
    }

    throw new Error(result.ret?.[0] || 'Failed to exchange red packet');
  }

  /**
   * 获取用户余额
   */
  async getUserBalance() {
    const result = await this.request(
      'mtop.fission.gift.share.vcoin.exchange.allpage',
      '1.0',
      {}
    );

    if (result.ret?.[0]?.startsWith('SUCCESS')) {
      const data = result.data;
      return {
        totalAmount: data?.withdrawalModule?.totalAmount || '0',
        availableAmount: data?.withdrawalModule?.availableAmount || '0',
        coinAmount: data?.redPacketModule?.totalCoinAmount || '0'
      };
    }

    return {
      totalAmount: '0',
      availableAmount: '0',
      coinAmount: '0'
    };
  }
}
```

### 🗄️ Supabase 客户端封装

#### 文件: `/lib/supabase/client.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import CryptoJS from 'crypto-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Cookie 加密密钥（应该存储在环境变量中）
 */
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'your-secret-key';

/**
 * 加密 Cookie
 */
export function encryptCookie(cookie: string): string {
  return CryptoJS.AES.encrypt(cookie, ENCRYPTION_KEY).toString();
}

/**
 * 解密 Cookie
 */
export function decryptCookie(encryptedCookie: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedCookie, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

/**
 * Cookie 存储服务
 */
export class CookieStorageService {
  /**
   * 保存账号 Cookie
   */
  async saveAccount(name: string, cookie: string) {
    const encryptedCookie = encryptCookie(cookie);
    
    const { data, error } = await supabase
      .from('accounts')
      .insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        name,
        cookie: encryptedCookie
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * 获取所有账号
   */
  async getAccounts() {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(account => ({
      ...account,
      cookie: decryptCookie(account.cookie)
    }));
  }

  /**
   * 删除账号
   */
  async deleteAccount(id: string) {
    const { error } = await supabase
      .from('accounts')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  }
}

/**
 * 风控参数服务
 */
export class RiskParamsService {
  /**
   * 保存风控参数
   */
  async saveParams(ua: string, umidToken: string, asac?: string) {
    const userId = (await supabase.auth.getUser()).data.user?.id;

    const { data, error } = await supabase
      .from('risk_params')
      .upsert({
        user_id: userId,
        ua,
        umid_token: umidToken,
        asac: asac || '2A21B24LA1SI0HB0EEVN03'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * 获取风控参数
   */
  async getParams() {
    const { data, error } = await supabase
      .from('risk_params')
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }
}

/**
 * 抢购任务服务
 */
export class PurchaseTaskService {
  /**
   * 创建抢购任务
   */
  async createTask(accountId: string, benefitCode: string, amount: number, scheduledTime?: Date) {
    const userId = (await supabase.auth.getUser()).data.user?.id;

    const { data, error } = await supabase
      .from('purchase_tasks')
      .insert({
        user_id: userId,
        account_id: accountId,
        benefit_code: benefitCode,
        amount,
        scheduled_time: scheduledTime?.toISOString(),
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * 更新任务状态
   */
  async updateTaskStatus(taskId: string, status: string, result?: any) {
    const { error } = await supabase
      .from('purchase_tasks')
      .update({
        status,
        result,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId);

    if (error) throw error;
  }

  /**
   * 获取任务列表
   */
  async getTasks() {
    const { data, error } = await supabase
      .from('purchase_tasks')
      .select(`
        *,
        accounts (name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * 记录日志
   */
  async log(taskId: string, accountId: string, level: string, message: string, details?: any) {
    const userId = (await supabase.auth.getUser()).data.user?.id;

    await supabase
      .from('purchase_logs')
      .insert({
        user_id: userId,
        task_id: taskId,
        account_id: accountId,
        level,
        message,
        details
      });
  }
}
```

### 🎯 抢购逻辑实现

#### 文件: `/lib/purchase/manager.ts`

```typescript
import { TmallGiftAPI } from '../tsdk';
import { CookieStorageService, RiskParamsService, PurchaseTaskService } from '../supabase/client';

/**
 * 抢购管理器
 */
export class PurchaseManager {
  private cookieService = new CookieStorageService();
  private riskService = new RiskParamsService();
  private taskService = new PurchaseTaskService();

  /**
   * 执行立即抢购
   */
  async purchaseNow(accountId: string, benefitCode: string, amount: number) {
    // 1. 获取账号信息
    const accounts = await this.cookieService.getAccounts();
    const account = accounts.find(a => a.id === accountId);
    if (!account) throw new Error('Account not found');

    // 2. 获取风控参数
    const riskParams = await this.riskService.getParams();
    if (!riskParams) throw new Error('Risk params not configured');

    // 3. 创建任务
    const task = await this.taskService.createTask(accountId, benefitCode, amount);

    // 4. 初始化 API 客户端
    const cookieObj = this.parseCookie(account.cookie);
    const api = new TmallGiftAPI(cookieObj);

    try {
      // 5. 更新任务状态
      await this.taskService.updateTaskStatus(task.id, 'running');
      await this.taskService.log(task.id, accountId, 'info', '开始抢购');

      // 6. 执行抢购
      const result = await api.exchangeRedPacket(benefitCode, {
        ua: riskParams.ua,
        umidToken: riskParams.umid_token,
        asac: riskParams.asac
      });

      // 7. 记录成功
      await this.taskService.updateTaskStatus(task.id, 'success', result);
      await this.taskService.log(task.id, accountId, 'success', '抢购成功', result);

      return { success: true, result };
    } catch (error: any) {
      // 8. 记录失败
      await this.taskService.updateTaskStatus(task.id, 'failed', { error: error.message });
      await this.taskService.log(task.id, accountId, 'error', '抢购失败', { error: error.message });

      return { success: false, error: error.message };
    }
  }

  /**
   * 定时抢购（使用浏览器定时器）
   */
  async schedulePurchase(accountId: string, benefitCode: string, amount: number, scheduledTime: Date) {
    const now = Date.now();
    const targetTime = scheduledTime.getTime();
    const delay = targetTime - now;

    if (delay <= 0) {
      throw new Error('Scheduled time must be in the future');
    }

    // 创建待执行任务
    const task = await this.taskService.createTask(accountId, benefitCode, amount, scheduledTime);

    // 设置定时器
    setTimeout(() => {
      this.purchaseNow(accountId, benefitCode, amount);
    }, delay);

    return task;
  }

  /**
   * 解析 Cookie 字符串
   */
  private parseCookie(cookieStr: string): Record<string, string> {
    const cookies: Record<string, string> = {};
    cookieStr.split(';').forEach(pair => {
      const [key, value] = pair.trim().split('=');
      if (key && value) {
        cookies[key] = value;
      }
    });
    return cookies;
  }

  /**
   * 获取红包列表
   */
  async getRedPackets(accountId: string) {
    const accounts = await this.cookieService.getAccounts();
    const account = accounts.find(a => a.id === accountId);
    if (!account) throw new Error('Account not found');

    const cookieObj = this.parseCookie(account.cookie);
    const api = new TmallGiftAPI(cookieObj);

    return await api.getRedPackets();
  }
}
```

---

## 迁移步骤

### 📝 完整迁移清单

#### Step 1: 创建 Supabase 项目

1. 访问 https://supabase.com
2. 创建新项目
3. 记录 API URL 和 anon key

#### Step 2: 设置数据库

```sql
-- 在 Supabase SQL Editor 中执行
-- 复制上面的所有表结构和策略 SQL
```

#### Step 3: 配置前端环境变量

```bash
# .env.local
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_ENCRYPTION_KEY=your_encryption_key_32_chars
```

#### Step 4: 安装新依赖

```bash
npm install @supabase/supabase-js crypto-js
```

#### Step 5: 添加 TSDK JavaScript 版本

创建 `/lib/tsdk/index.ts`（使用上面的代码）

#### Step 6: 添加 Supabase 客户端

创建 `/lib/supabase/client.ts`（使用上面的代码）

#### Step 7: 更新前端组件

将所有后端 API 调用替换为直接使用 TSDK 和 Supabase

#### Step 8: 测试功能

- 登录功能
- Cookie 存储
- 参数提取
- 红包列表
- 抢购功能

#### Step 9: 移除后端

```bash
# 删除后端相关文件（可选，保留备份）
# backend/
# TSDK/ (Python 版本)
# start_backend.bat
```

---

## 优缺点分析

### ✅ 优点

| 优点 | 说明 |
|------|------|
| **无需本地部署** | 不需要 Python、FastAPI、Uvicorn |
| **跨设备同步** | 数据存储在云端，任何设备都可访问 |
| **完全免费** | Supabase 免费层足够使用 |
| **更简单** | 只需要浏览器，打开网页即可使用 |
| **实时同步** | Supabase Realtime 支持多设备同步 |
| **更安全** | Cookie 加密存储，RLS 保护数据 |
| **易于分享** | 部署到 Vercel/Netlify，分享链接即可 |

### ⚠️ 缺点

| 缺点 | 说明 | 解决方案 |
|------|------|---------|
| **CORS 限制** | 浏览器跨域问题 | 使用代理或浏览器扩展 |
| **定时任务限制** | 浏览器关闭后无法执行 | 使用 Edge Functions 或保持标签页打开 |
| **Cookie 暴露** | Cookie 在前端可见 | 加密存储 + HTTPS + RLS |
| **性能** | JavaScript 性能略低于 Python | 影响不大，抢购速度足够 |

### 🔄 CORS 问题解决方案

#### 方案 A: 使用浏览器扩展

安装 CORS 扩展（仅用于开发）：
- Chrome: "CORS Unblock"
- Firefox: "CORS Everywhere"

#### 方案 B: 使用代理服务器（推荐）

创建 Supabase Edge Function 作为代理：

```typescript
// supabase/functions/taobao-proxy/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  // 获取目标 URL
  const url = new URL(req.url).searchParams.get('url');
  
  // 转发请求到淘宝 API
  const response = await fetch(url, {
    method: req.method,
    headers: req.headers,
  });

  const data = await response.text();

  // 返回响应（添加 CORS 头）
  return new Response(data, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
});
```

#### 方案 C: 使用 Cloudflare Workers

更稳定的代理方案（如果需要）

---

## 🎯 快速开始

### 完整示例代码

```typescript
// App.tsx
import { useEffect, useState } from 'react';
import { supabase, CookieStorageService, RiskParamsService } from './lib/supabase/client';
import { PurchaseManager } from './lib/purchase/manager';

function App() {
  const [accounts, setAccounts] = useState([]);
  const [redPackets, setRedPackets] = useState([]);
  const manager = new PurchaseManager();

  // 加载账号列表
  useEffect(() => {
    loadAccounts();
  }, []);

  async function loadAccounts() {
    const service = new CookieStorageService();
    const data = await service.getAccounts();
    setAccounts(data);
  }

  // 加载红包列表
  async function loadRedPackets(accountId: string) {
    const packets = await manager.getRedPackets(accountId);
    setRedPackets(packets);
  }

  // 执行抢购
  async function handlePurchase(accountId: string, benefitCode: string, amount: number) {
    const result = await manager.purchaseNow(accountId, benefitCode, amount);
    
    if (result.success) {
      alert('抢购成功！');
    } else {
      alert(`抢购失败: ${result.error}`);
    }
  }

  return (
    <div>
      {/* 你的 UI 组件 */}
    </div>
  );
}
```

---

## 📚 下一步

1. ✅ 按照迁移步骤配置 Supabase
2. ✅ 创建 JavaScript 版本的 TSDK
3. ✅ 更新前端组件
4. ✅ 测试所有功能
5. ✅ 部署到 Vercel/Netlify

---

**问题？** 随时询问，我会提供详细的代码示例和指导！

