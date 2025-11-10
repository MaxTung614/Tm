# 📁 项目目录结构说明

**版本**: v1.0.0  
**更新日期**: 2025-11-10  
**状态**: ✅ 已优化

---

## 🌳 完整目录树

```
/TSDK/
│
├── 📖 项目文档 (核心)
│   ├── README.md                          ⭐ 项目介绍和快速开始
│   ├── QUICK_START.md                     ⭐ 5分钟快速入门指南
│   ├── RED_PACKET_SNATCH_GUIDE.md         ⭐ 完整使用指南（必读）
│   ├── PROJECT_COMPLETE.md                📊 项目完成报告
│   ├── FINAL_PROJECT_STATUS.md            📊 最终项目状态
│   ├── CODE_REVIEW_REPORT.md              🔍 代码审查报告
│   ├── CLEANUP_COMPLETE_REPORT.md         ✅ 清理完成报告
│   ├── CLEANUP_EXECUTION_SUMMARY.md       ✅ 清理执行总结
│   ├── BACKUP_BEFORE_CLEANUP.md           🔐 清理前备份记录
│   └── PROJECT_STRUCTURE.md               📁 目录结构说明（本文档）
│
├── 🔧 核心代码
│   ├── __init__.py                        # 包初始化
│   ├── main.py                            # 主程序入口
│   ├── verify_sign.py                     # 签名验证脚本
│   │
│   ├── api/                               # API模块
│   │   ├── __init__.py
│   │   ├── base.py                        # 基础API类
│   │   │
│   │   ├── taobao/                        # 淘宝API
│   │   │   ├── __init__.py
│   │   │   ├── h5.py                      # MTOP H5 API + 签名算法 ⭐核心
│   │   │   └── gift.py                    # 礼享金红包API ⭐核心（已精简）
│   │   │
│   │   ├── types/                         # 类型定义
│   │   │   ├── __init__.py
│   │   │   └── taobao.py                  # 淘宝相关类型
│   │   │
│   │   ├── douyin/                        # 抖音API（可选）
│   │   │   └── h5.py
│   │   │
│   │   └── eleme/                         # 饿了么API（可选）
│   │       └── h5.py
│   │
│   ├── utils/                             # 工具模块
│   │   ├── __init__.py
│   │   ├── cookie_manager.py              # Cookie管理器 ⭐核心
│   │   └── request_analyzer.py            # 请求分析器
│   │
│   └── tools/                             # 辅助工具
│       ├── __init__.py
│       ├── extract_browser_params.py      # 浏览器参数提取 ⭐有用
│       ├── capture_analyzer.py            # 抓包分析器
│       └── import_cookies.py              # Cookie导入工具
│
├── 💡 示例代码
│   └── examples/
│       ├── __init__.py
│       ├── red_packet_snatch_demo.py      # 红包抢购示例 ⭐核心（必看）
│       └── analyze_capture_data.py        # 抓包数据分析示例
│
├── 🧪 测试代码
│   └── tests/
│       ├── __init__.py
│       └── test_p0_features.py            # 核心功能测试（已更新）
│
├── 📚 辅助文档
│   └── docs/
│       ├── HOW_TO_CAPTURE.md              # 抓包教程
│       ├── FIND_CORRECT_REQUEST.md        # 查找正确请求指南
│       └── REQUEST_COMPARISON.md          # 请求对比分析
│
├── 🔬 分析工具（可选）
│   └── analysis/
│       ├── __init__.py
│       ├── capture_analysis_results.py    # 分析结果
│       ├── exchange_request_analysis.py   # 兑换请求分析
│       └── packet_analyzer.py             # 数据包分析器
│
├── 💾 数据存储
│   ├── storage/                           # Cookie存储目录（自动创建）
│   │   └── cookies/                       # 加密Cookie文件
│   │
│   └── data/                              # 抓包数据（可选）
│       ├── network_captures.json          # 网络抓包数据
│       └── exchange_red_packet_capture.json
│
└── 📦 配置文件（待创建）
    ├── requirements.txt                   # Python依赖
    ├── .gitignore                         # Git忽略文件
    └── pytest.ini                         # Pytest配置
```

---

## 📂 核心目录详解

### 1. 项目文档 (`/TSDK/`)

#### 必读文档

| 文件 | 用途 | 优先级 |
|------|------|--------|
| `README.md` | 项目介绍、快速开始 | ⭐⭐⭐⭐⭐ |
| `QUICK_START.md` | 5分钟快速入门 | ⭐⭐⭐⭐⭐ |
| `RED_PACKET_SNATCH_GUIDE.md` | 完整使用指南 | ⭐⭐⭐⭐⭐ |

#### 参考文档

| 文件 | 用途 | 优先级 |
|------|------|--------|
| `PROJECT_COMPLETE.md` | 项目完成报告、功能说明 | ⭐⭐⭐⭐ |
| `FINAL_PROJECT_STATUS.md` | 最终项目状态 | ⭐⭐⭐ |
| `CODE_REVIEW_REPORT.md` | 代码审查详情 | ⭐⭐⭐ |
| `CLEANUP_COMPLETE_REPORT.md` | 清理完成报告 | ⭐⭐ |
| `CLEANUP_EXECUTION_SUMMARY.md` | 清理执行总结 | ⭐⭐ |

