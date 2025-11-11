"""
风控参数管理服务
"""
import json
from pathlib import Path
from loguru import logger
from typing import Optional, Dict, Any
from datetime import datetime, timedelta


class RiskParamsService:
    """风控参数管理服务"""
    
    def __init__(self):
        self.params_file = Path("data/risk_params.json")
        self.params_file.parent.mkdir(parents=True, exist_ok=True)
        self._load_params()
    
    def _load_params(self):
        """加载风控参数"""
        try:
            if self.params_file.exists():
                with open(self.params_file, 'r', encoding='utf-8') as f:
                    self.params = json.load(f)
            else:
                # 默认参数结构
                self.params = {
                    "ua": "",
                    "umidToken": "",
                    "asac": "",
                    "lastUpdate": None,
                    "cookies": {
                        "_m_h5_tk": "",
                        "_m_h5_tk_enc": "",
                        "_tb_token_": ""
                    }
                }
                self._save_params()
        except Exception as e:
            logger.error(f"加载风控参数失败: {str(e)}")
            self.params = {}
    
    def _save_params(self):
        """保存风控参数"""
        try:
            self.params["lastUpdate"] = datetime.now().isoformat()
            with open(self.params_file, 'w', encoding='utf-8') as f:
                json.dump(self.params, f, indent=2, ensure_ascii=False)
            logger.info("风控参数已保存")
        except Exception as e:
            logger.error(f"保存风控参数失败: {str(e)}")
    
    async def get_params(self) -> Dict[str, Any]:
        """获取风控参数"""
        return self.params
    
    async def update_params(self, params: Dict[str, Any]):
        """更新风控参数"""
        try:
            # 更新各个字段
            if "ua" in params:
                self.params["ua"] = params["ua"]
            
            if "umidToken" in params:
                self.params["umidToken"] = params["umidToken"]
            
            if "asac" in params:
                self.params["asac"] = params["asac"]
            
            if "cookies" in params:
                self.params["cookies"].update(params["cookies"])
            
            self._save_params()
            logger.success("风控参数更新成功")
        except Exception as e:
            logger.error(f"更新风控参数失败: {str(e)}")
            raise
    
    async def update_ua(self, ua: str):
        """更新 UA（设备指纹）"""
        self.params["ua"] = ua
        self._save_params()
    
    async def update_umid_token(self, umid_token: str):
        """更新 umidToken"""
        self.params["umidToken"] = umid_token
        self._save_params()
    
    async def update_asac(self, asac: str):
        """更新 asac（风控参数）"""
        self.params["asac"] = asac
        self._save_params()
    
    def get_grab_params(self) -> Dict[str, str]:
        """
        获取抢购所需的参数
        
        Returns:
            包含 ua, umidToken, asac 的字典
        """
        return {
            "ua": self.params.get("ua", ""),
            "umidToken": self.params.get("umidToken", ""),
            "asac": self.params.get("asac", "")
        }
    
    def is_params_valid(self) -> bool:
        """
        检查参数是否有效
        
        Returns:
            True 如果所有必需参数都存在
        """
        ua = self.params.get("ua", "")
        umid_token = self.params.get("umidToken", "")
        
        # ua 和 umidToken 是必需的，asac 可以为空（但可能导致失败）
        return bool(ua and umid_token)
    
    def get_validation_status(self) -> Dict[str, Any]:
        """
        获取参数验证状态
        
        Returns:
            参数的完整性和有效性状态
        """
        ua = self.params.get("ua", "")
        umid_token = self.params.get("umidToken", "")
        asac = self.params.get("asac", "")
        
        return {
            "hasUa": bool(ua),
            "hasUmidToken": bool(umid_token),
            "hasAsac": bool(asac),
            "isValid": bool(ua and umid_token),
            "lastUpdate": self.params.get("lastUpdate"),
            "warnings": self._get_warnings()
        }
    
    def _get_warnings(self) -> list:
        """获取警告信息"""
        warnings = []
        
        if not self.params.get("ua"):
            warnings.append("缺少 UA（设备指纹），抢购可能失败")
        
        if not self.params.get("umidToken"):
            warnings.append("缺少 umidToken，抢购可能失败")
        
        if not self.params.get("asac"):
            warnings.append("缺少 asac，可能触发风控")
        
        # 检查更新时间
        last_update = self.params.get("lastUpdate")
        if last_update:
            try:
                update_time = datetime.fromisoformat(last_update)
                if datetime.now() - update_time > timedelta(days=7):
                    warnings.append("参数已超过7天未更新，建议重新提取")
            except:
                pass
        
        return warnings
    
    async def extract_from_cookie(self, cookie_str: str) -> Dict[str, str]:
        """
        从 Cookie 字符串中提取风控相关的值
        
        Args:
            cookie_str: Cookie 字符串
            
        Returns:
            提取到的参数
        """
        try:
            cookies = {}
            for item in cookie_str.split(';'):
                item = item.strip()
                if '=' in item:
                    key, value = item.split('=', 1)
                    cookies[key] = value
            
            extracted = {}
            
            # 提取风控相关的 Cookie
            if '_m_h5_tk' in cookies:
                extracted['_m_h5_tk'] = cookies['_m_h5_tk']
            
            if '_m_h5_tk_enc' in cookies:
                extracted['_m_h5_tk_enc'] = cookies['_m_h5_tk_enc']
            
            if '_tb_token_' in cookies:
                extracted['_tb_token_'] = cookies['_tb_token_']
            
            # 更新到参数中
            if extracted:
                self.params["cookies"].update(extracted)
                self._save_params()
            
            return extracted
        except Exception as e:
            logger.error(f"从 Cookie 提取参数失败: {str(e)}")
            return {}
