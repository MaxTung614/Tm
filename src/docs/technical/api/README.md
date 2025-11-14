# 📡 API 文档

所有 API 接口的详细文档。

## 核心 API

| API | 说明 | 重要性 |
|-----|------|--------|
| [兑换 API](./core-exchange-api.md) | 红包兑换接口 | ⭐⭐⭐⭐⭐ |
| [列表 API](./redpacket-list-api.md) | 红包列表接口 | ⭐⭐⭐⭐⭐ |
| [用户 API](./user-info-api.md) | 用户信息接口 | ⭐⭐⭐⭐ |

## 风控分析

| 文档 | 说明 | 重要性 |
|------|------|--------|
| [AWSC 组件](./awsc-security-components.md) | 阿里风控组件详解 | ⭐⭐⭐⭐⭐ |
| [成功案例](./success-comparison.md) | 成功兑换案例分析 | ⭐⭐⭐⭐⭐ |
| [UMID 指纹](./umid-device-fingerprint.md) | 设备指纹详解 | ⭐⭐⭐⭐ |
| [辅助模块](./auxiliary-modules.md) | 辅助模块分析 | ⭐⭐⭐ |

## 实现指南

| 文档 | 说明 |
|------|------|
| [实现清单](./implementation-checklist.md) | 功能实现检查清单 |
| [请求示例](./complete-request-example.md) | 完整请求示例 |
| [接口验证](./interface-verification.md) | 接口验证方法 |
| [快速验证](./quick-verification.md) | 快速验证指南 |

## 抓包分析

| 文档 | 说明 |
|------|------|
| [成功记录](./success-capture-records.md) | 成功抓包记录 |
| [对比分析](./success-vs-failure-comparison.md) | 成功失败对比 |
| [性能跟踪](./performance-tracking.md) | 性能分析 |
| [抓包使用](./real-packet-capture-usage.md) | 抓包数据使用指南 |

## 推荐阅读顺序

### 新手开发者
```
1. 成功案例分析 (success-comparison.md)
2. 核心兑换 API (core-exchange-api.md)
3. AWSC 组件详解 (awsc-security-components.md)
4. 实现清单 (implementation-checklist.md)
```

### 高级开发者
```
1. AWSC 组件详解 (awsc-security-components.md)
2. 所有 API 文档
3. 抓包分析系列
4. 性能优化
```

---

**最后更新**: 2025-11-13  
**文档数量**: 15份  
**来源**: 基于10个真实抓包和2次成功兑换分析
