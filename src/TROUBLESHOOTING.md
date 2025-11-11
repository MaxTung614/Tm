# 🔧 故障排除指南

## 🎯 快速诊断

### 第一步：运行环境诊断工具

```bash
# 双击运行此文件
check_environment.bat

# 它会自动检查:
# ✅ Python 是否安装
# ✅ Node.js 是否安装
# ✅ Poetry 是否安装
# ✅ 依赖是否完整
# ✅ 配置文件是否存在
```

---

## ❌ 问题 1: start.bat 闪退

### 可能原因
1. Python 未安装或未添加到 PATH
2. Node.js 未安装
3. Poetry 未安装
4. 权限不足

### 解决方案

#### 方案 A：检查环境（推荐）

```bash
# 1. 双击运行环境诊断
check_environment.bat

# 2. 按照提示安装缺失的软件

# 3. 安装完成后重试
start.bat
```

#### 方案 B：使用简易启动（无需 Poetry）

```bash
# 双击运行
start_simple.bat

# 此脚本会:
# - 自动创建虚拟环境
# - 使用 pip 安装依赖
# - 无需 Poetry
```

#### 方案 C：手动检查

```bash
# 打开命令行（cmd），依次输入:

# 检查 Python
python --version
# 应显示: Python 3.10.x 或更高

# 检查 Node.js
node --version
# 应显示: v18.x.x 或更高

# 检查 Poetry（可选）
poetry --version
# 应显示: Poetry (version x.x.x)
```

#### 方案 D：使用打包版

```bash
# 如果不想配置环境，直接打包成 .exe
build.bat

# 生成后直接运行
dist\TmallGiftSnatcher.exe
```

---

## ❌ 问题 2: Python 未安装或未找到

### 症状
```
'python' 不是内部或外部命令
```

### 解决方案

#### 1. 安装 Python

```
1. 访问 https://www.python.org/downloads/
2. 下载 Python 3.10 或更高版本
3. 运行安装程序
4. ⚠️ 重要：勾选 "Add Python to PATH"
5. 点击 "Install Now"
6. 等待安装完成
```

#### 2. 验证安装

```bash
# 重启命令行窗口
# 输入:
python --version

# 应显示版本号
```

#### 3. 手动添加到 PATH（如果忘记勾选）

```
1. 找到 Python 安装目录
   通常在: C:\Users\你的用户名\AppData\Local\Programs\Python\Python310\

2. 右键 "此电脑" → "属性"
3. 点击 "高级系统设置"
4. 点击 "环境变量"
5. 在 "系统变量" 中找到 "Path"
6. 点击 "编辑" → "新建"
7. 添加 Python 安装路径
8. 添加 Python Scripts 路径
   例如: C:\Users\你的用户名\AppData\Local\Programs\Python\Python310\Scripts\
9. 点击 "确定"
10. 重启命令行
```

---

## ❌ 问题 3: Node.js 未安装或未找到

### 症状
```
'node' 不是内部或外部命令
```

### 解决方案

#### 1. 安装 Node.js

```
1. 访问 https://nodejs.org/
2. 下载 LTS（长期支持）版本
3. 运行安装程序
4. 默认选项安装即可
5. 等待安装完成
```

#### 2. 验证安装

```bash
# 重启命令行窗口
# 输入:
node --version
npm --version

# 都应显示版本号
```

---

## ❌ 问题 4: Poetry 未安装

### 症状
```
'poetry' 不是内部或外部命令
```

### 解决方案

#### 方案 A：安装 Poetry（推荐）

```powershell
# 打开 PowerShell（管理员模式）
# 粘贴并运行:
(Invoke-WebRequest -Uri https://install.python-poetry.org -UseBasicParsing).Content | python -

# 等待安装完成
# 重启命令行
```

#### 方案 B：使用简易启动（无需 Poetry）

```bash
# 直接运行
start_simple.bat

# 此脚本使用 pip 安装依赖，不需要 Poetry
```

---

## ❌ 问题 5: 依赖安装失败

### 症状
```
npm install 失败
或
poetry install 失败
```

### 解决方案

#### 1. 检查网络连接

```bash
# 测试网络
ping www.baidu.com

# 如果无法 ping 通，检查网络连接
```

#### 2. 使用国内镜像

##### Python (pip)
```bash
# 使用阿里云镜像
pip config set global.index-url https://mirrors.aliyun.com/pypi/simple/

# 或使用清华镜像
pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple/
```

##### Node.js (npm)
```bash
# 使用淘宝镜像
npm config set registry https://registry.npmmirror.com
```

#### 3. 手动安装依赖

```bash
# Python 依赖
cd backend
pip install -r requirements.txt

# 如果没有 requirements.txt，手动安装核心依赖:
pip install fastapi uvicorn pydantic requests qrcode pillow python-multipart cryptography

# Node.js 依赖
cd ..
npm install --legacy-peer-deps
```

