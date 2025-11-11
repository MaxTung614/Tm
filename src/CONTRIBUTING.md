# 贡献指南

感谢您考虑为天猫礼享金抢购系统做出贡献！

## 🤝 如何贡献

### 报告问题

如果您发现了 bug 或有功能建议：

1. 检查 [Issues](https://github.com/your-repo/issues) 是否已存在相同问题
2. 如果不存在，创建新的 Issue
3. 清晰描述问题或建议
4. 如果是 bug，请提供复现步骤

### 提交代码

1. **Fork 项目**
   ```bash
   # Fork 后克隆到本地
   git clone https://github.com/your-username/project.git
   cd project
   ```

2. **创建分支**
   ```bash
   # 从 main 分支创建新分支
   git checkout -b feature/your-feature-name
   # 或
   git checkout -b fix/your-bug-fix
   ```

3. **进行修改**
   - 遵循代码规范
   - 添加必要的注释
   - 如果需要，更新文档

4. **测试**
   ```bash
   # 确保代码能正常运行
   python launcher.py
   
   # 运行测试（如果有）
   pytest
   ```

5. **提交**
   ```bash
   git add .
   git commit -m "feat: 添加新功能"
   # 或
   git commit -m "fix: 修复某个bug"
   ```

6. **推送并创建 PR**
   ```bash
   git push origin feature/your-feature-name
   ```
   然后在 GitHub 上创建 Pull Request

## 📝 代码规范

### Python 代码

- 遵循 PEP 8 规范
- 使用类型注解
- 添加文档字符串
- 函数保持简洁（不超过 50 行）

```python
def example_function(param: str) -> dict:
    """
    函数功能说明
    
    Args:
        param: 参数说明
        
    Returns:
        返回值说明
    """
    # 实现代码
    pass
```

### TypeScript/React 代码

- 使用 TypeScript
- 组件使用函数式组件
- 使用 Tailwind CSS 进行样式编写
- Props 必须定义类型

```typescript
interface Props {
  title: string;
  onClose: () => void;
}

export function Component({ title, onClose }: Props) {
  // 组件实现
}
```

## 🎯 提交信息规范

使用语义化提交信息：

- `feat:` 新功能
- `fix:` Bug 修复
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 重构
- `test:` 测试相关
- `chore:` 构建/工具相关

示例：
```
feat: 添加多设备管理功能
fix: 修复 Cookie 过期问题
docs: 更新 README.md
```

## 📂 项目结构

提交代码前，请了解项目结构：

```
├── backend/      # Python 后端
├── components/   # React 组件
├── pages/        # 页面组件
├── TSDK/        # 淘宝 SDK
├── tools/       # 工具脚本
└── docs/        # 文档
```

详见 [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)

## ✅ Pull Request 检查清单

在提交 PR 前，请确认：

- [ ] 代码遵循项目规范
- [ ] 已添加必要的注释和文档
- [ ] 代码能正常运行
- [ ] 没有破坏现有功能
- [ ] 提交信息清晰明确
- [ ] 如果是新功能，已更新文档

## 🚫 不接受的贡献

- 添加未经讨论的大型功能
- 不符合项目目标的修改
- 低质量或未测试的代码
- 违反开源协议的内容

## 💬 交流讨论

- 创建 Issue 讨论大型功能
- 在 PR 中详细说明修改原因
- 保持友好和尊重

## 📄 许可证

贡献的代码将采用与项目相同的 MIT 许可证。

---

再次感谢您的贡献！🎉
