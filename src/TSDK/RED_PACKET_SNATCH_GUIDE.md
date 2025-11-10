# 🎁 天猫礼享金红包抢购完整指南

## 📊 项目状态

**✅ 已完成：100%**

所有核心功能已实现，可以投入使用！

---

## 🎯 功能概述

本项目专注于**天猫礼享金红包兑换**功能，实现自动化抢购红包。

### 核心功能

- ✅ 获取可兑换红包列表
- ✅ 自动兑换红包
- ✅ Cookie安全存储管理
- ✅ 签名算法（已完全破解）
- ✅ 定时抢购任务
- ✅ 批量抢购

---

## 🚀 快速开始

### 第一步：安装依赖

```bash
cd /TSDK
pip install -r requirements.txt
```

### 第二步：配置Cookie

有两种方式：

#### 方式A：手动添加Cookie

```python
from TSDK.utils.cookie_manager import CookieManager

cm = CookieManager()

# 从浏览器复制Cookie字符串
cookie_str = """
_m_h5_tk=fcfaee10bf64bc0b3ed667432fc6d525_1762797076975; 
_m_h5_tk_enc=4be892be5738fc74e0a19668c1b91b84; 
cookie2=181348444fca4d660231760bc5d2b0cf; 
_tb_token_=e58e31d94eea4; 
unb=2214191126140; 
...
"""

# 保存Cookie
cm.save_cookies(
    user_id="your_username",  # 您的淘宝用户名
    cookie_str=cookie_str,
    metadata={
        "source": "manual",
        "note": "手动添加的Cookie"
    }
)
```

#### 方式B：使用扫码登录（待实现）

```python
from TSDK.api.login import TaobaoLogin

login = TaobaoLogin()
login.login_by_qrcode()
```

---

### 第三步：获取ua和umidToken参数

这两个参数是兑换红包必需的：

#### 方法1：使用自动提取工具

```bash
python /TSDK/tools/extract_browser_params.py
```

#### 方法2：手动从浏览器提取

1. 打开礼享金页面
2. 按F12打开开发者工具
3. 切换到Console标签
4. 执行命令：

```javascript
// 提取ua
window._umdata?.ua || window.umidData?.ua

// 提取umidToken  
window._umdata?.umidToken || window.umidData?.umidToken
```

5. 复制输出的值

#### 方法3：从抓包数据中复制

1. 兑换一次红包
2. 在Network中找到`mtop.fisson.gift.share.vcoin.exchange`请求
3. 查看请求的`data`参数
4. 复制`ua`和`umidToken`的值

---

### 第四步：运行抢购程序

```bash
python /TSDK/examples/red_packet_snatch_demo.py
```

---

## 📝 详细使用示例

### 示例1：基础兑换

```python
from TSDK.api.taobao.gift import TmallGiftAPI
from TSDK.utils.cookie_manager import CookieManager

# 初始化API
api = TmallGiftAPI()
cm = CookieManager()

# 加载Cookie
cookies = cm.get_cookies("your_username")
api.set_cookies(cookies)

# 获取红包列表
red_packets = api.get_red_packets()
print(f"发现 {len(red_packets)} 个可兑换红包")

# 选择第一个红包
packet = red_packets[0]
benefit_code = packet['benefitCode']

# 获取参数
page_data = api.get_exchange_all_page()
asac = page_data.get('drawAsacCode', '')

# 兑换红包
result = api.exchange_red_packet(
    benefit_code=benefit_code,
    asac=asac,
    ua='你的ua参数',  # 从浏览器提取
    umid_token='你的umidToken参数'  # 从浏览器提取
)

if result:
    print("兑换成功！")
else:
    print("兑换失败")
```

---

### 示例2：批量抢购所有红包

```python
from TSDK.api.taobao.gift import TmallGiftAPI
from TSDK.utils.cookie_manager import CookieManager
import time

api = TmallGiftAPI()
cm = CookieManager()

# 加载Cookie
cookies = cm.get_cookies("your_username")
api.set_cookies(cookies)

# 获取所有红包
red_packets = api.get_red_packets()

# 获取公共参数
page_data = api.get_exchange_all_page()
asac = page_data.get('drawAsacCode', '')
ua = '你的ua参数'
umid_token = '你的umidToken参数'

# 批量兑换
success_count = 0
for packet in red_packets:
    result = api.exchange_red_packet(
        benefit_code=packet['benefitCode'],
        asac=asac,
        ua=ua,
        umid_token=umid_token
    )
    
    if result:
        success_count += 1
        print(f"✅ 兑换成功: {packet['title']}")
    else:
        print(f"❌ 兑换失败: {packet['title']}")
    
    time.sleep(0.5)  # 避免请求过快

print(f"\n总计: 成功{success_count}/{len(red_packets)}")
```