---

### 2. 核心代码 (`/TSDK/api/`)

#### 淘宝API (`/TSDK/api/taobao/`)

**h5.py** - MTOP H5 API基础类
```python
class TaobaoH5(Base):
    """
    淘宝MTOP H5 API基类
    
    核心功能:
    - MTOP签名算法（已完全破解）
    - Cookie管理
    - 请求发送
    - 响应解析
    
    签名公式: MD5(token & timestamp & appKey & data)
    """
```

**gift.py** - 礼享金红包API（已精简）
```python
class TmallGiftAPI(TaobaoH5):
    """
    天猫礼享金API类
    
    核心方法:
    - get_red_packets()         # 获取红包列表
    - exchange_red_packet()     # 兑换红包 ⭐核心
    - get_exchange_all_page()   # 获取页面数据
    - get_user_balance()        # 获取用户余额
    
    已删除:
    - 商品兑换相关（7个方法）
    - 提现相关（1个方法）
    """
```

---

### 3. 工具模块 (`/TSDK/utils/`)

**cookie_manager.py** - Cookie管理器
```python
class CookieManager:
    """
    Cookie安全管理器
    
    功能:
    - AES-256加密存储
    - 多用户隔离
    - 自动过期检测
    - 浏览器格式导出
    
    使用:
    cm = CookieManager()
    cm.save_cookies(user_id, cookies)
    cookies = cm.get_cookies(user_id)
    """
```

**request_analyzer.py** - 请求分析器
```python
class RequestAnalyzer:
    """
    HTTP请求分析工具
    
    功能:
    - URL解析
    - cURL解析
    - 签名参数提取
    - 响应分析
    
    使用:
    params = RequestAnalyzer.extract_sign_params(url)
    result = RequestAnalyzer.parse_curl(curl_command)
    """
```

---

### 4. 辅助工具 (`/TSDK/tools/`)

**extract_browser_params.py** - 浏览器参数提取
```python
class BrowserParamsExtractor:
    """
    从浏览器提取ua和umidToken参数
    
    功能:
    - 自动启动浏览器
    - 从JavaScript提取参数
    - 从LocalStorage提取
    - 从网络请求拦截
    
    使用:
    python /TSDK/tools/extract_browser_params.py
    """
```

**capture_analyzer.py** - 抓包分析器
```python
class CaptureAnalyzer:
    """
    网络抓包数据分析工具
    
    功能:
    - 批量分析抓包数据
    - 提取API调用
    - 分析请求参数
    - 导出分析结果
    
    使用:
    analyzer = CaptureAnalyzer()
    analyzer.load_capture_batch(data_list)
    """
```

---

### 5. 示例代码 (`/TSDK/examples/`)

**red_packet_snatch_demo.py** - 红包抢购示例 ⭐必看
```python
"""
完整的红包抢购示例

包含:
- 基础兑换
- 批量抢购
- 定时抢购
- 错误处理
- 参数获取指南

使用:
python /TSDK/examples/red_packet_snatch_demo.py
"""
```

---

### 6. 测试代码 (`/TSDK/tests/`)

**test_p0_features.py** - 核心功能测试
```python
"""
P0功能测试套件

包含测试:
- TestCookieManager       # Cookie管理器测试（4个）
- TestRequestAnalyzer     # 请求分析器测试（4个）
- TestTmallGiftAPI        # 礼享金API测试（2个）
- TestCaptureAnalyzer     # 抓包分析器测试（3个）

运行:
pytest /TSDK/tests/test_p0_features.py -v
"""
```

---

### 7. 辅助文档 (`/TSDK/docs/`)

| 文件 | 内容 | 用途 |
|------|------|------|
| `HOW_TO_CAPTURE.md` | 抓包教程 | 学习如何抓包 |
| `FIND_CORRECT_REQUEST.md` | 查找请求指南 | 找到正确的API请求 |
| `REQUEST_COMPARISON.md` | 请求对比 | 对比不同请求的差异 |

---

### 8. 分析工具 (`/TSDK/analysis/`)

可选模块，用于开发阶段的数据分析：

```python
capture_analysis_results.py    # 抓包分析结果
exchange_request_analysis.py   # 兑换请求详细分析
packet_analyzer.py             # 数据包分析器
```

---

### 9. 数据存储 (`/TSDK/storage/`, `/TSDK/data/`)

#### storage/
```
/TSDK/storage/
└── cookies/                   # Cookie存储目录
    ├── user1.enc             # 加密的Cookie文件
    ├── user2.enc
    └── .cookie_key           # 加密密钥（自动生成）
```

#### data/
```
/TSDK/data/
├── network_captures.json      # 网络抓包数据
├── exchange_red_packet_capture.json
└── browser_params.json        # 浏览器参数（自动生成）
```

---

