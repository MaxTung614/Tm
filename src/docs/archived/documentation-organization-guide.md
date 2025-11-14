# 📁 文档归类完整指导

**项目**: 天猫礼享金抢购系统（Supabase 版本）  
**文档版本**: 1.0.0  
**创建时间**: 2025-11-13

---

## 📖 目录

- [概述](#-概述)
- [文档分类标准](#-文档分类标准)
- [文件夹层级结构设计](#-文件夹层级结构设计)
- [命名规范](#-命名规范)
- [归类流程](#-归类流程)
- [自动化归类规则](#-自动化归类规则)
- [检索和管理机制](#-检索和管理机制)
- [执行步骤](#-执行步骤)

---

## 🎯 概述

### 当前状况

**根目录文档统计**:
```
总文档数：     17 个 Markdown 文件
散乱程度：     ⭐⭐⭐⭐ (严重)
查找难度：     ⭐⭐⭐⭐ (困难)
组织性：       ⭐⭐ (较差)
```

**现存问题**:
- ❌ 文档全部堆积在根目录
- ❌ 缺乏清晰的分类体系
- ❌ 文档命名不统一
- ❌ 查找效率低下
- ❌ 维护困难

### 归类目标

**预期效果**:
```
文档分类：     ✅ 清晰的 5 大类别
查找效率：     ✅ 提升 80%
组织性：       ✅ ⭐⭐⭐⭐⭐ (优秀)
维护性：       ✅ ⭐⭐⭐⭐⭐ (优秀)
扩展性：       ✅ 支持未来文档增长
```

---

## 📊 文档分类标准

### 分类维度

我们采用 **3 维分类法**：

1. **用户角色维度** - 文档面向的用户群体
2. **文档类型维度** - 文档的内容类型
3. **生命周期维度** - 文档的时效性

### 5 大文档类别

#### 1. 用户文档 (User Documentation)

**定义**: 面向最终用户的使用指南

**包含**:
- 快速开始指南
- 使用教程
- 常见问题
- 部署指南

**特征**:
- ✅ 面向非技术用户
- ✅ 注重实用性
- ✅ 步骤详细
- ✅ 示例丰富

**判断标准**:
```
如果文档回答以下问题，则归入用户文档：
- 如何部署系统？
- 如何使用某功能？
- 遇到问题怎么办？
- 如何配置参数？
```

---

#### 2. 技术文档 (Technical Documentation)

**定义**: 面向开发者的技术资料

**包含**:
- API 文档
- 架构设计文档
- 接口规范
- 技术分析

**特征**:
- ✅ 面向技术人员
- ✅ 注重准确性
- ✅ 包含技术细节
- ✅ 代码示例

**判断标准**:
```
如果文档回答以下问题，则归入技术文档：
- 系统如何设计？
- 接口如何调用？
- 算法如何实现？
- 参数如何传递？
```

---

#### 3. 项目管理文档 (Project Documentation)

**定义**: 项目状态和管理相关文档

**包含**:
- 项目状态报告
- 审计报告
- 修复记录
- 变更日志

**特征**:
- ✅ 面向项目管理者
- ✅ 记录项目历程
- ✅ 追踪变更
- ✅ 评估质量

**判断标准**:
```
如果文档回答以下问题，则归入项目管理文档：
- 项目进展如何？
- 修复了哪些问题？
- 代码质量如何？
- 有哪些待办事项？
```

---

#### 4. 参考文档 (Reference Documentation)

**定义**: 配置、规范、索引类文档

**包含**:
- 配置文件说明
- 业务参数配置
- 文档索引
- 命名规范

**特征**:
- ✅ 快速查阅
- ✅ 结构化信息
- ✅ 作为参考资料
- ✅ 经常更新

**判断标准**:
```
如果文档回答以下问题，则归入参考文档：
- 有哪些可用文档？
- 参数有哪些选项？
- 配置项是什么？
- 规范是怎样的？
```

---

#### 5. 归档文档 (Archived Documentation)

**定义**: 过时或已替代的文档

**包含**:
- 旧版本文档
- 已废弃的方案
- 重复的文档
- 临时文档

**特征**:
- ⚠️ 不建议使用
- ⚠️ 已被新版替代
- ⚠️ 保留作为历史记录
- ⚠️ 可能删除

**判断标准**:
```
如果文档符合以下条件，则归入归档文档：
- 已有新版本替代
- 内容已过时
- 与主文档重复
- 仅作历史参考
```

---

## 🏗️ 文件夹层级结构设计

### 推荐结构 (3 层设计)

```
项目根目录/
│
├── 📄 README.md                    ← 唯一根目录文档（入口）
│
├── 📂 docs/                        ← 文档总目录（第1层）
│   │
│   ├── 📂 user-guides/            ← 用户文档（第2层）
│   │   ├── 📄 README.md           ← 用户文档索引
│   │   ├── 📄 quick-start.md      ← 快速开始
│   │   ├── 📄 deployment-guide.md ← 部署指南
│   │   ├── 📄 parameter-extraction.md ← 参数提取
│   │   └── 📄 faq.md              ← 常见问题
│   │
│   ├── 📂 technical/              ← 技术文档（第2层）
│   │   ├── 📄 README.md           ← 技术文档索引
│   │   ├── 📄 architecture.md     ← 架构设计
│   │   ├── 📄 database-schema.md  ← 数据库设计
│   │   ├── 📄 security-analysis.md ← 安全分析
│   │   │
│   │   └── 📂 api/                ← API 文档（第3层）
│   │       ├── 📄 README.md       ← API 索引
│   │       ├── 📄 exchange-api.md ← 兑换接口
│   │       ├── 📄 list-api.md     ← 列表接口
│   │       ├── 📄 user-api.md     ← 用户接口
│   │       ├── 📄 awsc-components.md ← 风控组件
│   │       └── 📄 success-analysis.md ← 成功案例
│   │
│   ├── 📂 project/                ← 项目管理文档（第2层）
│   │   ├── 📄 README.md           ← 项目文档索引
│   │   ├── 📄 status-report.md    ← 项目状态
│   │   ├── 📄 audit-report.md     ← 审计报告
│   │   ├── 📄 fixes-log.md        ← 修复日志
│   │   ├── 📄 cleanup-report.md   ← 清理报告
│   │   └── 📄 changelog.md        ← 变更日志
│   │
│   ├── 📂 reference/              ← 参考文档（第2层）
│   │   ├── 📄 README.md           ← 参考文档索引
│   │   ├── 📄 target-packets.md   ← 目标红包
│   │   ├── 📄 doc-index.md        ← 文档总索引
│   │   ├── 📄 deployment-comparison.md ← 部署对比
│   │   └── 📄 naming-conventions.md ← 命名规范
│   │
│   └── 📂 archived/               ← 归档文档（第2层）
│       ├── 📄 README.md           ← 归档说明
│       ├── 📄 old-readme.md       ← 旧版 README
│       └── 📄 deprecated-guide.md ← 废弃指南
│
├── 📂 src/                        ← 源代码目录
├── 📂 lib/                        ← 库文件
├── 📂 components/                 ← 组件
└── ...                            ← 其他代码文件
```

### 层级说明

#### 第 0 层 - 根目录
```
唯一文档：README.md
作用：项目入口，快速了解
原则：除 README.md 外，不放置其他文档
```

#### 第 1 层 - docs/ 总目录
```
作用：所有文档的根目录
包含：5 个子目录 + 1 个索引文件
原则：按文档类别分类
```

#### 第 2 层 - 分类目录
```
目录数量：5 个（user-guides, technical, project, reference, archived）
每个目录：包含 README.md 索引
作用：按类别组织文档
```

#### 第 3 层 - 细分目录（可选）
```
仅在必要时创建
例如：technical/api/ 包含所有 API 文档
作用：进一步细分大类别
```

---

## 📝 命名规范

### 文件命名规则

#### 1. 基本规则

**格式**: `<类型>-<描述>-<版本>.md`

**示例**:
```
✅ quick-start.md              (快速开始)
✅ deployment-guide.md         (部署指南)
✅ api-exchange.md             (兑换 API)
✅ status-report-v2.md         (状态报告 v2)
```

**禁止**:
```
❌ 开始使用.md                 (使用中文)
❌ Quick Start.md             (包含空格)
❌ QUICKSTART.md              (全大写)
❌ quick_start.md             (使用下划线)
```

#### 2. 命名组成

**类型前缀** (可选):
```
guide-      指南类文档
api-        API 文档
ref-        参考文档
report-     报告类文档
tutorial-   教程类文档
faq-        常见问题
changelog-  变更日志
```

**描述部分**:
```
- 使用小写字母
- 单词间用连字符 (-) 分隔
- 简洁明确，不超过 4 个单词
- 使用英文（便于版本控制）
```

**版本后缀** (可选):
```
-v1, -v2, -v3     版本号
-2025-11-13       日期版本
-deprecated       已废弃
-archived         已归档
```

#### 3. 特殊文件命名

**索引文件**:
```
✅ README.md      每个目录的索引文件
```

**配置文件**:
```
✅ config.md      配置说明
✅ setup.md       安装配置
```

**日志文件**:
```
✅ changelog.md   变更日志
✅ fixes-log.md   修复日志
```

---

### 文件夹命名规则

#### 1. 基本规则

**格式**: `<功能描述>`

**示例**:
```
✅ user-guides/    用户指南目录
✅ technical/      技术文档目录
✅ api/            API 文档目录
✅ project/        项目文档目录
```

**禁止**:
```
❌ User Guides/    (包含空格和大写)
❌ 用户指南/        (使用中文)
❌ user_guides/    (使用下划线)
❌ USERGUIDES/     (全大写)
```

#### 2. 命名原则

```
- 全部小写
- 使用连字符分隔多个单词
- 简洁明确
- 使用英文
- 避免缩写（除非是通用缩写如 api, faq）
```

---

## 🔄 归类流程

### 完整归类流程 (7 步)

```
Step 1: 文档盘点
   ↓
Step 2: 分类判断
   ↓
Step 3: 创建目录结构
   ↓
Step 4: 重命名文件
   ↓
Step 5: 移动文件
   ↓
Step 6: 更新链接
   ↓
Step 7: 验证完整性
```

---

### Step 1: 文档盘点

**目的**: 列出所有需要归类的文档

**操作**:
```bash
# 列出根目录所有 Markdown 文件
find / -maxdepth 1 -name "*.md" -type f

# 列出 docs/ 目录所有文件
find /docs -name "*.md" -type f
```

**输出清单**:
```markdown
## 根目录文档清单

1. README.md
2. README-开始这里.md
3. Supabase部署指南.md
4. Supabase无后端方案.md
5. Supabase方案-完整总结.md
6. 开始使用-Supabase版本.md
7. 风控参数提取完整指南.md
8. 本地部署vs云端部署对比.md
9. TARGET_RED_PACKETS.md
10. PROJECT_STATUS.md
11. SYSTEM_AUDIT_REPORT.md
12. FIXES_COMPLETED.md
13. CODE_CLEANUP_PLAN.md
14. CODE_CLEANUP_CHANGES.md
15. CODE_CLEANUP_SUMMARY.md
16. FINAL_CLEANUP_REPORT.md
17. DOCUMENTATION_INDEX.md
18. DOCUMENTATION_OPTIMIZATION_REPORT.md
19. Attributions.md

总计：19 个文档
```

---

### Step 2: 分类判断

**工具**: 分类决策树

```
文档分类决策树：

开始
 │
 ├─ 是否是 README.md？
 │   └─ 是 → 保留在根目录 ✅
 │
 ├─ 是否面向最终用户？
 │   └─ 是 → user-guides/ 📂
 │       ├─ 部署相关 → deployment-guide.md
 │       ├─ 使用教程 → tutorial-*.md
 │       └─ 问题解答 → faq.md
 │
 ├─ 是否是技术文档？
 │   └─ 是 → technical/ 📂
 │       ├─ API 文档 → technical/api/
 │       ├─ 架构设计 → architecture.md
 │       └─ 安全分析 → security-analysis.md
 │
 ├─ 是否是项目管理文档？
 │   └─ 是 → project/ 📂
 │       ├─ 状态报告 → status-report.md
 │       ├─ 审计报告 → audit-report.md
 │       └─ 修复记录 → fixes-log.md
 │
 ├─ 是否是参考配置？
 │   └─ 是 → reference/ 📂
 │       ├─ 配置参数 → config-*.md
 │       ├─ 文档索引 → doc-index.md
 │       └─ 对比分析 → comparison-*.md
 │
 └─ 是否已过时或重复？
     └─ 是 → archived/ 📂
         └─ 添加 -archived 后缀
```

**分类表格**:

| 文档名 | 当前位置 | 归类目标 | 新文件名 | 原因 |
|--------|---------|---------|---------|------|
| README.md | / | / | README.md | ✅ 保留（项目入口）|
| README-开始这里.md | / | archived/ | readme-getting-started-archived.md | ⚠️ 已被新 README 替代 |
| Supabase部署指南.md | / | user-guides/ | deployment-guide.md | 📘 用户部署指南 |
| Supabase无后端方案.md | / | technical/ | architecture.md | 🔧 技术架构文档 |
| Supabase方案-完整总结.md | / | archived/ | supabase-summary-archived.md | ⚠️ 内容已整合 |
| 开始使用-Supabase版本.md | / | archived/ | quick-start-archived.md | ⚠️ 已被新指南替代 |
| 风控参数提取完整指南.md | / | user-guides/ | parameter-extraction.md | 📘 用户操作指南 |
| 本地部署vs云端部署对比.md | / | reference/ | deployment-comparison.md | 📑 参考对比 |
| TARGET_RED_PACKETS.md | / | reference/ | target-packets.md | 📑 业务配置参考 |
| PROJECT_STATUS.md | / | project/ | status-report.md | 📊 项目状态报告 |
| SYSTEM_AUDIT_REPORT.md | / | project/ | audit-report.md | 📊 系统审计报告 |
| FIXES_COMPLETED.md | / | project/ | fixes-log.md | 📊 修复日志 |
| CODE_CLEANUP_PLAN.md | / | project/ | cleanup-plan.md | 📊 清理计划 |
| CODE_CLEANUP_CHANGES.md | / | project/ | cleanup-changes.md | 📊 清理变更 |
| CODE_CLEANUP_SUMMARY.md | / | project/ | cleanup-summary.md | 📊 清理总结 |
| FINAL_CLEANUP_REPORT.md | / | project/ | cleanup-final-report.md | 📊 最终清理报告 |
| DOCUMENTATION_INDEX.md | / | reference/ | doc-index.md | 📑 文档索引 |
| DOCUMENTATION_OPTIMIZATION_REPORT.md | / | project/ | doc-optimization-report.md | 📊 文档优化报告 |
| Attributions.md | / | reference/ | attributions.md | 📑 版权声明 |

---

### Step 3: 创建目录结构

**操作**: 创建所需的文件夹

**命令**:
```bash
# 创建主目录结构
mkdir -p docs/user-guides
mkdir -p docs/technical/api
mkdir -p docs/project
mkdir -p docs/reference
mkdir -p docs/archived

# 验证目录创建
tree docs -L 2
```

**预期结构**:
```
docs/
├── user-guides/
├── technical/
│   └── api/
├── project/
├── reference/
└── archived/
```

---

### Step 4: 重命名文件

**原则**:
- 统一使用小写
- 使用连字符分隔
- 英文命名
- 简洁明确

**重命名对照表** (部分示例):

| 原文件名 | 新文件名 | 变更原因 |
|---------|---------|---------|
| Supabase部署指南.md | deployment-guide.md | 中文→英文，规范化 |
| 风控参数提取完整指南.md | parameter-extraction.md | 中文→英文，简化 |
| TARGET_RED_PACKETS.md | target-packets.md | 大写→小写 |
| PROJECT_STATUS.md | status-report.md | 大写→小写，语义化 |
| CODE_CLEANUP_PLAN.md | cleanup-plan.md | 大写→小写，简化 |

---

### Step 5: 移动文件

**原则**:
- 先创建目标目录
- 再移动文件
- 保留原文件备份（可选）

**移动脚本** (示例):
```bash
#!/bin/bash

# 用户文档
mv "Supabase部署指南.md" "docs/user-guides/deployment-guide.md"
mv "风控参数提取完整指南.md" "docs/user-guides/parameter-extraction.md"

# 技术文档
mv "Supabase无后端方案.md" "docs/technical/architecture.md"

# 项目文档
mv "PROJECT_STATUS.md" "docs/project/status-report.md"
mv "SYSTEM_AUDIT_REPORT.md" "docs/project/audit-report.md"
mv "FIXES_COMPLETED.md" "docs/project/fixes-log.md"
mv "CODE_CLEANUP_PLAN.md" "docs/project/cleanup-plan.md"
mv "CODE_CLEANUP_CHANGES.md" "docs/project/cleanup-changes.md"
mv "CODE_CLEANUP_SUMMARY.md" "docs/project/cleanup-summary.md"
mv "FINAL_CLEANUP_REPORT.md" "docs/project/cleanup-final-report.md"
mv "DOCUMENTATION_OPTIMIZATION_REPORT.md" "docs/project/doc-optimization-report.md"

# 参考文档
mv "TARGET_RED_PACKETS.md" "docs/reference/target-packets.md"
mv "DOCUMENTATION_INDEX.md" "docs/reference/doc-index.md"
mv "本地部署vs云端部署对比.md" "docs/reference/deployment-comparison.md"
mv "Attributions.md" "docs/reference/attributions.md"

# 归档文档
mv "README-开始这里.md" "docs/archived/readme-getting-started-archived.md"
mv "Supabase方案-完整总结.md" "docs/archived/supabase-summary-archived.md"
mv "开始使用-Supabase版本.md" "docs/archived/quick-start-archived.md"

echo "文件移动完成！"
```

---

### Step 6: 更新链接

**目的**: 确保所有文档内部链接正确

**需要更新的文件**:
1. README.md
2. 所有索引文件（各目录的 README.md）
3. 包含交叉引用的文档

**链接更新规则**:

**旧链接**:
```markdown
[部署指南](./Supabase部署指南.md)
[参数提取](./风控参数提取完整指南.md)
[项目状态](./PROJECT_STATUS.md)
```

**新链接**:
```markdown
[部署指南](./docs/user-guides/deployment-guide.md)
[参数提取](./docs/user-guides/parameter-extraction.md)
[项目状态](./docs/project/status-report.md)
```

**自动化更新**:
```bash
# 使用 sed 批量替换（谨慎使用）
sed -i 's|Supabase部署指南.md|docs/user-guides/deployment-guide.md|g' README.md
sed -i 's|风控参数提取完整指南.md|docs/user-guides/parameter-extraction.md|g' README.md
# ... 更多替换
```

---

### Step 7: 验证完整性

**检查项**:

```markdown
✅ 1. 目录结构正确
   - 5 个分类目录存在
   - 每个目录有 README.md

✅ 2. 文件都已移动
   - 根目录只剩 README.md
   - 所有文档在相应分类目录

✅ 3. 文件命名规范
   - 全部小写
   - 使用连字符
   - 英文命名

✅ 4. 链接都正确
   - README.md 链接有效
   - 索引文件链接有效
   - 交叉引用链接有效

✅ 5. 索引文件完整
   - 每个目录有索引
   - 索引列出所有文档
   - 索引描述准确
```

**验证命令**:
```bash
# 检查根目录文档数量（应该只有 README.md）
ls -la /*.md | wc -l

# 检查各分类目录
ls docs/user-guides/
ls docs/technical/
ls docs/project/
ls docs/reference/
ls docs/archived/

# 检查链接有效性（需要工具）
markdown-link-check README.md
```

---

## 🤖 自动化归类规则

### 规则定义文件

创建配置文件：`docs-classification-rules.json`

```json
{
  "version": "1.0.0",
  "rules": [
    {
      "id": "rule-01",
      "name": "用户指南识别",
      "condition": {
        "filename_contains": ["部署", "使用", "指南", "教程", "guide", "tutorial"],
        "or": {
          "content_contains": ["如何", "步骤", "操作", "配置"]
        }
      },
      "action": {
        "move_to": "docs/user-guides/",
        "rename_pattern": "{type}-{description}.md"
      }
    },
    {
      "id": "rule-02",
      "name": "API 文档识别",
      "condition": {
        "filename_contains": ["api", "接口", "interface"],
        "location": "docs/api-analysis/"
      },
      "action": {
        "move_to": "docs/technical/api/",
        "rename_pattern": "api-{name}.md"
      }
    },
    {
      "id": "rule-03",
      "name": "项目报告识别",
      "condition": {
        "filename_contains": ["report", "status", "audit", "cleanup", "fixes"],
        "or": {
          "filename_uppercase": true
        }
      },
      "action": {
        "move_to": "docs/project/",
        "rename_pattern": "{type}-{suffix}.md",
        "lowercase": true
      }
    },
    {
      "id": "rule-04",
      "name": "参考文档识别",
      "condition": {
        "filename_contains": ["target", "config", "reference", "index", "comparison"],
        "or": {
          "is_configuration": true
        }
      },
      "action": {
        "move_to": "docs/reference/",
        "rename_pattern": "{name}.md",
        "lowercase": true
      }
    },
    {
      "id": "rule-05",
      "name": "归档文档识别",
      "condition": {
        "or": [
          {"filename_contains": ["archived", "deprecated", "old"]},
          {"is_duplicate": true},
          {"last_modified": "older_than_6_months"}
        ]
      },
      "action": {
        "move_to": "docs/archived/",
        "rename_pattern": "{original-name}-archived.md",
        "add_deprecation_notice": true
      }
    }
  ],
  "naming_conventions": {
    "lowercase": true,
    "separator": "-",
    "remove_spaces": true,
    "max_length": 50,
    "allowed_chars": "a-z0-9-"
  },
  "directory_structure": {
    "base": "docs/",
    "categories": [
      "user-guides",
      "technical",
      "project",
      "reference",
      "archived"
    ]
  }
}
```

### 自动化脚本

**Node.js 实现** (`auto-classify-docs.js`):

```javascript
const fs = require('fs');
const path = require('path');

// 读取规则配置
const rules = require('./docs-classification-rules.json');

// 文档分类器
class DocumentClassifier {
  constructor(rulesConfig) {
    this.rules = rulesConfig.rules;
    this.namingConventions = rulesConfig.naming_conventions;
  }

  // 检查文件是否匹配规则
  matchesRule(filename, content, rule) {
    const condition = rule.condition;
    
    // 检查文件名包含
    if (condition.filename_contains) {
      const matches = condition.filename_contains.some(keyword =>
        filename.toLowerCase().includes(keyword.toLowerCase())
      );
      if (matches) return true;
    }

    // 检查内容包含
    if (condition.content_contains) {
      const matches = condition.content_contains.some(keyword =>
        content.includes(keyword)
      );
      if (matches) return true;
    }

    // 检查大写
    if (condition.filename_uppercase) {
      if (filename === filename.toUpperCase()) return true;
    }

    return false;
  }

  // 应用命名规范
  applyNamingConvention(filename) {
    let newName = filename;

    if (this.namingConventions.lowercase) {
      newName = newName.toLowerCase();
    }

    if (this.namingConventions.remove_spaces) {
      newName = newName.replace(/\s+/g, this.namingConventions.separator);
    }

    // 只保留允许的字符
    const allowedPattern = new RegExp(`[^${this.namingConventions.allowed_chars}.]`, 'g');
    newName = newName.replace(allowedPattern, '');

    return newName;
  }

  // 分类单个文档
  classifyDocument(filepath) {
    const filename = path.basename(filepath);
    const content = fs.readFileSync(filepath, 'utf8');

    // 遍历规则
    for (const rule of this.rules) {
      if (this.matchesRule(filename, content, rule)) {
        const newFilename = this.applyNamingConvention(filename);
        const targetPath = path.join(rule.action.move_to, newFilename);

        return {
          original: filepath,
          target: targetPath,
          rule: rule.name,
          action: rule.action
        };
      }
    }

    return null;
  }

  // 批量分类
  classifyAll(sourceDir) {
    const files = fs.readdirSync(sourceDir)
      .filter(file => file.endsWith('.md'))
      .filter(file => file !== 'README.md'); // 保留 README.md

    const classifications = [];

    for (const file of files) {
      const filepath = path.join(sourceDir, file);
      const result = this.classifyDocument(filepath);
      
      if (result) {
        classifications.push(result);
      }
    }

    return classifications;
  }

  // 执行移动
  executeClassifications(classifications, dryRun = true) {
    for (const item of classifications) {
      console.log(`[${item.rule}] ${item.original} -> ${item.target}`);

      if (!dryRun) {
        // 确保目标目录存在
        const targetDir = path.dirname(item.target);
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }

        // 移动文件
        fs.renameSync(item.original, item.target);
      }
    }

    console.log(`\n总计: ${classifications.length} 个文档`);
    console.log(dryRun ? '(预览模式，未实际移动)' : '(已完成移动)');
  }
}

// 使用示例
const classifier = new DocumentClassifier(rules);
const classifications = classifier.classifyAll('/');

// 预览
console.log('=== 文档分类预览 ===\n');
classifier.executeClassifications(classifications, true);

// 执行（取消注释以实际执行）
// classifier.executeClassifications(classifications, false);
```

### 使用方法

```bash
# 1. 预览分类结果
node auto-classify-docs.js

# 2. 实际执行分类（修改脚本，将 dryRun 设为 false）
node auto-classify-docs.js

# 3. 验证结果
tree docs/
```

---

## 🔍 检索和管理机制

### 1. 索引系统

#### 总索引文件

**位置**: `docs/README.md`

**内容结构**:
```markdown
# 📚 文档中心

## 快速导航

- [用户指南](./user-guides/) - 部署、使用、配置
- [技术文档](./technical/) - 架构、API、安全
- [项目文档](./project/) - 状态、审计、日志
- [参考文档](./reference/) - 配置、索引、对比
- [归档文档](./archived/) - 历史文档

## 文档地图

### 🌟 新用户必读
1. [快速开始](./user-guides/quick-start.md)
2. [部署指南](./user-guides/deployment-guide.md)
3. [参数提取](./user-guides/parameter-extraction.md)

### 🔧 开发者文档
1. [架构设计](./technical/architecture.md)
2. [API 文档](./technical/api/)
3. [安全分析](./technical/security-analysis.md)

### 📊 项目管理
1. [项目状态](./project/status-report.md)
2. [审计报告](./project/audit-report.md)
3. [修复日志](./project/fixes-log.md)

## 按主题查找

### 部署相关
- [部署指南](./user-guides/deployment-guide.md)
- [部署对比](./reference/deployment-comparison.md)

### API 相关
- [API 索引](./technical/api/README.md)
- [兑换 API](./technical/api/exchange-api.md)
- [列表 API](./technical/api/list-api.md)

### 风控相关
- [参数提取](./user-guides/parameter-extraction.md)
- [AWSC 组件](./technical/api/awsc-components.md)
- [成功案例](./technical/api/success-analysis.md)
```

#### 分类索引文件

每个分类目录都有自己的 `README.md`

**示例**: `docs/user-guides/README.md`

```markdown
# 📘 用户指南

面向最终用户的使用文档。

## 文档列表

| 文档 | 说明 | 难度 | 时长 |
|------|------|------|------|
| [快速开始](./quick-start.md) | 3分钟快速了解 | ⭐ | 3min |
| [部署指南](./deployment-guide.md) | 详细部署步骤 | ⭐⭐ | 30min |
| [参数提取](./parameter-extraction.md) | 风控参数提取 | ⭐⭐⭐ | 15min |
| [常见问题](./faq.md) | 问题排查 | ⭐ | 10min |

## 推荐阅读顺序

```
第1步: 快速开始 (3分钟)
   ↓
第2步: 部署指南 (30分钟)
   ↓
第3步: 参数提取 (15分钟)
   ↓
第4步: 开始使用 ✅
```

## 相关文档

- [技术文档](../technical/) - 开发者资料
- [项目文档](../project/) - 项目状态
- [参考文档](../reference/) - 配置参数
```

---

### 2. 搜索机制

#### 文件名搜索

```bash
# 按文件名查找
find docs/ -name "*deployment*"
find docs/ -name "*api*"

# 按类型查找
find docs/user-guides/ -name "*.md"
find docs/technical/api/ -name "*.md"
```

#### 内容搜索

```bash
# 搜索包含特定关键词的文档
grep -r "Supabase" docs/
grep -r "风控" docs/ --include="*.md"

# 使用 ag (The Silver Searcher)
ag "部署" docs/
ag "API" docs/technical/
```

#### 使用文档搜索工具

**推荐工具**:
1. **ripgrep** (rg) - 快速搜索
2. **fzf** - 模糊查找
3. **fd** - 快速文件查找

```bash
# 安装 ripgrep
brew install ripgrep  # macOS
apt install ripgrep   # Ubuntu

# 搜索示例
rg "部署步骤" docs/
rg -i "api" docs/ --type md  # 忽略大小写
```

---

### 3. 标签系统

在每个文档开头添加元数据：

```markdown
---
title: "部署指南"
category: "user-guides"
tags: ["deployment", "supabase", "setup"]
difficulty: "medium"
time: "30min"
version: "1.0.0"
last_updated: "2025-11-13"
---

# 部署指南

...
```

**标签查询**:
```bash
# 查找所有部署相关文档
grep -r "tags:.*deployment" docs/

# 查找难度为 medium 的文档
grep -r "difficulty: \"medium\"" docs/
```

---

### 4. 版本控制

#### Git 追踪

```bash
# 查看文档变更历史
git log -- docs/user-guides/deployment-guide.md

# 查看文档差异
git diff HEAD~1 docs/user-guides/deployment-guide.md

# 恢复文档
git checkout HEAD~1 -- docs/user-guides/deployment-guide.md
```

#### 变更日志

在 `docs/project/changelog.md` 中记录：

```markdown
# 文档变更日志

## 2025-11-13

### 新增
- 创建文档归类系统
- 添加 docs/ 目录结构

### 修改
- 重命名所有文档为英文
- 更新 README.md 中的链接

### 移动
- 所有用户文档 → docs/user-guides/
- 所有技术文档 → docs/technical/
- 所有项目文档 → docs/project/

### 归档
- README-开始这里.md → archived/
- Supabase方案-完整总结.md → archived/
```

---

### 5. 文档维护

#### 定期审查

**每月审查**:
```markdown
- [ ] 检查文档是否过时
- [ ] 更新版本号和日期
- [ ] 验证所有链接有效
- [ ] 检查代码示例可执行
- [ ] 更新变更日志
```

#### 质量检查

```bash
# 检查损坏的链接
markdown-link-check docs/**/*.md

# 检查拼写错误
aspell check docs/**/*.md

# 检查 Markdown 格式
markdownlint docs/**/*.md
```

#### 自动化维护

**GitHub Actions** 示例：

```yaml
# .github/workflows/docs-check.yml
name: Docs Check

on:
  push:
    paths:
      - 'docs/**'

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Check Links
        uses: gaurav-nelson/github-action-markdown-link-check@v1
        with:
          folder-path: 'docs'
          
      - name: Lint Markdown
        run: |
          npm install -g markdownlint-cli
          markdownlint 'docs/**/*.md'
```

---

## 🚀 执行步骤

### 快速执行（手动）

```bash
# 1. 创建目录结构
mkdir -p docs/{user-guides,technical/api,project,reference,archived}

# 2. 移动和重命名（用户文档）
mv "Supabase部署指南.md" "docs/user-guides/deployment-guide.md"
mv "风控参数提取完整指南.md" "docs/user-guides/parameter-extraction.md"

# 3. 移动和重命名（技术文档）
mv "Supabase无后端方案.md" "docs/technical/architecture.md"

# 4. 移动和重命名（项目文档）
mv "PROJECT_STATUS.md" "docs/project/status-report.md"
mv "SYSTEM_AUDIT_REPORT.md" "docs/project/audit-report.md"
mv "FIXES_COMPLETED.md" "docs/project/fixes-log.md"
mv "CODE_CLEANUP_PLAN.md" "docs/project/cleanup-plan.md"
mv "CODE_CLEANUP_CHANGES.md" "docs/project/cleanup-changes.md"
mv "CODE_CLEANUP_SUMMARY.md" "docs/project/cleanup-summary.md"
mv "FINAL_CLEANUP_REPORT.md" "docs/project/cleanup-final-report.md"
mv "DOCUMENTATION_OPTIMIZATION_REPORT.md" "docs/project/doc-optimization-report.md"

# 5. 移动和重命名（参考文档）
mv "TARGET_RED_PACKETS.md" "docs/reference/target-packets.md"
mv "DOCUMENTATION_INDEX.md" "docs/reference/doc-index.md"
mv "本地部署vs云端部署对比.md" "docs/reference/deployment-comparison.md"
mv "Attributions.md" "docs/reference/attributions.md"

# 6. 移动和重命名（归档文档）
mv "README-开始这里.md" "docs/archived/readme-getting-started-archived.md"
mv "Supabase方案-完整总结.md" "docs/archived/supabase-summary-archived.md"
mv "开始使用-Supabase版本.md" "docs/archived/quick-start-archived.md"

# 7. 移动 API 分析文档
mv docs/api-analysis/* docs/technical/api/
rmdir docs/api-analysis

# 8. 验证
tree docs/
ls -la /*.md  # 应该只剩 README.md

echo "✅ 文档归类完成！"
```

---

### 完整执行（推荐）

按照本文档的 [归类流程](#-归类流程) 章节，逐步执行 Step 1-7。

---

## ✅ 验证清单

### 归类后验证

```markdown
- [ ] 根目录只剩 README.md
- [ ] docs/ 目录包含 5 个分类子目录
- [ ] 每个子目录都有 README.md 索引
- [ ] 所有文档已按规则重命名
- [ ] README.md 中的链接已更新
- [ ] 所有索引文件已创建
- [ ] 文档可以正常访问
- [ ] 链接都有效
- [ ] Git 提交记录清晰
```

### 质量检查

```markdown
- [ ] 文件命名符合规范（小写、连字符）
- [ ] 目录结构清晰（不超过 3 层）
- [ ] 分类合理（每个文档归类正确）
- [ ] 索引完整（所有文档都被索引）
- [ ] 搜索方便（可以快速找到文档）
```

---

## 📊 归类效果评估

### 归类前 vs 归类后

| 指标 | 归类前 | 归类后 | 提升 |
|------|-------|-------|------|
| 根目录文档数 | 19个 | 1个 | -95% |
| 查找时间 | 2-3分钟 | 10-30秒 | -75% |
| 组织性 | ⭐⭐ | ⭐⭐⭐⭐⭐ | +150% |
| 维护便利性 | ⭐⭐ | ⭐⭐⭐⭐⭐ | +150% |
| 扩展性 | ⭐⭐ | ⭐⭐⭐⭐⭐ | +150% |

---

## 🎉 总结

### 核心原则

```
1. 分类清晰：5 大类别，职责明确
2. 层级合理：最多 3 层，不过度嵌套
3. 命名规范：小写英文，连字符分隔
4. 索引完整：每层都有索引文件
5. 便于检索：多种搜索方式
6. 易于维护：自动化工具支持
```

### 最佳实践

```
✅ 保持根目录简洁（只有 README.md）
✅ 使用标准化的目录命名
✅ 每个目录都有索引文件
✅ 文档命名使用英文
✅ 定期审查和更新
✅ 使用 Git 追踪变更
✅ 添加元数据标签
✅ 自动化检查链接
```

---

<div align="center">

**📁 文档归类指导完成！**

**遵循本指导，打造清晰有序的文档体系！**

</div>

---

**文档版本**: 1.0.0  
**创建时间**: 2025-11-13  
**适用范围**: 天猫礼享金抢购系统文档管理  
**维护状态**: ✅ 持续维护
