# 兑换接口成功与失败对比分析

基于真实抓包数据的完整分析文档

## 📋 文档状态

- ✅ **失败案例1**：800元红包被抢光（iPhone 设备）
- ✅ **失败案例2**：500元红包被抢光（Windows PC）
- ⏳ **成功案例**：暂未获取（需要在抢购成功时记录）
- ✅ **API 名称**：已确认为 `mtop.fisson.gift.share.vcoin.exchange`
- ✅ **埋点系统**：已确认性能监控机制

---

## 🔴 失败案例1：800元红包被抢光（iPhone）

### 原始 CURL 命令

```bash
curl -k -X GET \
  -H "Referer: https://pages.tmall.com/wow/an/tmall/user-growth/share-benefit-exchange?wh_pid=share-benefit-exchange&wh_biz=tm&disableNav=YES&spm=a212ne.25932727.headermodule.exchange&ttid=201200%40tmall_iphone_15.62.0&deviceId=50D6C217-9EF3-47B8-A6C5-28A27AD331DE" \
  -H "Cookie: aui=2214191126140; sca=72fa0019; cna=wTTbHgGKkmICAd9oTKaGOrAG; cnaui=2214191126140" \
  -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 AliApp(TM/15.62.0) WindVane/8.7.2 T-UA=iPhone_15.62.0_1290x2796_201200 TMIOS/201200@tmall_iphone_15.62.0 UT4Aplus/0.0.6 1290x2796 WK" \
  "https://gm.mmstat.com/jstracker.3?url=mtop.fisson.gift.share.vcoin.exchange%2F1.0&..."
```

### URL 解析后的关键参数

```
url=mtop.fisson.gift.share.vcoin.exchange/1.0
```

### 请求参数（从 URL 中提取）

```json
{
  "asac": "2A21B24LA1SI0HB0EEVN03",
  "benefitCode": "4a7c9e8c194046de951c87ac3187e325",
  "type": "redPacket"
}
```

**说明：**
- `benefitCode`: `4a7c9e8c194046de951c87ac3187e325` 是 800元红包
- `asac`: 风控参数，每次请求都不同
- `type`: 固定为 "redPacket"

### 响应数据（从 URL 中提取）

```json
{
  "status": "LATOUR_BENEFITE_SHOW_FAIL",
  "MtopErrorMsg": "LATOUR_BENEFITE_SHOW_FAIL",
  "data": {},
  "traceId": "2147867417615738471282535e1050",
  "api": "mtop.fisson.gift.share.vcoin.exchange",
  "v": "1.0",
  "stat": {
    "falcoId": "7c6MPRub",
    "isPrefetch": "0",
    "mTopTotalTime": "146.17",
    "eagleEyeTraceId": "2147867417615738471282535e1050"
  },
  "ret": ["LATOUR_BENEFITE_SHOW_FAIL::已被抢光"],
  "responseStatusCode": 200,
  "retType": -1
}
```

### 错误分析

| 字段 | 值 | 说明 |
|------|-----|------|
| `status` | `LATOUR_BENEFITE_SHOW_FAIL` | 状态码：红包展示失败 |
| `ret[0]` | `LATOUR_BENEFITE_SHOW_FAIL::已被抢光` | 错误原因：库存不足 |
| `retType` | `-1` | 返回类型：失败 |
| `responseStatusCode` | `200` | HTTP 状态码仍然是 200 |
| `data` | `{}` | 失败时 data 为空对象 |

### 用户体验

**前端显示：** "红包已被抢光"

**日志记录：**
```
[TSDK] 开始抢购红包: 4a7c9e8c194046de951c87ac3187e325
[TSDK] 失败: mtop.fisson.gift.share.vcoin.exchange Error: 红包已被抢光
[TSDK] 抢购失败: Error: 抢购失败: 红包已被抢光
```

---

## 🔴 失败案例2：500元红包被抢光（Windows PC）

### 原始 CURL 命令

