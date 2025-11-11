# 打包指南 - 创建独立可执行文件

## 📦 目录

1. [打包概述](#打包概述)
2. [环境准备](#环境准备)
3. [自动打包（推荐）](#自动打包推荐)
4. [手动打包](#手动打包)
5. [打包文件说明](#打包文件说明)
6. [分发指南](#分发指南)
7. [常见问题](#常见问题)

---

## 📦 打包概述

本项目支持将前后端打包成单个 `.exe` 可执行文件（Windows）或可执行程序（Linux/Mac），用户无需安装 Python、Node.js 等环境即可一键启动。

### 打包方案

```
前端 (React + Vite)
    ↓ npm run build
前端静态文件 (dist/)
    ↓
    +
    ↓
后端 (FastAPI + Python)
    ↓ PyInstaller
单个可执行文件 (TmallGiftSnatcher.exe)
```

### 技术栈

- **前端打包**: Vite Build
- **后端打包**: PyInstaller
- **启动器**: Python Launcher
- **自动化**: Batch/Shell 脚本

---

## 💻 环境准备

### 必需软件

1. **Python 3.10+**
   ```bash
   # 验证安装
   python --version
   # 应输出: Python 3.10.x 或更高
   ```

2. **Node.js 18+**
   ```bash
   # 验证安装
   node --version
   # 应输出: v18.x.x 或更高
   ```

3. **Poetry**
   ```bash
   # 验证安装
   poetry --version
   
   # 如果未安装
   # Windows (PowerShell 管理员)
   (Invoke-WebRequest -Uri https://install.python-poetry.org -UseBasicParsing).Content | python -
   
   # Linux/Mac
   curl -sSL https://install.python-poetry.org | python3 -
   ```

### 可选工具

- **UPX** (可执行文件压缩)
  - 下载: https://upx.github.io/
  - 将 upx.exe 添加到系统 PATH

---

## 🚀 自动打包（推荐）

### Windows 用户

```bash
# 1. 双击运行打包脚本
build.bat

# 或在命令行运行
.\build.bat
```

### Linux/Mac 用户

```bash
# 1. 添加执行权限
chmod +x build.sh

# 2. 运行打包脚本
./build.sh
```

### 打包过程

脚本会自动完成以下步骤：

```
[1/5] 📦 安装 Python 依赖
      ↓ poetry install
      
[2/5] 📦 安装 Node.js 依赖
      ↓ npm install
      
[3/5] 🔨 构建前端项目
      ↓ npm run build
      ↓ 生成 dist/ 目录
      
[4/5] 📦 安装 PyInstaller
      ↓ poetry add pyinstaller psutil --group dev
      
[5/5] 📦 打包应用程序
      ↓ pyinstaller build.spec --clean
      ↓ 生成 dist/TmallGiftSnatcher.exe
```

### 打包完成

```
========================================
🎉 打包成功！
========================================

📦 可执行文件位置: dist\TmallGiftSnatcher.exe

💡 使用方法:
   1. 双击 TmallGiftSnatcher.exe 启动程序
   2. 浏览器会自动打开
   3. 开始使用系统
```

---

## 🔧 手动打包

如果自动打包失败，可以手动执行以下步骤：

### 步骤 1: 安装依赖

```bash
# Python 依赖
poetry install

# Node.js 依赖
npm install

# PyInstaller
poetry add pyinstaller psutil --group dev
```

### 步骤 2: 构建前端

```bash
# 构建前端静态文件
npm run build

# 验证构建结果
# 应生成 dist/ 目录，包含 index.html 和 assets/
```

### 步骤 3: 打包应用

```bash
# 使用 build.spec 配置文件打包
poetry run pyinstaller build.spec --clean

# 或使用命令行参数
poetry run pyinstaller launcher.py ^
    --name TmallGiftSnatcher ^
    --onefile ^
    --add-data "dist;dist" ^
    --add-data "data;data" ^
    --add-data "TSDK;TSDK" ^
    --add-data "backend;backend" ^
    --hidden-import uvicorn ^
    --hidden-import uvicorn.logging ^
    --hidden-import uvicorn.loops.auto ^
    --hidden-import uvicorn.protocols.http.auto ^
    --hidden-import uvicorn.protocols.websockets.auto ^
    --hidden-import uvicorn.lifespan.on ^
    --console
```

### 步骤 4: 测试可执行文件

```bash
# 运行测试
cd dist
TmallGiftSnatcher.exe

# 验证功能
# 1. 检查后端是否启动（http://localhost:8000）
# 2. 检查浏览器是否自动打开
# 3. 测试登录功能
# 4. 测试抢购功能
```

---

## 📄 打包文件说明

### 核心文件

#### 1. `build.spec`
PyInstaller 配置文件，定义打包规则：

```python
# 主要配置
- name: 'TmallGiftSnatcher'  # 可执行文件名
- console: True              # 显示控制台窗口
- onefile: True              # 单文件打包
- datas: [...]               # 包含的数据文件
- hiddenimports: [...]       # 隐藏导入的模块
```

#### 2. `launcher.py`
启动器脚本，负责：

```python
def main():
    # 1. 检查端口占用
    check_port(8000)
    
    # 2. 创建必要目录和配置
    setup_directories()
    
    # 3. 启动后端服务
    start_backend()
    
    # 4. 自动打开浏览器
    open_browser()
```

#### 3. `build.bat` / `build.sh`
自动化打包脚本，一键完成所有步骤。

---

### 目录结构

```
项目根目录/
├── launcher.py          # 启动器
├── build.spec           # PyInstaller 配置
├── build.bat            # Windows 打包脚本
├── build.sh             # Linux/Mac 打包脚本
│
├── dist/                # 前端构建输出
│   ├── index.html
│   └── assets/
│
├── backend/             # 后端代码
├── TSDK/                # TSDK 模块
├── data/                # 数据目录
│
└── dist/                # PyInstaller 输出
    └── TmallGiftSnatcher.exe  # 最终可执行文件
```

---

## 📦 分发指南

### 创建分发包

#### 最小分发包

```
TmallGiftSnatcher/
├── TmallGiftSnatcher.exe    # 主程序
├── data/                     # 数据目录（可选）
│   └── risk_params.json     # 风控参数配置
└── README.txt               # 使用说明
```

#### 完整分发包

```
TmallGiftSnatcher/
├── TmallGiftSnatcher.exe    # 主程序
├── data/
│   └── risk_params.json
├── tools/                    # 工具集（可选）
│   ├── umid_token_extractor.py
│   └── validate_params.py
├── docs/                     # 文档（可选）
│   ├── USER_GUIDE.md
│   └── FAQ.md
└── README.txt
```

### 创建安装包

#### 方式 1: ZIP 压缩包

```bash
# 创建压缩包
zip -r TmallGiftSnatcher-v1.0.0.zip dist/TmallGiftSnatcher.exe data/ README.txt

# 或使用 7-Zip
7z a TmallGiftSnatcher-v1.0.0.7z dist/TmallGiftSnatcher.exe data/ README.txt
```

#### 方式 2: NSIS 安装程序（高级）

```nsis
; 使用 NSIS 创建安装程序
!include "MUI2.nsh"

Name "天猫礼享金抢购系统"
OutFile "TmallGiftSnatcher_Setup.exe"
InstallDir "$PROGRAMFILES\TmallGiftSnatcher"

Section "安装"
    SetOutPath $INSTDIR
    File "dist\TmallGiftSnatcher.exe"
    File /r "data"
    CreateShortcut "$DESKTOP\天猫礼享金抢购.lnk" "$INSTDIR\TmallGiftSnatcher.exe"
SectionEnd
```

---

## 🎯 优化建议

### 1. 减小文件体积

#### 使用 UPX 压缩

```bash
# 在 build.spec 中启用 UPX
exe = EXE(
    ...
    upx=True,
    upx_exclude=[],
)
```

#### 排除不必要的模块

```python
# 在 build.spec 中排除
excludes=[
    'matplotlib',
    'numpy',
    'pandas',
    'scipy',
    'tkinter',
],
```

### 2. 提高启动速度

#### 使用 bootloader cache

```bash
# 设置环境变量
set PYINSTALLER_COMPILE_BOOTLOADER=1
```

#### 禁用不必要的优化

```python
# 在 build.spec 中
strip=False,  # 不剥离调试符号
```

### 3. 增强兼容性

#### 包含运行时库

```bash
# 在打包时包含 VC++ 运行时
poetry run pyinstaller build.spec --runtime-hook runtime-hook.py
```

---

## ❓ 常见问题

### Q1: 打包失败，提示找不到模块？

**解决方案**:

```python
# 在 build.spec 中添加隐藏导入
hiddenimports=[
    'missing_module',
    'missing_module.submodule',
]
```

### Q2: 运行时提示缺少 DLL？

**解决方案**:

```bash
# 安装 VC++ 运行时
# 下载: https://aka.ms/vs/17/release/vc_redist.x64.exe

# 或在打包时包含
binaries=[
    ('path/to/dll', '.'),
]
```

### Q3: 打包后文件太大？

**解决方案**:

```bash
# 1. 使用 UPX 压缩
upx=True

# 2. 排除不必要的模块
excludes=['matplotlib', 'numpy']

# 3. 使用 --onefile 模式
--onefile
```

### Q4: 无法访问前端页面？

**解决方案**:

```bash
# 1. 确保前端已构建
npm run build

# 2. 检查 dist 目录是否包含在打包中
datas=[('dist', 'dist')]

# 3. 检查 FastAPI 静态文件路径
app.mount("/", StaticFiles(directory="dist"), name="static")
```

### Q5: 启动后立即闪退？

**解决方案**:

```python
# 在 build.spec 中启用控制台
console=True

# 或在 launcher.py 中添加异常捕获
try:
    start_backend()
except Exception as e:
    print(f"错误: {e}")
    input("按回车退出...")
```

### Q6: 杀毒软件误报？

**解决方案**:

```bash
# 1. 添加代码签名
signtool sign /f certificate.pfx /p password TmallGiftSnatcher.exe

# 2. 向杀毒软件厂商提交白名单申请

# 3. 在 README 中说明
```

### Q7: 不同电脑运行报错？

**解决方案**:

```python
# 使用 --runtime-tmpdir 指定临时目录
runtime_tmpdir=None  # 使用系统默认

# 或指定固定目录
runtime_tmpdir='temp'
```

---

## 🔒 安全考虑

### 1. 代码签名

```bash
# Windows 代码签名
signtool sign /f certificate.pfx /p password /t http://timestamp.server TmallGiftSnatcher.exe

# macOS 代码签名
codesign -s "Developer ID" TmallGiftSnatcher
```

### 2. 加密保护

```python
# 在 build.spec 中启用加密
cipher=block_cipher  # 使用密码保护
```

### 3. 完整性校验

```bash
# 生成 SHA256 校验和
certutil -hashfile TmallGiftSnatcher.exe SHA256

# 或使用 PowerShell
Get-FileHash TmallGiftSnatcher.exe -Algorithm SHA256
```

---

## 📊 打包性能对比

| 模式 | 文件大小 | 启动速度 | 兼容性 |
|------|---------|---------|--------|
| --onefile | ~50MB | 较慢 | 最好 |
| --onedir | ~80MB | 快 | 好 |
| + UPX | ~30MB | 中等 | 中等 |

---

## 🎓 进阶技巧

### 自定义图标

```python
# 在 build.spec 中
exe = EXE(
    ...
    icon='assets/icon.ico'  # 256x256 .ico 文件
)
```

### 添加版本信息

```python
# 创建 version_info.txt
VSVersionInfo(
  ffi=FixedFileInfo(
    filevers=(1, 0, 0, 0),
    prodvers=(1, 0, 0, 0),
    ...
  ),
  ...
)

# 在打包时使用
--version-file version_info.txt
```

### 多平台打包

```bash
# 在各平台上分别打包

# Windows
build.bat

# Linux
./build.sh

# macOS
./build.sh

# 生成对应平台的可执行文件
```

---

## 📝 分发清单

打包完成后，分发前的检查清单：

- [ ] 测试可执行文件是否正常运行
- [ ] 验证所有功能是否正常
- [ ] 检查文件大小是否合理
- [ ] 准备 README 和使用文档
- [ ] 创建压缩包或安装程序
- [ ] 生成 SHA256 校验和
- [ ] 准备更新日志
- [ ] 测试不同 Windows 版本兼容性

---

## 🎉 总结

使用本打包方案，您可以：

✅ 一键自动化打包  
✅ 生成独立可执行文件  
✅ 无需用户配置环境  
✅ 支持多平台分发  
✅ 便于版本管理和更新  

**祝您打包顺利！** 🚀
