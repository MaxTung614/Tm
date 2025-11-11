# 🛠️ 工具目录

风控参数提取和管理工具集。

---

## 📦 工具列表

| 文件 | 说明 | 用途 |
|------|------|------|
| `auto_extract_params.py` | 自动提取工具 | Selenium 自动化提取所有参数 |
| `umid_token_extractor.py` | ⭐ **UMID 专用提取** | 专门提取 umidToken |
| `validate_params.py` | 参数验证工具 | 验证参数完整性和格式 |
| `param_manager.py` | 参数管理工具 | 命令行快速管理参数 |

---

## 🚀 快速使用

### auto_extract_params.py

**功能**: 自动打开浏览器提取风控参数

```bash
# 安装依赖
pip install selenium

# 运行
python tools/auto_extract_params.py

# 结果自动保存到 data/risk_params.json
```

---

### umid_token_extractor.py

**功能**: 专门提取 umidToken

```bash
# 安装依赖
pip install selenium

# 运行
python tools/umid_token_extractor.py

# 结果自动保存到 data/risk_params.json
```

---

### validate_params.py

**功能**: 验证配置文件中的参数

```bash
# 验证
python tools/validate_params.py

# 查看报告
cat data/validation_report.json
```

---

### param_manager.py

**功能**: 快速管理参数

```bash
# 查看当前配置
python tools/param_manager.py show

# 设置参数
python tools/param_manager.py set-ua "值"
python tools/param_manager.py set-umid "值"
python tools/param_manager.py set-asac "值"

# 清除配置
python tools/param_manager.py clear all

# 验证
python tools/param_manager.py validate

# 帮助
python tools/param_manager.py help
```

---

## 📖 详细文档

查看项目根目录的文档：

- `TOOLS_README.md` - 工具集完整文档
- `TOOLS_USAGE_GUIDE.md` - 详细使用指南
- `COMPLETE_SETUP_GUIDE.md` - 完整配置流程

---

## 💡 使用建议

### 首次配置

推荐使用 `auto_extract_params.py`:

```bash
python tools/auto_extract_params.py
python tools/validate_params.py
```

### 日常更新

推荐使用 `param_manager.py`:

```bash
# 更新 ASAC
python tools/param_manager.py set-asac "新值"

# 验证
python tools/param_manager.py validate
```

### 问题排查

使用 `validate_params.py`:

```bash
python tools/validate_params.py
```

查看详细的验证报告和建议。

---

## ⚠️ 注意事项

1. **auto_extract_params.py** 需要安装 Selenium 和 Chrome 浏览器
2. **validate_params.py** 会生成 `data/validation_report.json` 报告
3. **param_manager.py** 直接修改 `data/risk_params.json`

---

## 🔧 开发

如果你想扩展这些工具：

```python
# 导入工具类
from tools.validate_params import RiskParameterValidator
from tools.auto_extract_params import RiskParameterExtractor

# 使用
validator = RiskParameterValidator()
validator.validate_all()
validator.print_report()
```

---

## 📚 更多信息

查看项目根目录的完整文档。