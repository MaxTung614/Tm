# 📋 红包列表接口完整文档

## 📡 接口概述

| 项目 | 内容 |
|------|------|
| **接口名称** | `mtop.fission.gift.share.vcoin.exchange.allpage` |
| **拼写注意** | `fission`（正确拼写，与兑换接口的 `fisson` 不同）|
| **接口版本** | 1.0 |
| **请求方式** | GET (JSONP) |
| **域名** | h5api.m.tmall.com |
| **完整 URL** | https://h5api.m.tmall.com/h5/mtop.fission.gift.share.vcoin.exchange.allpage/1.0/ |
| **用途** | **获取所有可兑换的红包列表** ⭐ |
| **验证状态** | ✅ 已通过真实抓包验证 |

---

## 🔍 与兑换接口的区别

| 项目 | 列表接口（allpage）| 兑换接口（exchange）|
|------|------------------|-------------------|
| **接口名** | mtop.**fission**...allpage | mtop.**fisson**...exchange |
| **拼写** | ✅ fission（正确）| ❌ fisson（拼错）|
| **后缀** | .allpage | 无 |
| **用途** | 获取所有红包列表 | 兑换单个红包 |
| **data** | `{}`（空对象）| `{benefitCode, type, ua, ...}` |
| **返回** | 红包列表数组 | 兑换结果 |

---

## 📥 请求参数

### URL 参数

```
https://h5api.m.tmall.com/h5/mtop.fission.gift.share.vcoin.exchange.allpage/1.0/
?jsv=2.6.1
&appKey=12574478
&t=1763038858461
&sign=ce87ad5c2c25e962276d99bee0c5df6b
&api=mtop.fission.gift.share.vcoin.exchange.allpage
&v=1.0
&timeout=4096
&needRetry=true
&type=jsonp
&dataType=jsonp
&callback=mtopjsonp2
&data={}
```

### data 参数

```json
{}
```

**⭐ 注意：** data 是**空对象**！不需要任何参数！

---

## 📤 响应结构

### 完整响应（JSONP）

```javascript
mtopjsonp2({
    "api": "mtop.fission.gift.share.vcoin.exchange.allpage",
    "data": {
        "accountTips": "提现至支付宝:208****0501",
        "totalAmount": "831.1",
        "redPacketModule": { /* 红包模块 */ },
        "itemModule": { /* 实物商品模块 */ },
        "phoneBillModule": { /* 话费券模块 */ },
        "termDTOList": [ /* 提现规则 */ ],
        // ...
    },
    "ret": ["SUCCESS::调用成功"],
    "traceId": "...",
    "v": "1.0"
})
```

---

## 🎁 红包模块（核心）

### redPacketModule 结构

```json
{
  "redAsacCode": "2A21B24LA1SI0HB0EEVN03",
  "redPackets": [
    {
      "amount": "500",
      "benefitCode": "2713305bd3794de5aede654a29a095c5",
      "btnText": "500礼享金兑换",
      "buttonTips": "立即兑换",
      "cent": 50000,
      "coinAmount": "500",
      "desc": "实物通用",
      "status": "AVAILABLE",
      "subDesc": "满1000可用",
      "title": "500元红包"
    },
    // ... 更多红包
  ]
}
```

---

## 📊 红包对象字段说明

| 字段 | 类型 | 示例 | 说明 |
|------|------|------|------|
| `amount` | string | "500" | 红包金额（元） |
| `benefitCode` | string | "2713305bd3794de5aede654a29a095c5" | **红包唯一标识** ⭐ |
| `btnText` | string | "500礼享金兑换" | 按钮显示文本 |
| `buttonTips` | string | "立即兑换" | 按钮提示文本 ⭐ |
| `cent` | number | 50000 | 金额（分） |
| `coinAmount` | string | "500" | 所需礼享金数量 |
| `desc` | string | "实物通用" | 红包描述 |
| **`status`** | **string** | **"AVAILABLE"** | **红包状态** ⭐⭐⭐ |
| `subDesc` | string | "满1000可用" | 使用条件 |
| `title` | string | "500元红包" | 红包标题 |

---

## 🚦 红包状态枚举（⭐⭐⭐ 最重要！）

| status | buttonTips | 含义 | 是否可兑换 | 说明 |
|--------|-----------|------|-----------|------|
| `AVAILABLE` | 立即兑换 | 可兑换 | ✅ YES | 立即尝试兑换！|
| `SOLD_OUT` | 已被抢光 | 已抢光 | ❌ NO | 跳过 |
| `EXCHANGED` | 今日已兑换 | 已兑换 | ❌ NO | 今天已经兑换过了 |

