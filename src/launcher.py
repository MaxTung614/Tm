#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
天猫礼享金抢购系统 - 启动器
用于启动后端服务并自动打开浏览器
"""

import os
import sys
import time
import webbrowser
import threading
from pathlib import Path

# 设置工作目录
if getattr(sys, 'frozen', False):
    # 如果是打包后的程序
    application_path = sys._MEIPASS
    os.chdir(application_path)
else:
    # 如果是开发环境
    application_path = os.path.dirname(os.path.abspath(__file__))

# 添加项目路径到 sys.path
sys.path.insert(0, application_path)


def check_port(port=8000):
    """检查端口是否被占用"""
    import socket
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    result = sock.connect_ex(('127.0.0.1', port))
    sock.close()
    return result == 0


def kill_process_on_port(port=8000):
    """终止占用端口的进程"""
    import psutil
    for proc in psutil.process_iter(['pid', 'name', 'connections']):
        try:
            connections = proc.connections()
            for conn in connections:
                if conn.laddr.port == port:
                    proc.kill()
                    print(f"已终止进程 {proc.info['name']} (PID: {proc.info['pid']})")
                    return True
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass
    return False


def open_browser(url="http://localhost:5173", delay=3):
    """延迟打开浏览器"""
    time.sleep(delay)
    print(f"\n🚀 正在打开浏览器: {url}")
    webbrowser.open(url)


def start_backend():
    """启动后端服务"""
    import uvicorn
    from backend.main import app
    
    print("="*60)
    print("🎉 天猫礼享金抢购系统")
    print("="*60)
    print("\n📡 正在启动后端服务...")
    
    # 检查端口
    if check_port(8000):
        print("⚠️  端口 8000 已被占用，正在尝试终止...")
        if kill_process_on_port(8000):
            time.sleep(1)
        else:
            print("❌ 无法终止占用进程，请手动关闭")
            input("按回车键退出...")
            sys.exit(1)
    
    # 在后台线程中打开浏览器
    browser_thread = threading.Thread(target=open_browser)
    browser_thread.daemon = True
    browser_thread.start()
    
    print("\n✅ 后端服务已启动")
    print(f"📍 后端地址: http://localhost:8000")
    print(f"📍 前端地址: http://localhost:5173")
    print(f"📍 API 文档: http://localhost:8000/docs")
    print("\n💡 提示: 浏览器将在 3 秒后自动打开")
    print("🛑 按 Ctrl+C 停止服务\n")
    print("="*60 + "\n")
    
    # 启动 uvicorn
    try:
        uvicorn.run(
            app,
            host="0.0.0.0",
            port=8000,
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\n\n👋 正在关闭服务...")
        sys.exit(0)


def main():
    """主函数"""
    try:
        # 确保数据目录存在
        data_dir = Path("data")
        data_dir.mkdir(exist_ok=True)
        
        # 确保风控参数文件存在
        risk_params_file = data_dir / "risk_params.json"
        if not risk_params_file.exists():
            import json
            default_params = {
                "ua": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "umidToken": "",
                "asac": "2A21B24LA1SI0HB0EEVN03"
            }
            with open(risk_params_file, 'w', encoding='utf-8') as f:
                json.dump(default_params, f, indent=2, ensure_ascii=False)
            print(f"✅ 已创建默认配置文件: {risk_params_file}")
        
        # 启动后端
        start_backend()
        
    except Exception as e:
        print(f"\n❌ 启动失败: {e}")
        import traceback
        traceback.print_exc()
        input("\n按回车键退出...")
        sys.exit(1)


if __name__ == "__main__":
    main()