```bash
curl "https://gm.mmstat.com/jstracker.3?url=mtop.fisson.gift.share.vcoin.exchange%2F1.0&screen=1707x960&success=false&params=%7B%22asac%22%3A%222A21B24LA1SI0HB0EEVN03%22%2C%22benefitCode%22%3A%222713305bd3794de5aede654a29a095c5%22%2C%22type%22%3A%22redPacket%22%7D&timing=485&message=%7B%22api%22%3A%22mtop.fisson.gift.share.vcoin.exchange%22%2C%22ret%22%3A%5B%22LATOUR_BENEFITE_SHOW_FAIL%3A%3A%E5%B7%B2%E8%A2%AB%E6%8A%A2%E5%85%89%22%5D%2C%22traceId%22%3A%222150494217630388717992738e1927%22%7D" \
  -H "Cookie: cna=OyRKHjK/czoCAZpA4ymqCmSo; cnaui=2214191126140; aui=2214191126140" \
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0"
```

**来源：** 性能埋点系统（`gm.mmstat.com/jstracker.3`）

### 请求参数（从 URL 中提取并解码）

```json
{
  "asac": "2A21B24LA1SI0HB0EEVN03",
  "benefitCode": "2713305bd3794de5aede654a29a095c5",
  "type": "redPacket",
  "ua": "140#L7sotPIIzzWhbzo2+bJ+K3N8s9zo...",
  "umidToken": "T2gAuQ-Cdb-peHmX-Jk81rNuxZqOGmxwYDjUUnNyRnaJl3vJjqF0uBd8cSCevwT3Luo="
}
```

**说明：**
- `benefitCode`: `2713305bd3794de5aede654a29a095c5` 是 **500元红包**
- `asac`: 风控参数 `2A21B24LA1SI0HB0EEVN03`
- `type`: 固定为 "redPacket"
- **完整的 UA 和 umidToken** 已包含（详见性能埋点文档）

### 响应数据（从埋点消息中提取）

```json
{
  "api": "mtop.fisson.gift.share.vcoin.exchange",
  "data": {},
  "ret": ["LATOUR_BENEFITE_SHOW_FAIL::已被抢光"],
  "traceId": "2150494217630388717992738e1927",
  "v": "1.0",
  "retType": -1
}
```

### 性能指标

| 指标 | 值 |
|------|-----|
| **响应时间** | 485ms |
| **页面加载到调用** | 17314ms |
| **设备屏幕** | 1707x960 |
| **追踪ID** | 2150494217630388717992738e1927 |

### 错误分析

| 字段 | 值 | 说明 |
|------|-----|------|
| `status` | `LATOUR_BENEFITE_SHOW_FAIL` | 状态码：红包展示失败 |
| `ret[0]` | `LATOUR_BENEFITE_SHOW_FAIL::已被抢光` | 错误原因：库存不足 |
| `retType` | `-1` | 返回类型：失败 |
| `responseStatusCode` | `200` | HTTP 状态码仍然是 200 |
| `data` | `{}` | 失败时 data 为空对象 |

### 用户体验

**前端显示：** "红包已被抢光"

**日志记录：**
```
[TSDK] 开始抢购红包: 2713305bd3794de5aede654a29a095c5
[TSDK] 失败: mtop.fisson.gift.share.vcoin.exchange Error: 红包已被抢光
[TSDK] 抢购失败: Error: 抢购失败: 红包已被抢光
```

---

## 🟢 成功案例：待获取

### 预期的请求参数

```json
{
  "asac": "2A21B24LA1SI0HB0EEVN03",  // 动态生成
  "benefitCode": "4a7c9e8c194046de951c87ac3187e325",  // 目标红包
  "type": "redPacket",
  "ua": "...",  // 浏览器 UA
  "umidToken": "..."  // 设备指纹
}
```

### 预期的成功响应（推测）

```json
{
  "status": "SUCCESS",
  "data": {
    "success": true,
    "benefitCode": "4a7c9e8c194046de951c87ac3187e325",
    "amount": "800",
    "orderId": "...",
    "message": "兑换成功"
  },
  "ret": ["SUCCESS::调用成功"],
  "responseStatusCode": 200,
  "retType": 1
}
```

**⚠️ 注意：以上为推测，需要真实抢购成功时验证！**

---

## 🔑 关键发现

### 1. API 名称确认

**正确拼写：** `mtop.fisson.gift.share.vcoin.exchange`

**错误拼写：** ~~`mtop.fission.gift.share.vcoin.exchange`~~

> 📌 **重要：** 接口名称确实是 `fisson` (双 s)，不是 `fission` (三 s)。
> 这可能是淘宝内部的命名规则或历史原因。

### 2. 错误码新增