**筛选逻辑：**
```typescript
const available = redPackets.filter(item => item.status === 'AVAILABLE');
```

---

## 📋 真实红包列表示例

基于 2025-11-13 的真实抓包：

### 所有红包（12个）

| 序号 | 金额 | benefitCode | status | buttonTips | 可兑换 |
|------|------|-------------|--------|-----------|--------|
| 1 | 800元 | 4a7c9e8c194046de951c87ac3187e325 | SOLD_OUT | 已被抢光 | ❌ |
| 2 | **500元** | **2713305bd3794de5aede654a29a095c5** | **AVAILABLE** | **立即兑换** | ✅ |
| 3 | 400元 | a81f95d722754c2dab43c4b2ed6af2f8 | SOLD_OUT | 已被抢光 | ❌ |
| 4 | 200元 | 6481479dd84f44d79d6673e1549bb77a | SOLD_OUT | 已被抢光 | ❌ |
| 5 | 100元 | 87914c3e0aa2413dab93b4f1f28c67e6 | SOLD_OUT | 已被抢光 | ❌ |
| 6 | 50元 | 9e71ee40134942d29429dbe18d8c9039 | SOLD_OUT | 已被抢光 | ❌ |
| 7 | 30元 | 49a62b1b07184907a569d7c1c602b55c | SOLD_OUT | 已被抢光 | ❌ |
| 8 | 10元 | 450dd5075ffb43bbb1e5321249a98baa | SOLD_OUT | 已被抢光 | ❌ |
| 9 | 10元 | df0c915232844692913064bcec3d6978 | EXCHANGED | 今日已兑换 | ❌ |
| 10 | 5元 | 1087d87c19414db8aad18b643e096ce5 | EXCHANGED | 今日已兑换 | ❌ |
| 11 | 5元 | a31505ebbd26470e813ff145672e24e7 | SOLD_OUT | 已被抢光 | ❌ |
| 12 | 2元 | 66e434e7bf3e49509a2f54c979bda34a | SOLD_OUT | 已被抢光 | ❌ |

**当前可兑换：** 只有 1 个（500元）！

---

## 🎯 自动化抢购逻辑

### 完整流程

```typescript
// 1. 获取红包列表
const response = await getAllRedPackets();
const redPackets = response.data.redPacketModule.redPackets;

// 2. 筛选可兑换的红包
const available = redPackets.filter(
  item => item.status === 'AVAILABLE'
);

// 3. 按金额排序（从高到低）
available.sort((a, b) => b.cent - a.cent);

// 4. 依次尝试兑换
for (const redPacket of available) {
  try {
    console.log(`尝试兑换 ${redPacket.amount}元 红包...`);
    const result = await exchangeRedPacket(redPacket.benefitCode);
    
    if (result.success) {
      console.log('✅ 兑换成功！');
      break; // 成功后停止
    }
  } catch (error) {
    console.log(`❌ 兑换失败: ${error.message}`);
    continue; // 失败继续下一个
  }
}
```

---

## 📦 其他模块

### 1. **实物商品模块**（itemModule）

```json
{
  "items": [
    {
      "btnText": "0.5礼享金兑换",
      "buttonTips": "立即兑换",
      "gitCoinAmount": "0.5",
      "goodsPrice": "3.8",
      "itemId": 777155634115,
      "itemTitle": "typec数据线",
      "status": "AVAILABLE"
    }
  ]
}
```

**说明：** 实物商品，非现金红包

---

### 2. **话费券模块**（phoneBillModule）

```json
{
  "redAsacCode": "2A21B24LA1SI0HB0EEVN03",
  "redPackets": [
    {
      "amount": "3",
      "benefitCode": "f3013829d7dc4d59b460d5d1b85ac3d1",
      "btnText": "3礼享金兑换",
      "buttonTips": "立即兑换",
      "status": "AVAILABLE",
      "title": "3元话费券"
    }
  ]
}
```

**说明：** 话费券，也可以兑换

---

### 3. **提现规则**（termDTOList）

```json
[
  {
    "buttonTips": "立即兑换",
    "cashOutTips": "1礼享金可提",
    "cashOutValue": "1",
    "id": "34884001",
    "limitTips": "连续分享6天可提"
  }
]
```

**说明：** 礼享金提现到支付宝的规则

---

## 🔐 风控参数

### redAsacCode

在响应中出现了**3个地方**：

1. **根级别**：`data.redAsacCode`
2. **红包模块**：`data.redPacketModule.redAsacCode`
3. **话费券模块**：`data.phoneBillModule.redAsacCode`

**值：** `"2A21B24LA1SI0HB0EEVN03"`

**用途：** 后续兑换请求中需要使用这个 asac 值

---

### drawAsacCode

