# 🚀 快速启动指南

## 📦 安装

```bash
# 进入项目目录
cd TSDK

# 安装依赖
pip install requests loguru cryptography qrcode pillow pytest
```

---

## 🔐 第一步：登录

```python
from TSDK.api.taobao.gift import TmallGiftAPI
from TSDK.utils.cookie_manager import CookieManager

# 1. 创建API实例
api = TmallGiftAPI()

# 2. 扫码登录（会自动打开二维码图片）
print("请使用淘宝App扫描二维码...")
if api.qrLogin(timeout=60, autoTrust=True):
    print("✅ 登录成功！")
    
    # 3. 保存Cookie
    manager = CookieManager(encrypt=True)
    cookies = dict(api.cookies)
    manager.save_cookies('my_account', cookies)
    print("✅ Cookie已保存")
else:
    print("❌ 登录失败")
```

---

## 🎁 第二步：查看商品

```python
from TSDK.api.taobao.gift import TmallGiftAPI
from TSDK.utils.cookie_manager import CookieManager

# 1. 加载Cookie
manager = CookieManager()
cookies = manager.get_cookie_dict('my_account')

# 2. 创建API实例并设置Cookie
api = TmallGiftAPI()
for name, value in cookies.items():
    api.cookies.set(name, value, domain='.taobao.com')

# 3. 查看所有可兑换商品
products = api.list_all_products()

# 输出示例:
# 1. ✅ type-c数据线 (0.5礼享金) - 原价¥3.8 现价¥3 - ID:777155634115
# 2. ✅ 手机支架 (3礼享金) - 原价¥5.01 现价¥4.95 - ID:775325947418
```

---

## 💰 第三步：兑换商品

### 方式A：快速兑换（推荐）

```python
# 假设要兑换第一个商品
item_id = '777155634115'

# 快速兑换（自动重试3次）
success = api.quick_exchange(item_id, retry_times=3)

if success:
    print("🎉 兑换成功！")
else:
    print("❌ 兑换失败")
```

### 方式B：手动兑换

```python
# 1. 获取商品信息
product = api.get_product_by_id('777155634115')

# 2. 获取页面数据（包含风控码）
page_data = api.get_exchange_all_page()
asac_code = page_data.get('drawAsacCode', '')

# 3. 执行兑换
result = api.exchange_gift(
    item_id=product['itemId'],
    coin_amount=product['gitCoinAmount'],
    asac_code=asac_code
)

if result:
    print("🎉 兑换成功！")
```

---

## ⏰ 第四步：定时抢购

```python
from TSDK.api.taobao.snatch import TmallSnatch
from TSDK.utils.cookie_manager import CookieManager
from datetime import datetime, timedelta

# 1. 加载Cookie
manager = CookieManager()
cookies = manager.get_cookie_dict('my_account')

# 2. 创建抢购实例
snatch = TmallSnatch()
for name, value in cookies.items():
    snatch.cookies.set(name, value, domain='.taobao.com')

# 3. 设置开始时间（例如：10秒后）
start_time = datetime.now() + timedelta(seconds=10)

# 4. 创建抢购任务
task_id = snatch.create_snatch_task(
    product_id='777155634115',  # 商品ID
    user_id='my_account',
    start_time=start_time,
    max_retries=10  # 失败后重试10次
)

print(f"✅ 任务已创建: {task_id}")
print(f"⏰ 将在 {start_time.strftime('%H:%M:%S')} 开始抢购")

# 5. 执行任务（会自动等待到开始时间）
result = snatch.execute_snatch_task(task_id, {})

if result.success:
    print(f"🎉 抢购成功！订单号: {result.order_id}")
else:
    print(f"❌ 抢购失败: {result.message}")
```

---

## 💸 提现礼享金

```python
# 1. 查询提现信息
withdrawal_info = api.get_withdrawal_info()

print(f"💰 总余额: {withdrawal_info['totalAmount']} 礼享金")

# 2. 查看可提现档位
term_list = withdrawal_info['termDTOList']
for term in term_list:
    print(f"  {term['cashOutValue']}元 - {term['limitTips']}")

# 3. 执行提现（选择第一个档位）
term = term_list[0]
result = api.withdrawal_draw(
    cash_out_value=term['cashOutValue'],
    term_id=term['id'],
    asac_code=withdrawal_info.get('drawAsacCode', '')
)

if result:
    print(f"🎉 提现成功: {term['cashOutValue']}元")
```

---

## 🎁 查看红包

```python
# 获取所有可兑换红包
red_packets = api.get_red_packets()

for packet in red_packets:
    print(f"{packet['title']} - {packet['coinAmount']}礼享金")
    print(f"  金额: {packet['amount']}元")
    print(f"  使用条件: {packet['subDesc']}")
```

---

## 📝 完整示例程序

运行交互式示例:

```bash
python TSDK/examples/gift_snatch_demo.py
```

选择菜单选项:
```
1. 登录并保存Cookie
2. 加载Cookie并测试
3. 获取商品列表
4. 快速兑换商品
5. 定时抢购
6. 查询提现信息
7. 查询红包列表
0. 运行所有示例
```

---

## 🔧 常见问题

### Q1: Cookie过期怎么办？

```python
manager = CookieManager()

# 检查是否过期
if not manager.is_cookie_valid('my_account', max_age_hours=24):
    print("Cookie已过期，请重新登录")
    # 重新登录...
```

### Q2: 如何查看抢购任务状态？

```python
# 查询任务状态
status = snatch.get_task_status(task_id)

print(f"状态: {status['status']}")
print(f"重试次数: {status['retry_count']}/{status['max_retries']}")
print(f"结果: {status['result']}")
```

### Q3: 如何提高抢购成功率？

```python
# 方法1: 增加重试次数
task_id = snatch.create_snatch_task(
    product_id='xxx',
    user_id='xxx',
    start_time=start_time,
    max_retries=20  # 增加到20次
)

# 方法2: 减少重试间隔
snatch.retry_interval = 0.05  # 改为50ms

# 方法3: 提前开始（提前100ms）
start_time = target_time - timedelta(milliseconds=100)
```

### Q4: 如何批量抢购多个商品？

```python
# 创建多个任务
products = ['777155634115', '775325947418', '783465638673']

for product_id in products:
    task_id = snatch.create_snatch_task(
        product_id=product_id,
        user_id='my_account',
        start_time=start_time,
        max_retries=5
    )
    
    # 立即执行
    result = snatch.execute_snatch_task(task_id, {})
    if result.success:
        print(f"✅ {product_id} 抢购成功")
        break  # 成功一个就停止
```

---

## 📚 更多文档

- [完整实现报告](/TSDK/docs/IMPLEMENTATION_COMPLETE.md)
- [抓包数据指南](/TSDK/docs/CAPTURE_DATA_GUIDE.md)
- [P0实施状态](/TSDK/docs/P0_IMPLEMENTATION_STATUS.md)

---

## 🎉 开始使用

```bash
# 1. 运行示例程序
python TSDK/examples/gift_snatch_demo.py

# 2. 选择 "1. 登录并保存Cookie"

# 3. 扫描二维码登录

# 4. 选择 "3. 获取商品列表" 查看可兑换商品

# 5. 选择 "4. 快速兑换商品" 进行兑换

# 完成！🎉
```

---

**祝您抢购顺利！** 🚀
