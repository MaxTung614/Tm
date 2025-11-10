# 🔍 如何找到正确的兑换请求

## ⚠️ 常见错误

很多人复制错了请求，因为没有实际点击"立即兑换"按钮！

---

## ✅ 正确步骤（超重要！）

### 第一步：准备工作

```
1. 打开Chrome浏览器
2. 按F12打开开发者工具
3. 切换到 Network 标签
4. ✅ 勾选 "Preserve log"（保留日志）
```

---

### 第二步：清空记录（关键！）

```
点击Network标签左上角的 🚫 图标（禁止符号）
或按快捷键 Ctrl + L

目的：清空所有之前的请求，只看新的请求
```

---

### 第三步：必须实际点击兑换按钮！

```
⚠️ 不要只是刷新页面！
⚠️ 不要只是查看商品！
✅ 必须真正点击 "立即兑换" 按钮！

操作：
1. 在礼享金页面找到任意商品
2. 点击商品下方的 "立即兑换" 按钮
3. 如果弹出确认框，点击"确定"

注意：
- 即使礼享金不足也没关系
- 兑换失败也没关系
- 只要点击了按钮就会发送请求
```

---

### 第四步：识别正确的请求

点击兑换后，Network标签会出现**新的请求**，找到包含以下关键词的：

```
🎯 正确的请求特征：

URL中包含:
✅ "mtop.fission.gift.share.vcoin.exchange"
✅ 注意：不是 "exchange.allpage"，而是 "exchange"

其他特征:
- Method: GET 或 POST
- Type: json 或 jsonp
- 时间: 刚刚（点击兑换后立即出现）
```

---

## 📋 对比示例

### ❌ 错误示例（您刚才提供的）

```
❌ mtop.tmall.kangaroo.core.service.route.PageRecommendService
   → 这是页面推荐服务

❌ https://pages.tmall.com/wow/an/tmall/user-growth/share-benefit-exchange
   → 这是HTML页面

❌ mtop.fission.gift.share.vcoin.exchange.allpage
   → 这是获取商品列表（我已经有了）
```

### ✅ 正确示例（我需要的）

```
✅ mtop.fission.gift.share.vcoin.exchange
   → 这才是兑换商品接口！
   
完整URL示例:
https://h5api.m.tmall.com/h5/mtop.fission.gift.share.vcoin.exchange/1.0/?
jsv=2.6.1&appKey=12574478&t=1762788077126&sign=xxx&...
```

---

## 🎬 详细操作动画说明

### 场景1: 兑换0.5礼享金的商品

```
1. 页面加载完成后，清空Network（Ctrl+L）

2. 找到一个商品，例如：
   "type-c数据线"
   "0.5 礼享金"
   [立即兑换] ← 点击这个按钮！

3. 点击后，Network立即出现新请求:
   
   Name: mtop.fission.gift.share.vcoin.exchange
   Method: GET 或 POST
   Status: 200
   Type: json
   ↑
   这就是我需要的！
```

---

## 🔎 使用过滤器快速查找

在Network标签的Filter输入框中输入：

```
方式1: 输入 "exchange"
       然后排除包含 "allpage" 的

方式2: 输入 "mtop.fission"
       查看所有相关请求

方式3: 输入 "h5api.m.tmall.com"
       查看所有API请求
```

---

## 💡 调试技巧

### 技巧1: 按时间排序

```
在Network中点击 "Time" 列头
最新的请求会排在最上面
点击兑换后，最上面的就是新请求
```

### 技巧2: 查看请求大小

```
兑换请求的Size通常很小（几KB）
如果是几百KB的，可能是页面或图片
```

### 技巧3: 查看Initiator（发起者）

```
点击请求后，在右侧可以看到 "Initiator"
兑换请求通常由按钮点击事件触发
```

---

## ⚠️ 常见问题

### Q1: 点击兑换后没有新请求？

```
原因可能是:
1. 没有勾选 "Preserve log"
2. Network标签被意外清空
3. 请求太快，被刷掉了

解决:
1. 确保勾选 "Preserve log"
2. 清空后再点击一次兑换
3. 使用Filter过滤
```

### Q2: 看到很多请求，不知道哪个是？

```
方法:
1. 清空Network
2. 点击兑换按钮
3. 只看新出现的前3个请求
4. 查看URL，找包含 "exchange" 且不含 "allpage" 的
```

### Q3: 提示礼享金不足，无法兑换？

```
✅ 没关系！
即使兑换失败，请求也会发送
错误响应对我也很有用
只要找到那个请求，复制cURL即可
```

---

## 📸 截图示例说明

### 正确的Network截图应该是：

```
Network 标签内容:

Name                                          | Method | Status | Type | Size | Time
--------------------------------------------------------------------------------------------------------
mtop.fission.gift.share.vcoin.exchange       | GET    | 200    | json | 1KB  | 100ms  ← 这个！
mtop.fission.gift.share.vcoin.exchange.allpage| GET   | 200    | json | 5KB  | 150ms  ← 不是这个
mtop.tmall.kangaroo...                       | GET    | 200    | json | 2KB  | 80ms
```

---

## 🎯 快速识别方法

**最简单的方法:**

```
1. 清空Network
2. 点击"立即兑换"按钮
3. 看最上面新出现的第1-3个请求
4. 找URL包含 "exchange" 但不包含 "allpage" 的
5. 右键 → Copy → Copy as cURL (bash)
6. 发送给我
```

---

## 📝 正确的cURL应该长这样

```bash
curl 'https://h5api.m.tmall.com/h5/mtop.fission.gift.share.vcoin.exchange/1.0/?...' \
  -H 'cookie: ...' \
  -H 'content-type: ...' \
  ...
```

**关键识别点:**
- ✅ URL包含 `mtop.fission.gift.share.vcoin.exchange`
- ✅ 不包含 `exchange.allpage`
- ✅ 域名是 `h5api.m.tmall.com`

---

## 🚀 完成后

复制正确的cURL命令后，直接发送给我即可！

我会立即：
1. 验证是否是正确的接口
2. 解析参数结构
3. 完成代码集成
4. 5分钟内交付完整功能

---

**记住：必须点击"立即兑换"按钮，才会产生兑换请求！** ⚠️
