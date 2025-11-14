# 🔑 风控参数提取完整指南

**详细的 ua 和 umidToken 提取教程**

---

## 📋 目录

1. [参数概述](#参数概述)
2. [方法1：使用项目前端工具（推荐）](#方法1使用项目前端工具推荐)
3. [方法2：浏览器开发者工具](#方法2浏览器开发者工具)
4. [方法3：抓包工具](#方法3抓包工具)
5. [参数验证](#参数验证)
6. [常见问题](#常见问题)

---

## 参数概述

### 需要提取的参数

| 参数 | 说明 | 长度 | 示例 |
|------|------|------|------|
| **ua** | 设备指纹 | ~2000字符 | `140#KrfDKlVdzzP0uQo...` |
| **umidToken** | 设备唯一标识 | ~70字符 | `T2gA3oS44xIrqBycOdR...` |
| **asac** | 风控参数 | 22字符 | `2A21B24LA1SI0HB0EEVN03` |

**重要提示**：
- ✅ `asac` 已硬编码，无需提取
- ✅ 所有账号可共用同一套 `ua` 和 `umidToken`
- ✅ 建议每周更新一次参数

---

## 方法1：使用项目前端工具（推荐）

### 🎯 最简单的方法

#### Step 1: 启动系统

```bash
# Windows
start.bat

# Mac/Linux
python launcher.py
```

等待系统启动，浏览器会自动打开 `http://localhost:5173`

#### Step 2: 登录账号

选择登录方式：

**方式A：扫码登录**
1. 点击"扫码登录"
2. 使用手机淘宝扫描二维码
3. 确认登录

**方式B：Cookie登录**
1. 点击"Cookie登录"
2. 粘贴你的淘宝Cookie
3. 点击登录

#### Step 3: 进入参数提取页面

1. 登录成功后，点击左侧菜单的"参数提取"
2. 进入参数提取工具页面

#### Step 4: 提取参数

页面会显示两个大按钮：

**按钮1：提取 UA 参数**
1. 点击"提取 UA"按钮
2. 系统会打开新窗口，访问天猫礼享金页面
3. 等待页面加载完成（约3-5秒）
4. UA会自动提取并显示

**按钮2：提取 umidToken**
1. 点击"提取 umidToken"按钮
2. 系统会从Cookie和LocalStorage读取
3. umidToken会自动显示

#### Step 5: 保存参数

1. 检查提取的参数是否正确（长度和格式）
2. 点击"保存参数"按钮
3. 系统自动保存到 `data/risk_params.json`
4. 显示"保存成功"提示

#### Step 6: 验证参数

1. 点击"验证参数"按钮
2. 系统会测试参数是否有效
3. 查看验证结果

---

## 方法2：浏览器开发者工具

### 适用场景
- 项目前端工具不可用
- 需要手动调试
- 想要深入理解参数

### 提取 ua 参数

#### 步骤详解

**Step 1: 打开天猫礼享金页面**

访问：`https://pages.tmall.com/wow/z/tmall.sub/tm-sub/share-page`

**Step 2: 打开开发者工具**

- Windows: 按 `F12` 或 `Ctrl + Shift + I`
- Mac: 按 `Cmd + Option + I`

**Step 3: 切换到 Console 标签**

**Step 4: 执行提取代码**

```javascript
// 方法1: 从 window 对象读取
console.log('UA from window:', window.UA);

// 方法2: 从 localStorage 读取
console.log('UA from localStorage:', localStorage.getItem('UA'));
console.log('UA alternative:', localStorage.getItem('ua'));

// 方法3: 从页面中查找（最可靠）
// 先在 Network 面板找到包含 ua 的请求
// 复制 data 参数中的 ua 值

// 方法4: 触发抢购查看
// 在页面上点击任意红包的"立即兑换"
// 在 Network 面板找到 mtop.fisson 请求
// 查看 Request URL 的 data 参数
// 复制 ua 的值
```

#### 复制 UA

1. 在 Console 中看到 UA 输出
2. 右键点击字符串
3. 选择"Copy string contents"
4. 粘贴到文本编辑器保存

**UA 格式验证**：
```javascript
// 应该是这样的格式
"140#KrfDKlVdzzP0uQo23xzFK3N8s9zo8bEIULBjMhnKiROZ..."

// 检查长度（应该约1800-2200字符）
console.log('UA length:', window.UA.length);
```

---

### 提取 umidToken 参数

**💡 关于 umidToken 的生成**

umidToken 是由阿里的 UMID（Unified Mobile Identity）服务生成的设备唯一标识。

**生成流程：**
```
页面加载 → 调用 UMID 接口 → 采集设备信息 → 返回 umidToken
```

**UMID 接口：**
- 地址：`https://ynuf.aliapp.org/service/um.json`
- 作用：设备指纹采集和风控校验
- 详细说明：查看 `/docs/technical/api/umid-device-fingerprint.md`

**如何监听 UMID 接口（可选）：**

```javascript
// 在浏览器控制台运行
const observer = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    if (entry.name.includes('um.json')) {
      console.log('✅ 检测到 UMID 请求:', entry.name);
      console.log('⏱️ 耗时:', entry.duration.toFixed(2) + 'ms');
    }
  });
});
observer.observe({ entryTypes: ['resource'] });

// 然后刷新页面，观察是否有 UMID 请求
```

---

#### 方法A: 从 Cookie 提取

**Step 1: 在开发者工具中切换到 Application 标签**

**Step 2: 展开左侧的 Cookies**

**Step 3: 选择 `tmall.com` 或 `taobao.com`**

**Step 4: 查找以下 Cookie**：
- `_umtoken`
- `umidToken`
- `cna`（如果找不到上述两个）

**Step 5: 复制 Value 列的值**

#### 方法B: 从 LocalStorage 提取

**Step 1: 在 Application 标签中**

**Step 2: 展开 Local Storage**

**Step 3: 选择 `https://pages.tmall.com`**

**Step 4: 查找以下键**：
- `umidToken`
- `_umtoken`
- `deviceToken`

**Step 5: 复制对应的值**

#### 方法C: 从 Console 提取

```javascript
// 方法1: 从 Cookie 读取
document.cookie.split(';').forEach(c => {
    if (c.includes('umid') || c.includes('token')) {
        console.log(c.trim());
    }
});

// 方法2: 从 localStorage 读取
console.log('umidToken:', localStorage.getItem('umidToken'));
console.log('_umtoken:', localStorage.getItem('_umtoken'));

// 方法3: 从页面变量读取
console.log('window.umidToken:', window.umidToken);

// 方法4: 解析所有可能的位置
const sources = [
    window.umidToken,
    window._umtoken,
    localStorage.getItem('umidToken'),
    localStorage.getItem('_umtoken'),
    document.cookie.match(/umidToken=([^;]+)/)?.[1],
    document.cookie.match(/_umtoken=([^;]+)/)?.[1]
];

sources.forEach((src, i) => {
    if (src) console.log(`Source ${i}:`, src);
});
```

**umidToken 格式验证**：
```javascript
// 应该是 Base64 格式
"T2gA3oS44xIrqBycOdRk6VqlUdxwdWPR1VBfxRBURs5Oav4zJmtPa6RTTKI4Nnes9HY="

// 检查长度（应该约60-80字符）
console.log('umidToken length:', umidToken.length);

// 检查是否以 = 结尾（Base64特征）
console.log('Ends with =:', umidToken.endsWith('='));
```

---

## 方法3：抓包工具

### 使用 Chrome DevTools Network

这是最可靠的方法，因为直接从真实请求中提取。

#### 完整步骤

**Step 1: 打开天猫礼享金页面**

访问：`https://pages.tmall.com/wow/z/tmall.sub/tm-sub/share-page`

**Step 2: 打开开发者工具**

按 `F12`，切换到 **Network** 标签

**Step 3: 启用请求记录**

确保红色录制按钮是激活状态

**Step 4: 清空请求列表**

点击禁止图标（🚫）清空之前的请求

**Step 5: 触发一次抢购**

在页面上点击任意红包的"立即兑换"按钮

**Step 6: 找到目标请求**

在 Network 面板的过滤器中输入：
```
fisson
```

或者完整的：
```
mtop.fisson.gift.share.vcoin.exchange
```

**Step 7: 查看请求详情**

点击找到的请求，查看以下信息：

1. **Request URL** - 复制完整URL
2. **Query String Parameters** - 查看 `data` 参数
3. **Request Headers** - 查看 Cookie

**Step 8: 提取参数**

##### 提取 ua

1. 在 Request URL 中找到 `data` 参数
2. 复制 data 的值（URL编码的JSON）
3. 使用在线工具解码：`https://www.urldecoder.org/`
4. 在解码后的JSON中找到 `ua` 字段
5. 复制 `ua` 的值

**示例**：
```javascript
// URL编码的 data 参数
%7B%22ua%22%3A%22140%23KrfD...

// 解码后
{"ua":"140#KrfD...","umidToken":"T2gA3...","asac":"2A21..."}

// 提取 ua
"140#KrfDKlVdzzP0uQo23xzFK3N8s9zo..."
```

##### 提取 umidToken

同样从解码的 JSON 中找到 `umidToken` 字段

**Step 9: 保存参数**

将提取的参数保存到 `data/risk_params.json`：

```json
{
  "ua": "你提取的ua值",
  "umidToken": "你提取的umidToken值",
  "asac": "2A21B24LA1SI0HB0EEVN03"
}
```

---

### 使用 Fiddler / Charles

如果你使用专业抓包工具：

**Step 1: 配置代理**

- Fiddler: 默认 127.0.0.1:8888
- Charles: 默认 127.0.0.1:8888

**Step 2: 安装证书**

允许抓取 HTTPS 流量

**Step 3: 访问页面并抢购**

**Step 4: 找到目标请求**

搜索：`mtop.fisson.gift.share.vcoin.exchange`

**Step 5: 查看请求内容**

- 查看 Request
- 找到 `data` 参数
- 提取 `ua` 和 `umidToken`

---

## 参数验证

### 格式验证

```python
import json

# 读取配置
with open('data/risk_params.json', 'r', encoding='utf-8') as f:
    params = json.load(f)

# 验证 ua
ua = params['ua']
assert ua.startswith('140#'), "❌ UA格式错误：应该以 '140#' 开头"
assert len(ua) > 1000, "❌ UA太短：应该约1800-2200字符"
assert len(ua) < 3000, "❌ UA太长：可能包含了额外字符"
print(f"✅ UA格式正确，长度: {len(ua)}")

# 验证 umidToken
umid = params['umidToken']
assert len(umid) > 50, "❌ umidToken太短"
assert len(umid) < 100, "❌ umidToken太长"
assert umid.replace('=', '').replace('+', '').replace('/', '').isalnum(), \
    "❌ umidToken格式错误：应该是Base64格式"
print(f"✅ umidToken格式正确，长度: {len(umid)}")

# 验证 asac
asac = params['asac']
assert asac == '2A21B24LA1SI0HB0EEVN03', \
    "❌ asac值错误：应该是 '2A21B24LA1SI0HB0EEVN03'"
print(f"✅ asac正确")

print("\n🎉 所有参数验证通过！")
```

### 功能验证

```python
from TSDK.api.taobao.gift import TmallGiftAPI

# 初始化API
api = TmallGiftAPI()

# 设置Cookie（需要先登录）
api.set_cookies(your_cookies)

# 测试获取红包列表
try:
    packets = api.get_red_packets()
    print(f"✅ API调用成功，找到 {len(packets)} 个红包")
except Exception as e:
    print(f"❌ API调用失败: {e}")
```

---

## 常见问题

### Q1: 找不到 ua 参数怎么办？

**A**: 尝试以下方法：

1. **触发抢购操作**
   - 在页面上点击任意红包的"立即兑换"
   - 在 Network 面板查找请求

2. **查看页面源代码**
   - 右键 → 查看页面源代码
   - 搜索 `ua:` 或 `UA:`

3. **使用抓包**
   - 使用 Chrome DevTools Network
   - 触发抢购后查看请求

### Q2: umidToken 多个位置的值不一样？

**A**: 优先级：

1. ✅ Network 请求中的 `data.umidToken`（最可靠）
2. ✅ LocalStorage 中的 `umidToken`
3. ✅ Cookie 中的 `_umtoken`

选择最长的那个（通常是最完整的）。

### Q3: 提取的参数不工作？

**A**: 检查清单：

1. 格式是否正确（长度、字符）
2. 是否包含额外的空格或换行
3. JSON 文件编码是否为 UTF-8
4. Cookie 是否过期（重新登录）

### Q4: 多久需要更新一次参数？

**A**: 推荐更新频率：

| 参数 | 频率 | 触发条件 |
|------|------|---------|
| ua | 每周 | 设备信息变化 |
| umidToken | 每天 | 重新登录 |
| asac | 永久 | 无需更新 |

### Q5: 可以跨账号使用参数吗？

**A**: ✅ 可以！

根据测试，`ua` 和 `umidToken` 可以在多个账号间共用，无需为每个账号单独提取。

但建议：
- 每周更新一次
- 如果某个账号触发风控，更换新的参数

### Q6: 参数提取工具不工作？

**A**: 故障排查：

1. **检查前端是否启动**
   ```bash
   # 访问测试
   curl http://localhost:5173
   ```

2. **检查浏览器控制台**
   - F12 → Console
   - 查看是否有 JavaScript 错误

3. **手动提取**
   - 使用方法2或方法3手动提取
   - 直接编辑 `data/risk_params.json`

### Q7: 参数文件在哪里？

**A**: 位置：
```
项目根目录/data/risk_params.json
```

如果不存在，首次运行会自动创建。

### Q8: 提取的 ua 太短或太长？

**A**: 正常范围：

- ✅ 正常：1800-2200 字符
- ⚠️ 偏短：1000-1800 字符（可能可用）
- ❌ 太短：< 1000 字符（肯定有问题）
- ❌ 太长：> 3000 字符（包含了额外内容）

如果长度异常，重新提取。

---

## 🎯 最佳实践

### 提取建议

1. **首选项目工具**
   - 最简单、最可靠
   - 自动验证和保存

2. **备选浏览器工具**
   - 灵活度高
   - 适合调试

3. **终极方案抓包**
   - 100%准确
   - 直接从真实请求获取

### 保存建议

1. **备份参数文件**
   ```bash
   cp data/risk_params.json data/risk_params.backup.json
   ```

2. **版本控制**
   ```bash
   git add data/risk_params.json
   git commit -m "更新风控参数"
   ```

3. **定期更新**
   - 设置每周提醒
   - 登录后重新提取

### 安全建议

1. ⚠️ **不要分享参数文件**
   - 包含设备指纹信息
   - 可能被用于其他用途

2. ⚠️ **不要随意修改**
   - 不要手动编辑参数值
   - 只通过工具提取

3. ✅ **多账号共用**
   - 同一套参数可用于多个账号
   - 无需每个账号单独提取

---

## ✅ 成功标志

当你成功提取参数后，应该看到：

### 文件内容
```json
{
  "ua": "140#KrfDKlVdzzP0uQo23xzFK3N8s9zo8bEI...[约2000字符]",
  "umidToken": "T2gA3oS44xIrqBycOdRk6VqlUdxwdWPR...[约70字符]",
  "asac": "2A21B24LA1SI0HB0EEVN03"
}
```

### 验证通过
```
✅ UA格式正确，长度: 1987
✅ umidToken格式正确，长度: 68
✅ asac正确
🎉 所有参数验证通过！
```

### 可以使用
- ✅ 红包列表加载成功
- ✅ 抢购功能正常
- ✅ 无风控拦截

---

**参数提取完成，现在可以开始抢购了！** 🎉

如果遇到问题，参考上面的常见问题或查看详细文档。