---

## ❌ 问题 6: 端口被占用

### 症状
```
Address already in use: 8000
或
Port 5173 is in use
```

### 解决方案

#### 方案 A：关闭占用进程

```bash
# Windows: 查找占用端口的进程
netstat -ano | findstr :8000

# 记下 PID（最后一列的数字）
# 在任务管理器中结束该进程
```

#### 方案 B：更改端口

修改启动脚本中的端口：

```bash
# 后端端口（在 start.bat 中）
poetry run uvicorn main:app --reload --port 8001

# 前端端口（在 vite.config.ts 中）
server: {
  port: 5174
}
```

---

## ❌ 问题 7: 前端无法访问

### 症状
```
浏览器打开后显示无法连接
或
页面一直加载
```

### 解决方案

#### 1. 检查服务是否启动

```bash
# 检查前端
# 应该看到类似 "Local: http://localhost:5173" 的输出

# 检查后端
# 访问 http://localhost:8000/docs
# 应该看到 API 文档页面
```

#### 2. 查看错误日志

```bash
# 在命令行窗口中查找红色的错误信息
# 常见错误:
# - 模块未找到 → 重新安装依赖
# - 语法错误 → 检查代码是否完整
# - 端口占用 → 更改端口或关闭占用进程
```

#### 3. 清除缓存重试

```bash
# 清除浏览器缓存
# Chrome: Ctrl + Shift + Delete

# 清除 npm 缓存
npm cache clean --force

# 删除 node_modules 重新安装
rmdir /s /q node_modules
npm install
```

---

## ❌ 问题 8: 扫码登录失败

### 症状
```
二维码无法显示
或
扫码后无响应
```

### 解决方案

#### 1. 检查后端服务

```bash
# 访问 http://localhost:8000/docs
# 确保后端正常运行
```

#### 2. 检查网络

```bash
# 确保可以访问淘宝
ping www.taobao.com

# 确保没有代理干扰
# 关闭 VPN 或代理软件
```

#### 3. 查看控制台日志

```bash
# 在浏览器中按 F12
# 切换到 Console 标签
# 查看是否有错误信息
```

---

## ❌ 问题 9: 打包失败

### 症状
```
build.bat 运行失败
或
PyInstaller 报错
```

### 解决方案

#### 1. 检查前端是否构建

```bash
# 先构建前端
npm run build

# 检查是否生成 dist 目录
dir dist

# 应该看到 index.html 和 assets 目录
```

#### 2. 检查 PyInstaller

```bash
# 安装 PyInstaller
poetry add pyinstaller --group dev

# 或使用 pip
pip install pyinstaller
```

#### 3. 查看详细错误

```bash
# 运行打包并查看详细输出
poetry run pyinstaller build.spec --clean --log-level DEBUG
```

---

## ❌ 问题 10: 杀毒软件拦截

### 症状
```
程序被杀毒软件删除
或
无法运行
```

### 解决方案

#### 1. 添加白名单

```
1. 打开杀毒软件
2. 找到 "信任区" 或 "白名单"
3. 添加项目目录到白名单
4. 添加 TmallGiftSnatcher.exe 到白名单
```

#### 2. 临时关闭杀毒软件

```
⚠️ 注意：仅在信任的环境中关闭
1. 右键杀毒软件图标
2. 选择 "暂时关闭保护"
3. 运行程序
4. 完成后记得重新开启
```

---

## 🆘 仍然无法解决？

### 收集诊断信息

请收集以下信息：

```bash
# 1. 运行环境诊断
check_environment.bat > 诊断结果.txt

# 2. 记录错误信息
# 复制命令行中的所有红色错误文字

# 3. 系统信息
systeminfo > 系统信息.txt
```

### 提交问题

1. **GitHub Issues**
   - 创建新 Issue
   - 附上诊断信息
   - 描述详细步骤

2. **包含信息**
   - 操作系统版本
   - Python 版本
   - Node.js 版本
   - 完整错误日志
   - 已尝试的解决方案

---

## 📚 相关文档

- [快速上手指南](./QUICK_START_GUIDE.md) - 基础使用教程
- [用户操作指南](./USER_GUIDE.md) - 详细功能说明
- [打包分发指南](./PACKAGING_GUIDE.md) - 打包相关问题

---

## 💡 预防建议

### 1. 定期更新

```bash
# 更新依赖
poetry update
npm update
```

### 2. 备份配置

```bash
# 备份重要文件
copy data\risk_params.json data\risk_params.json.bak
```

### 3. 查看日志

```bash
# 定期检查日志
dir data\logs
```

---

<div align="center">

**遇到问题不要慌，按步骤排查就能解决！** 💪

[返回主页](./README.md) | [环境诊断](./check_environment.bat) | [提交问题](https://github.com/issues)

</div>