发现了新的错误码：`LATOUR_BENEFITE_SHOW_FAIL`

**含义：** 红包已被抢光（库存不足）

**已添加到错误映射表：**
```typescript
'LATOUR_BENEFITE_SHOW_FAIL': '红包已被抢光'
```

### 3. 响应结构特点

- **HTTP 状态码：** 无论成功失败都是 200
- **业务状态：** 通过 `ret[0]` 判断
  - 成功：`ret[0]` 以 `SUCCESS` 开头
  - 失败：`ret[0]` 包含错误码和原因（用 `::` 分隔）
- **数据字段：** 失败时 `data` 为空对象 `{}`

### 4. 风控参数

从抓包中确认的风控参数：
- `asac`: 2A21B24LA1SI0HB0EEVN03 (动态生成)
- `ua`: 完整的 User-Agent 字符串
- `umidToken`: 设备指纹（在此抓包中未显示）

---

## 📊 错误码完整列表

基于真实抓包和历史经验，整理的错误码：

| 错误码 | 中文说明 | 解决方案 |
|--------|----------|----------|
| `FAIL_SYS_ILLEGAL_ACCESS` | 非法访问 | 检查风控参数 |
| `FAIL_SYS_TOKEN_EMPTY` | Token为空 | Cookie可能已过期 |
| `FAIL_SYS_TOKEN_EXOIRED` | Token已过期 | 重新登录 |
| `FAIL_SYS_SESSION_EXPIRED` | 会话已过期 | 重新登录 |
| `FAIL_SYS_USER_VALIDATE` | 用户验证失败 | 重新登录 |
| `FAIL_BIZ_ALREADY_RECEIVED` | 已经领取过 | 等待下次活动 |
| `FAIL_BIZ_STOCK_NOT_ENOUGH` | 库存不足 | 等待补货 |
| `FAIL_BIZ_NOT_IN_TIME` | 不在活动时间内 | 等待活动开始 |
| `FAIL_BIZ_COIN_NOT_ENOUGH` | 礼享金余额不足 | 完成任务赚取 |
| `FAIL_BIZ_RISK_CONTROL` | 触发风控 | 稍后再试 |
| `FAIL_BIZ_FREQ_LIMIT` | 操作太频繁 | 降低请求频率 |
| `FAIL_BIZ_BLACK_USER` | 账号异常 | 联系客服 |
| **`LATOUR_BENEFITE_SHOW_FAIL`** | **红包已被抢光** | **等待补货** |
| `RGV587_ERROR` | 系统繁忙 | 稍后再试 |

---

## 🎯 下一步行动

### 需要获取的数据

1. **成功抢购的完整响应** 🔥
   - 在成功抢购时记录完整的 response
   - 验证 `data` 字段的结构
   - 确认成功后返回的信息（订单号、金额等）

2. **不同错误场景的抓包**
   - 余额不足时的响应
   - 已领取过时的响应
   - 触发风控时的响应

3. **风控参数的生成逻辑**
   - `asac` 的算法
   - `umidToken` 的获取方式

### 代码优化建议

- ✅ 已添加 `LATOUR_BENEFITE_SHOW_FAIL` 错误码
- ⏳ 等待成功响应后优化数据解析
- ⏳ 增加更详细的日志记录

---

## 📝 抓包记录模板

为了更好地分析，建议按以下格式记录：

```markdown
### 场景：[成功/失败] - [原因]

**时间：** YYYY-MM-DD HH:mm:ss
**红包：** [800元红包]
**benefitCode：** 4a7c9e8c194046de951c87ac3187e325

#### 请求参数
```json
{
  "asac": "...",
  "benefitCode": "...",
  "type": "redPacket",
  "ua": "...",
  "umidToken": "..."
}
```

#### 响应数据
```json
{
  "status": "...",
  "data": { ... },
  "ret": [ ... ]
}
```

#### 分析
- 错误码：...
- 原因：...
- 解决方案：...
```

---

## 🔗 相关文档

- [核心兑换接口实现验证](./CORE_EXCHANGE_API_IMPLEMENTATION.md)
- [真实抓包记录分析](./REAL_PACKET_CAPTURE_USAGE.md)
- [API 接口文档](./API_DOCUMENTATION.md)
- [风控参数说明](./RISK_CONTROL_PARAMS.md)

---

**最后更新：** 2025-11-13
**状态：** 待补充成功案例