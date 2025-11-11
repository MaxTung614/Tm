# -*- mode: python ; coding: utf-8 -*-
"""
天猫礼享金抢购系统 - PyInstaller 打包配置
用于将 Python 后端和前端静态文件打包成单个 .exe 文件
"""

import os
import sys
from PyInstaller.utils.hooks import collect_data_files, collect_submodules

# 项目根目录
project_root = os.path.abspath('.')

# 收集所有 backend 模块
backend_modules = collect_submodules('backend')
tsdk_modules = collect_submodules('TSDK')

# 需要包含的数据文件
datas = [
    # 前端构建文件（需要先运行 npm run build）
    ('dist', 'dist'),
    
    # 数据目录
    ('data', 'data'),
    
    # TSDK 模块
    ('TSDK', 'TSDK'),
    
    # 后端模块
    ('backend', 'backend'),
    
    # 配置文件
    ('pyproject.toml', '.'),
]

# 需要包含的隐藏导入
hiddenimports = [
    # FastAPI 相关
    'uvicorn',
    'uvicorn.logging',
    'uvicorn.loops',
    'uvicorn.loops.auto',
    'uvicorn.protocols',
    'uvicorn.protocols.http',
    'uvicorn.protocols.http.auto',
    'uvicorn.protocols.websockets',
    'uvicorn.protocols.websockets.auto',
    'uvicorn.lifespan',
    'uvicorn.lifespan.on',
    
    # Pydantic
    'pydantic',
    'pydantic.fields',
    'pydantic.main',
    
    # 其他依赖
    'qrcode',
    'Pillow',
    'requests',
    'cryptography',
    
] + backend_modules + tsdk_modules

# 分析配置
a = Analysis(
    ['launcher.py'],  # 启动器脚本
    pathex=[project_root],
    binaries=[],
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        'matplotlib',
        'numpy',
        'pandas',
        'scipy',
        'PIL.ImageQt',
    ],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=None,
    noarchive=False,
)

# PYZ 配置（压缩）
pyz = PYZ(a.pure, a.zipped_data, cipher=None)

# EXE 配置
exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='TmallGiftSnatcher',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,  # 显示控制台（方便调试）
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='assets/icon.ico' if os.path.exists('assets/icon.ico') else None,
)