## 🎯 文件用途速查

### 新手必看

1. **README.md** - 项目介绍
2. **QUICK_START.md** - 快速开始
3. **RED_PACKET_SNATCH_GUIDE.md** - 完整使用指南
4. **examples/red_packet_snatch_demo.py** - 示例代码

### 核心代码

1. **api/taobao/h5.py** - MTOP签名算法
2. **api/taobao/gift.py** - 红包兑换API
3. **utils/cookie_manager.py** - Cookie管理

### 辅助工具

1. **tools/extract_browser_params.py** - 参数提取
2. **utils/request_analyzer.py** - 请求分析

### 测试验证

1. **tests/test_p0_features.py** - 单元测试

---

## 📏 代码规模统计

### 核心代码

```
api/taobao/h5.py:          ~300 行
api/taobao/gift.py:        ~228 行（已精简）
utils/cookie_manager.py:   ~400 行
utils/request_analyzer.py: ~200 行
────────────────────────────────
核心代码总计:              ~1128 行
```

### 辅助代码

```
tools/:                    ~500 行
examples/:                 ~300 行
tests/:                    ~400 行
analysis/:                 ~300 行
────────────────────────────────
辅助代码总计:              ~1500 行
```

### 文档

```
主要文档:                  ~3000 行
辅助文档:                  ~1000 行
────────────────────────────────
文档总计:                  ~4000 行
```

---

## 🗂️ 文件分类

### 按功能分类

#### 红包兑换核心
```
api/taobao/gift.py           # 红包API
examples/red_packet_snatch_demo.py  # 示例
```

#### 签名和认证
```
api/taobao/h5.py             # MTOP签名
utils/cookie_manager.py      # Cookie管理
```

#### 辅助工具
```
tools/extract_browser_params.py
utils/request_analyzer.py
tools/capture_analyzer.py
```

#### 文档和测试
```
*.md                         # 文档
tests/                       # 测试
```

---

### 按重要性分类

#### P0 - 必需
```
api/taobao/h5.py
api/taobao/gift.py
utils/cookie_manager.py
examples/red_packet_snatch_demo.py
RED_PACKET_SNATCH_GUIDE.md
```

#### P1 - 重要
```
tools/extract_browser_params.py
utils/request_analyzer.py
README.md
QUICK_START.md
```

#### P2 - 可选
```
analysis/
docs/
data/
```

---

## 📖 使用建议

### 新手学习路径

```
1. 阅读 README.md                      ← 了解项目
2. 阅读 QUICK_START.md                 ← 快速上手
3. 运行 red_packet_snatch_demo.py      ← 实践操作
4. 阅读 RED_PACKET_SNATCH_GUIDE.md     ← 深入学习
5. 查看 api/taobao/gift.py            ← 理解实现
```

### 开发者路径

```
1. 了解项目结构（本文档）
2. 阅读 api/taobao/h5.py 理解签名
3. 阅读 api/taobao/gift.py 理解API
4. 查看测试代码了解用法
5. 参考示例代码开发
```

### 问题排查路径

```
1. 查看 RED_PACKET_SNATCH_GUIDE.md 的常见问题
2. 检查 tests/ 中的测试用例
3. 参考 examples/ 中的示例
4. 查看相关文档
```

---

## 🎯 目录维护建议

### 定期清理

```bash
# 清理Python缓存
find /TSDK -type d -name __pycache__ -exec rm -rf {} +
find /TSDK -type f -name "*.pyc" -delete

# 清理临时文件
rm -rf /TSDK/data/*.tmp
```

### 归档建议

如果不再需要开发工具，可以归档：

```bash
mkdir -p /TSDK/archive/
mv /TSDK/analysis /TSDK/archive/
mv /TSDK/verify_sign.py /TSDK/archive/
mv /TSDK/data/network_captures.json /TSDK/archive/
```

---

## ✅ 目录完整性检查

### 核心文件检查清单

- [ ] api/taobao/h5.py 存在
- [ ] api/taobao/gift.py 存在
- [ ] utils/cookie_manager.py 存在
- [ ] examples/red_packet_snatch_demo.py 存在
- [ ] README.md 存在
- [ ] RED_PACKET_SNATCH_GUIDE.md 存在

### 功能完整性

- [ ] 可以导入 TmallGiftAPI
- [ ] 可以导入 CookieManager
- [ ] 可以运行示例代码
- [ ] 可以运行测试

---

## 📝 总结

### 目录特点

✅ **结构清晰** - 按功能模块组织  
✅ **文档完整** - 每个模块都有说明  
✅ **易于导航** - 核心文件突出  
✅ **便于维护** - 职责分明

### 核心路径

```
核心功能:  api/taobao/gift.py
签名算法:  api/taobao/h5.py
Cookie管理: utils/cookie_manager.py
使用示例:  examples/red_packet_snatch_demo.py
使用指南:  RED_PACKET_SNATCH_GUIDE.md
```

---

**文档版本**: v1.0.0  
**最后更新**: 2025-11-10  
**维护状态**: ✅ 活跃