```json
{
  "drawAsacCode": "2A21C15ZV3XMFHZOSTQMZS"
}
```

**说明：** 提现专用的 asac 值（与兑换不同）

---

## 💰 用户信息

| 字段 | 值 | 说明 |
|------|-----|------|
| `accountTips` | "提现至支付宝:208****0501" | 提现账户 |
| `totalAmount` | "831.1" | 当前总礼享金 |

---

## 🎯 使用场景

### 场景1：定时轮询

```typescript
// 每10秒检查一次
setInterval(async () => {
  const list = await getAllRedPackets();
  const available = list.data.redPacketModule.redPackets.filter(
    item => item.status === 'AVAILABLE'
  );
  
  if (available.length > 0) {
    console.log(`发现 ${available.length} 个可兑换红包！`);
    // 触发抢购
    await startPurchase();
  }
}, 10000);
```

---

### 场景2：按优先级抢购

```typescript
// 优先级：金额越高越优先
const priorityList = [800, 500, 400, 200, 100, 50, 30, 10, 5, 2];

for (const amount of priorityList) {
  const redPacket = available.find(
    item => parseInt(item.amount) === amount
  );
  
  if (redPacket) {
    try {
      await exchange(redPacket.benefitCode);
      break; // 成功后停止
    } catch (error) {
      continue; // 失败继续下一个
    }
  }
}
```

---

### 场景3：批量尝试

```typescript
// 尝试兑换所有可用红包（直到成功为止）
const results = [];

for (const redPacket of available) {
  try {
    const result = await exchange(redPacket.benefitCode);
    results.push({
      amount: redPacket.amount,
      success: true,
      result
    });
    break; // 成功后停止
  } catch (error) {
    results.push({
      amount: redPacket.amount,
      success: false,
      error: error.message
    });
  }
}

// 生成报告
console.table(results);
```

---

## 🔗 相关接口

| 接口 | 用途 | 关系 |
|------|------|------|
| **allpage** | 获取红包列表 | 第一步 |
| **exchange** | 兑换红包 | 第二步 |

**完整流程：**
```
1. allpage → 获取列表
2. 筛选 status=AVAILABLE
3. 排序（按金额）
4. exchange → 兑换红包
```

---

## ✅ 实现检查清单

### TypeScript 接口定义

```typescript
interface RedPacket {
  amount: string;
  benefitCode: string;
  btnText: string;
  buttonTips: string;
  cent: number;
  coinAmount: string;
  desc: string;
  status: 'AVAILABLE' | 'SOLD_OUT' | 'EXCHANGED';
  subDesc: string;
  title: string;
}

interface RedPacketModule {
  redAsacCode: string;
  redPackets: RedPacket[];
}

interface RedPacketListResponse {
  api: string;
  data: {
    accountTips: string;
    totalAmount: string;
    redPacketModule: RedPacketModule;
    // ... 其他字段
  };
  ret: string[];
  traceId: string;
  v: string;
}
```

---

### TSDK 方法

```typescript
class TSDK {
  /**
   * 获取所有红包列表
   */
  async getAllRedPackets(): Promise<RedPacketListResponse> {
    return this.request(
      'mtop.fission.gift.share.vcoin.exchange.allpage',
      '1.0',
      {},
      {
        needLogin: false,
        timeout: 4096
      }
    );
  }

  /**
   * 获取可兑换的红包列表
   */
  async getAvailableRedPackets(): Promise<RedPacket[]> {
    const response = await this.getAllRedPackets();
    return response.data.redPacketModule.redPackets.filter(
      item => item.status === 'AVAILABLE'
    );
  }

  /**
   * 按金额排序
   */
  sortByAmount(redPackets: RedPacket[]): RedPacket[] {
    return [...redPackets].sort((a, b) => b.cent - a.cent);
  }
}
```

---

## 🎊 总结

### ✅ 接口特点

1. **简单易用**：data 为空对象，无需复杂参数
2. **信息丰富**：包含红包、商品、话费券等多种内容
3. **状态明确**：3种状态（可兑换、已抢光、已兑换）
4. **实时准确**：反映当前最新的红包状态

### ✅ 自动化价值

- 🔍 **自动发现**：无需手动配置 benefitCode
- 📊 **智能筛选**：只抢可兑换的红包
- 🎯 **优先级排序**：优先抢高价值红包
- 🚀 **提高成功率**：动态适应红包状态

### ✅ 配合使用

```
allpage（列表）+ exchange（兑换）= 完整的自动化抢购系统
```

---

**最后更新：** 2025-11-13  
**基于真实抓包：** ✅ (完整请求+响应)  
**验证状态：** ✅ 响应结构 100% 正确
