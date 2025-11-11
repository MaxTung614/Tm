"""
设置服务
"""
import json
from pathlib import Path
from loguru import logger
from datetime import datetime

from backend.utils.cookie_storage import CookieStorage


class SettingsService:
    """设置服务类"""
    
    def __init__(self):
        self.settings_file = Path("data/settings.json")
        self.settings_file.parent.mkdir(parents=True, exist_ok=True)
        self.cookie_storage = CookieStorage()
        self._load_settings()
    
    def _load_settings(self):
        """加载设置"""
        try:
            if self.settings_file.exists():
                with open(self.settings_file, 'r', encoding='utf-8') as f:
                    self.settings = json.load(f)
            else:
                # 默认设置
                self.settings = {
                    "notifications": {
                        "grabSuccess": True,
                        "grabFailed": True,
                        "taskComplete": True
                    },
                    "autoRefresh": {
                        "enabled": True,
                        "interval": 30
                    },
                    "advanced": {
                        "maxRetries": 3,
                        "timeout": 10
                    }
                }
                self._save_settings()
        except Exception as e:
            logger.error(f"加载设置失败: {str(e)}")
            self.settings = {}
    
    def _save_settings(self):
        """保存设置"""
        try:
            with open(self.settings_file, 'w', encoding='utf-8') as f:
                json.dump(self.settings, f, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.error(f"保存设置失败: {str(e)}")
    
    async def get_settings(self) -> dict:
        """获取设置"""
        return self.settings
    
    async def update_settings(self, new_settings: dict):
        """更新设置"""
        try:
            self.settings.update(new_settings)
            self._save_settings()
            logger.info("设置已更新")
        except Exception as e:
            logger.error(f"更新设置失败: {str(e)}")
            raise
    
    async def update_cookie(self, cookie: str):
        """更新 Cookie"""
        try:
            self.cookie_storage.save_cookie(cookie)
            logger.info("Cookie 已更新")
        except Exception as e:
            logger.error(f"更新 Cookie 失败: {str(e)}")
            raise
    
    async def export_data(self) -> dict:
        """导出数据"""
        try:
            return {
                "settings": self.settings,
                "exportTime": datetime.now().isoformat(),
                "version": "1.0.0"
            }
        except Exception as e:
            logger.error(f"导出数据失败: {str(e)}")
            raise
