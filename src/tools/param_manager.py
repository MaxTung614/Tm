#!/usr/bin/env python3
"""
风控参数管理工具
"""
import json
import sys
from pathlib import Path
from loguru import logger


class ParamManager:
    """参数管理器"""
    
    def __init__(self, params_file: str = "data/risk_params.json"):
        self.params_file = Path(params_file)
        self.params = self._load_or_create()
    
    def _load_or_create(self) -> dict:
        """加载或创建配置文件"""
        if self.params_file.exists():
            try:
                with open(self.params_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"加载配置失败: {e}")
        
        # 创建默认配置
        return {
            "ua": "",
            "umidToken": "",
            "asac": "",
            "cookies": {},
            "lastUpdate": ""
        }
    
    def save(self):
        """保存配置"""
        try:
            self.params_file.parent.mkdir(parents=True, exist_ok=True)
            
            from datetime import datetime
            self.params["lastUpdate"] = datetime.now().isoformat()
            
            with open(self.params_file, 'w', encoding='utf-8') as f:
                json.dump(self.params, f, indent=2, ensure_ascii=False)
            
            logger.success("✅ 配置已保存")
            
        except Exception as e:
            logger.error(f"保存失败: {e}")
    
    def set_ua(self, ua: str):
        """设置 UA"""
        self.params["ua"] = ua
        self.save()
        logger.success(f"✅ UA 已更新 (长度: {len(ua)})")
    
    def set_umid_token(self, umid: str):
        """设置 umidToken"""
        self.params["umidToken"] = umid
        self.save()
        logger.success(f"✅ umidToken 已更新")
    
    def set_asac(self, asac: str):
        """设置 asac"""
        self.params["asac"] = asac
        self.save()
        logger.success(f"✅ asac 已更新: {asac}")
    
    def set_cookie(self, name: str, value: str):
        """设置单个 Cookie"""
        self.params["cookies"][name] = value
        self.save()
        logger.success(f"✅ Cookie {name} 已更新")
    
    def show(self):
        """显示当前配置"""
        print()
        print("=" * 60)
        print("📊 当前配置")
        print("=" * 60)
        print()
        
        # UA
        ua = self.params.get("ua", "")
        if ua:
            print(f"✅ UA: {ua[:50]}... (长度: {len(ua)})")
        else:
            print("❌ UA: 未配置")
        
        # umidToken
        umid = self.params.get("umidToken", "")
        if umid:
            print(f"✅ umidToken: {umid[:30]}... (长度: {len(umid)})")
        else:
            print("❌ umidToken: 未配置")
        
        # asac
        asac = self.params.get("asac", "")
        if asac:
            print(f"✅ asac: {asac}")
        else:
            print("⚠️  asac: 未配置")
        
        # Cookies
        cookies = self.params.get("cookies", {})
        print(f"\nCookies: {len(cookies)} 个")
        for name, value in cookies.items():
            preview = value[:30] + "..." if len(value) > 30 else value
            print(f"  - {name}: {preview}")
        
        # 最后更新时间
        last_update = self.params.get("lastUpdate", "")
        if last_update:
            print(f"\n最后更新: {last_update}")
        
        print()
    
    def clear(self, param_type: str = "all"):
        """清除参数"""
        if param_type == "all":
            self.params = {
                "ua": "",
                "umidToken": "",
                "asac": "",
                "cookies": {},
                "lastUpdate": ""
            }
            logger.success("✅ 所有参数已清除")
        elif param_type == "ua":
            self.params["ua"] = ""
            logger.success("✅ UA 已清除")
        elif param_type == "umid":
            self.params["umidToken"] = ""
            logger.success("✅ umidToken 已清除")
        elif param_type == "asac":
            self.params["asac"] = ""
            logger.success("✅ asac 已清除")
        elif param_type == "cookies":
            self.params["cookies"] = {}
            logger.success("✅ Cookies 已清除")
        
        self.save()
    
    def import_from_json(self, json_str: str):
        """从 JSON 字符串导入"""
        try:
            data = json.loads(json_str)
            
            if "ua" in data:
                self.params["ua"] = data["ua"]
            if "umidToken" in data:
                self.params["umidToken"] = data["umidToken"]
            if "asac" in data:
                self.params["asac"] = data["asac"]
            if "cookies" in data:
                self.params["cookies"].update(data["cookies"])
            
            self.save()
            logger.success("✅ 导入成功")
            
        except Exception as e:
            logger.error(f"导入失败: {e}")


def print_help():
    """打印帮助信息"""
    print("""
使用方法:

  python param_manager.py <命令> [参数]

命令:

  show              显示当前配置
  set-ua <值>       设置 UA
  set-umid <值>     设置 umidToken
  set-asac <值>     设置 asac
  set-cookie <名称> <值>  设置 Cookie
  clear [类型]      清除参数 (all/ua/umid/asac/cookies)
  validate          验证参数
  help              显示帮助

示例:

  # 显示当前配置
  python param_manager.py show

  # 设置 UA
  python param_manager.py set-ua "Mozilla/5.0..."

  # 设置 umidToken
  python param_manager.py set-umid "T2gA..."

  # 设置 asac
  python param_manager.py set-asac "2A21826A..."

  # 清除所有配置
  python param_manager.py clear all

  # 验证参数
  python param_manager.py validate
    """)


def main():
    """主函数"""
    if len(sys.argv) < 2:
        print_help()
        return
    
    manager = ParamManager()
    command = sys.argv[1].lower()
    
    if command == "show":
        manager.show()
    
    elif command == "set-ua":
        if len(sys.argv) < 3:
            logger.error("请提供 UA 值")
            return
        manager.set_ua(sys.argv[2])
    
    elif command == "set-umid":
        if len(sys.argv) < 3:
            logger.error("请提供 umidToken 值")
            return
        manager.set_umid_token(sys.argv[2])
    
    elif command == "set-asac":
        if len(sys.argv) < 3:
            logger.error("请提供 asac 值")
            return
        manager.set_asac(sys.argv[2])
    
    elif command == "set-cookie":
        if len(sys.argv) < 4:
            logger.error("请提供 Cookie 名称和值")
            return
        manager.set_cookie(sys.argv[2], sys.argv[3])
    
    elif command == "clear":
        param_type = sys.argv[2] if len(sys.argv) > 2 else "all"
        manager.clear(param_type)
    
    elif command == "validate":
        from tools.validate_params import RiskParameterValidator
        validator = RiskParameterValidator()
        validator.validate_all()
        validator.print_report()
    
    elif command == "help":
        print_help()
    
    else:
        logger.error(f"未知命令: {command}")
        print_help()


if __name__ == "__main__":
    main()