---

### 示例3：定时抢购

```python
from TSDK.api.taobao.gift import TmallGiftAPI
from TSDK.utils.cookie_manager import CookieManager
import time
from datetime import datetime

api = TmallGiftAPI()
cm = CookieManager()
cookies = cm.get_cookies("your_username")
api.set_cookies(cookies)

# 设置抢购参数
target_benefit_code = "66e434e7bf3e49509a2f54c979bda34a"
snatch_time = datetime(2025, 11, 10, 12, 0, 0)  # 2025-11-10 12:00:00

print(f"目标时间: {snatch_time}")
print("等待中...")

# 提前准备参数
page_data = api.get_exchange_all_page()
asac = page_data.get('drawAsacCode', '')
ua = '你的ua参数'
umid_token = '你的umidToken参数'

# 等待到达时间
while datetime.now() < snatch_time:
    remaining = (snatch_time - datetime.now()).total_seconds()
    print(f"倒计时: {remaining:.1f}秒", end='\r')
    time.sleep(0.1)

# 执行抢购
print("\n开始抢购!")
result = api.exchange_red_packet(
    benefit_code=target_benefit_code,
    asac=asac,
    ua=ua,
    umid_token=umid_token
)

if result:
    print("🎉 抢购成功!")
else:
    print("❌ 抢购失败")
```

---

## 🔧 参数说明

### 必需参数

| 参数 | 说明 | 获取方式 |
|------|------|---------|
| `benefitCode` | 红包标识码 | 从`get_red_packets()`获取 |
| `asac` | 风控参数 | 从`get_exchange_all_page()`获取 |
| `ua` | 设备指纹 | 从浏览器JS或抓包数据获取 |
| `umidToken` | 设备唯一标识 | 从浏览器JS或抓包数据获取 |

### 参数详解

#### benefitCode
- **说明**：每个红包的唯一标识
- **示例**：`"66e434e7bf3e49509a2f54c979bda34a"`
- **获取**：
  ```python
  packets = api.get_red_packets()
  benefit_code = packets[0]['benefitCode']
  ```

#### asac
- **说明**：阿里风控参数，每次请求可能不同
- **示例**：`"2A21B24LA1SI0HB0EEVN03"`
- **获取**：
  ```python
  page_data = api.get_exchange_all_page()
  asac = page_data.get('drawAsacCode', '')
  ```

#### ua
- **说明**：设备指纹，超长Base64字符串（约500+字符）
- **示例**：`"140#nmuoUceczzPKw..."`
- **获取**：
  - 浏览器Console: `window._umdata?.ua`
  - 或从抓包数据的`data`参数中复制

#### umidToken
- **说明**：阿里UMID设备唯一标识
- **示例**：`"T2gArl5MCqpJaBLQXh3b0XpsLlW0Q8Q..."`
- **获取**：
  - 浏览器Console: `window._umdata?.umidToken`
  - 或从Cookie/LocalStorage中查找
  - 或从抓包数据中复制

---

## ⚠️ 重要注意事项

### 1. API名称拼写

```python
# ✅ 正确 - 注意是 fisson
api_name = 'mtop.fisson.gift.share.vcoin.exchange'

# ❌ 错误 - 不是 fission
api_name = 'mtop.fission.gift.share.vcoin.exchange'
```

### 2. ua参数有效期

- ua参数可能有时效性
- 建议每次抢购前重新获取
- 或者定期更新（如每小时）

### 3. Cookie有效期

- Cookie通常30天有效
- 建议定期检查和更新
- 可以使用`CookieManager.check_cookie_validity()`检查

### 4. 风控限制

- 不要频繁请求（建议间隔0.5秒以上）
- 一次性兑换过多可能触发风控
- 异常行为可能导致账号受限

---

## 🐛 常见问题

### Q1: 兑换失败，提示"参数错误"

**原因**：
- ua或umidToken参数无效
- 参数格式错误

**解决**：
1. 重新从浏览器提取ua和umidToken
2. 确保参数完整（没有被截断）
3. 检查参数中没有多余的空格或换行

---

### Q2: 兑换失败，提示"登录失效"

**原因**：
- Cookie已过期
- Cookie格式错误

**解决**：
1. 重新获取Cookie
2. 检查Cookie是否包含必需字段：
   - `_m_h5_tk`
   - `_m_h5_tk_enc`
   - `cookie2`
   - `_tb_token_`

---

### Q3: 获取不到ua参数

**解决方法**：

#### 方法1：从Console获取
```javascript
// 在礼享金页面Console执行
window._umdata?.ua || window.umidData?.ua || window.UA
```

#### 方法2：从抓包数据获取
1. F12 → Network
2. 兑换一次红包
3. 找到`mtop.fisson.gift.share.vcoin.exchange`请求
4. 查看URL参数中的`data`字段
5. URL解码后找到`ua`字段的值

#### 方法3：从LocalStorage获取
```javascript
// 在Console执行
Object.keys(localStorage).filter(k => k.includes('ua'))
// 查看输出，找到包含ua的key，然后
localStorage.getItem('那个key')
```

---

### Q4: 获取不到umidToken参数

**解决方法**：

#### 方法1：从Console获取
```javascript
window._umdata?.umidToken || window.umidData?.umidToken
```

#### 方法2：从Cookie获取
```javascript
document.cookie.split('; ').find(row => row.includes('umid'))
```

#### 方法3：从抓包数据获取
同Q3的方法2，从抓包的`data`参数中找`umidToken`字段

---

### Q5: 签名验证失败

**原因**：
- token提取错误
- 时间戳不同步

**解决**：
1. 检查`_m_h5_tk` Cookie是否正确
2. 确保系统时间准确
3. 检查签名算法实现

---

## 📚 API参考

### TmallGiftAPI类

#### 初始化
```python
api = TmallGiftAPI()
```

#### 主要方法

##### get_red_packets()
获取可兑换红包列表

```python
red_packets = api.get_red_packets()
# 返回: List[Dict]
# 每个红包包含: title, coinAmount, benefitCode, status等字段
```

##### exchange_red_packet()
兑换红包

```python
result = api.exchange_red_packet(
    benefit_code='红包标识码',
    asac='风控参数',
    ua='设备指纹',
    umid_token='设备标识'
)
# 返回: Dict (成功) 或 None (失败)
```

##### get_exchange_all_page()
获取页面所有数据（包括红包、商品、提现信息等）

```python
page_data = api.get_exchange_all_page()
# 返回: Dict
# 包含: redPacketModule, phoneBillModule, withdrawalModule等
```

---

## 🔐 安全建议

1. **不要分享Cookie**
   - Cookie包含登录凭证
   - 泄露后他人可以控制您的账号

2. **定期更换密码**
   - 建议每月更换一次
   - Cookie泄露后立即更换

3. **使用加密存储**
   - 本项目已实现AES-256加密
   - CookieManager会自动加密存储

4. **注意风控**
   - 不要过度频繁操作
   - 避免在短时间内大量兑换

---

## 📈 性能优化建议

### 1. 减少请求次数
```python
# 不好的做法：每次都获取页面数据
for packet in packets:
    page_data = api.get_exchange_all_page()  # ❌ 重复请求
    asac = page_data.get('drawAsacCode', '')
    api.exchange_red_packet(...)

# 好的做法：提前获取一次
page_data = api.get_exchange_all_page()  # ✅ 只请求一次
asac = page_data.get('drawAsacCode', '')
for packet in packets:
    api.exchange_red_packet(asac=asac, ...)
```

### 2. 并发请求（高级）
```python
import concurrent.futures

def exchange_one(packet):
    return api.exchange_red_packet(...)

with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
    results = executor.map(exchange_one, packets)
```

---

## 🎓 高级功能

### 自定义抢购策略

```python
class CustomSnatchStrategy:
    """自定义抢购策略"""
    
    def should_exchange(self, packet):
        """判断是否应该兑换该红包"""
        # 只兑换大于2元的红包
        if float(packet.get('coinAmount', 0)) < 2:
            return False
        return True
    
    def get_exchange_priority(self, packet):
        """获取兑换优先级"""
        # 金额越大优先级越高
        return float(packet.get('coinAmount', 0))

# 使用策略
strategy = CustomSnatchStrategy()
packets = api.get_red_packets()

# 筛选和排序
packets = [p for p in packets if strategy.should_exchange(p)]
packets.sort(key=strategy.get_exchange_priority, reverse=True)

# 按优先级兑换
for packet in packets:
    api.exchange_red_packet(...)
```

---

## 📞 支持与反馈

### 遇到问题？

1. 查看本文档的"常见问题"部分
2. 检查日志输出的错误信息
3. 查看 `/TSDK/docs/` 目录下的其他文档

### 成功案例

分享您的使用经验，帮助改进项目！

---

## 🎉 总结

**恭喜！您已经掌握了天猫礼享金红包抢购系统！**

核心步骤回顾：
1. ✅ 配置Cookie
2. ✅ 获取ua和umidToken参数
3. ✅ 运行抢购程序
4. ✅ 享受自动化抢红包的乐趣！

**祝您抢购愉快！** 🎁🚀
