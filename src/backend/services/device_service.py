"""
设备管理服务 - 支持多设备风控参数管理
"""
import json
import os
from datetime import datetime
from pathlib import Path
from typing import List, Optional, Dict
from loguru import logger


class DeviceService:
    """设备管理服务类"""
    
    def __init__(self):
        self.devices_dir = Path("data/devices")
        self.default_device_file = Path("data/devices/device_default.json")
        self._ensure_dirs()
    
    def _ensure_dirs(self):
        """确保目录存在"""
        self.devices_dir.mkdir(parents=True, exist_ok=True)
    
    def get_all_devices(self) -> List[Dict]:
        """
        获取所有设备列表
        """
        try:
            devices = []
            
            for device_file in self.devices_dir.glob("*.json"):
                try:
                    with open(device_file, 'r', encoding='utf-8') as f:
                        device_data = json.load(f)
                        devices.append({
                            "device_id": device_data.get("device_id", device_file.stem),
                            "device_name": device_data.get("device_name", device_file.stem),
                            "device_model": device_data.get("device_model", "未知"),
                            "os_version": device_data.get("os_version", "未知"),
                            "created_at": device_data.get("created_at", "未知"),
                            "last_updated": device_data.get("last_updated", "未使用"),
                            "status": device_data.get("status", "active")
                        })
                except Exception as e:
                    logger.error(f"读取设备文件失败 {device_file}: {str(e)}")
                    continue
            
            # 按创建时间排序
            devices.sort(key=lambda x: x.get("created_at", ""), reverse=True)
            
            logger.info(f"获取到 {len(devices)} 个设备")
            return devices
        except Exception as e:
            logger.error(f"获取设备列表失败: {str(e)}")
            return []
    
    def get_device(self, device_id: str) -> Optional[Dict]:
        """
        获取指定设备信息
        """
        try:
            device_file = self.devices_dir / f"{device_id}.json"
            
            if not device_file.exists():
                logger.warning(f"设备不存在: {device_id}")
                return None
            
            with open(device_file, 'r', encoding='utf-8') as f:
                device_data = json.load(f)
            
            logger.info(f"获取设备信息: {device_id}")
            return device_data
        except Exception as e:
            logger.error(f"获取设备信息失败: {str(e)}")
            return None
    
    def save_device(self, device_id: str, device_data: Dict) -> bool:
        """
        保存设备信息
        """
        try:
            device_file = self.devices_dir / f"{device_id}.json"
            
            # 补充默认字段
            if "device_id" not in device_data:
                device_data["device_id"] = device_id
            if "status" not in device_data:
                device_data["status"] = "active"
            if "created_at" not in device_data:
                device_data["created_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            
            # 更新时间
            device_data["last_updated"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            
            with open(device_file, 'w', encoding='utf-8') as f:
                json.dump(device_data, f, ensure_ascii=False, indent=2)
            
            logger.success(f"保存设备成功: {device_id}")
            return True
        except Exception as e:
            logger.error(f"保存设备失败: {str(e)}")
            return False
    
    def delete_device(self, device_id: str) -> bool:
        """
        删除设备
        """
        try:
            device_file = self.devices_dir / f"{device_id}.json"
            
            if not device_file.exists():
                logger.warning(f"设备不存在: {device_id}")
                return False
            
            device_file.unlink()
            logger.success(f"删除设备成功: {device_id}")
            return True
        except Exception as e:
            logger.error(f"删除设备失败: {str(e)}")
            return False
    
    def add_device(self, device_name: str, umid_token: str, ua: str, 
                   device_model: str = "", os_version: str = "", 
                   asac: str = "2A21B24LA1SI0HB0EEVN03") -> Optional[str]:
        """
        添加新设备
        """
        try:
            # 生成设备ID
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            device_id = f"device_{timestamp}"
            
            # 构建设备数据
            device_data = {
                "device_id": device_id,
                "device_name": device_name or f"设备_{timestamp}",
                "device_model": device_model or "未知型号",
                "os_version": os_version or "未知版本",
                "umidToken": umid_token,
                "ua": ua,
                "asac": asac,
                "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "status": "active"
            }
            
            # 保存设备
            if self.save_device(device_id, device_data):
                logger.success(f"添加设备成功: {device_id} ({device_name})")
                return device_id
            else:
                return None
        except Exception as e:
            logger.error(f"添加设备失败: {str(e)}")
            return None
    
    def get_device_params(self, device_id: str) -> Optional[Dict]:
        """
        获取设备的风控参数
        """
        try:
            device = self.get_device(device_id)
            if not device:
                return None
            
            return {
                "umidToken": device.get("umidToken", ""),
                "ua": device.get("ua", ""),
                "asac": device.get("asac", "2A21B24LA1SI0HB0EEVN03")
            }
        except Exception as e:
            logger.error(f"获取设备参数失败: {str(e)}")
            return None
    
    def get_default_device(self) -> Optional[Dict]:
        """
        获取默认设备（向后兼容）
        """
        try:
            # 1. 尝试从 devices 目录获取默认设备
            if self.default_device_file.exists():
                with open(self.default_device_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            
            # 2. 尝试从旧的 risk_params.json 获取
            old_params_file = Path("data/risk_params.json")
            if old_params_file.exists():
                with open(old_params_file, 'r', encoding='utf-8') as f:
                    old_params = json.load(f)
                
                # 迁移到新格式
                device_data = {
                    "device_id": "device_default",
                    "device_name": "默认设备",
                    "device_model": old_params.get("device_info", "未知"),
                    "umidToken": old_params.get("umidToken", ""),
                    "ua": old_params.get("ua", ""),
                    "asac": old_params.get("asac", "2A21B24LA1SI0HB0EEVN03"),
                    "migrated_from": "risk_params.json"
                }
                
                self.save_device("device_default", device_data)
                logger.info("已从 risk_params.json 迁移设备配置")
                return device_data
            
            # 3. 返回 None
            logger.warning("没有找到默认设备")
            return None
        except Exception as e:
            logger.error(f"获取默认设备失败: {str(e)}")
            return None
    
    def auto_detect_and_extract(self, user_agent: str, cookies: str) -> Optional[Dict]:
        """
        自动检测并提取设备参数
        从登录请求中自动提取
        """
        try:
            # 1. 从 User-Agent 中提取设备信息
            device_info = self._parse_user_agent(user_agent)
            
            # 2. 从 cookies 中提取 umidToken
            umid_token = self._extract_umid_from_cookies(cookies)
            
            if not umid_token:
                logger.warning("无法从 cookies 中提取 umidToken")
                return None
            
            # 3. 构建参数
            params = {
                "umidToken": umid_token,
                "ua": user_agent,
                "asac": "2A21B24LA1SI0HB0EEVN03",
                "device_info": device_info
            }
            
            logger.success("自动提取设备参数成功")
            return params
        except Exception as e:
            logger.error(f"自动提取失败: {str(e)}")
            return None
    
    def _parse_user_agent(self, ua: str) -> Dict:
        """
        解析 User-Agent 获取设备信息
        """
        device_info = {
            "platform": "未知",
            "model": "未知",
            "os_version": "未知"
        }
        
        try:
            ua_lower = ua.lower()
            
            # 检测平台
            if 'iphone' in ua_lower:
                device_info["platform"] = "iOS"
                # 提取型号
                if 'iphone' in ua_lower:
                    device_info["model"] = "iPhone"
                # 提取版本
                import re
                version_match = re.search(r'os (\d+[_\d]*)', ua_lower)
                if version_match:
                    device_info["os_version"] = f"iOS {version_match.group(1).replace('_', '.')}"
            
            elif 'android' in ua_lower:
                device_info["platform"] = "Android"
                # 提取版本
                import re
                version_match = re.search(r'android (\d+[\.\d]*)', ua_lower)
                if version_match:
                    device_info["os_version"] = f"Android {version_match.group(1)}"
            
            elif 'windows' in ua_lower:
                device_info["platform"] = "Windows"
                device_info["model"] = "PC"
            
            elif 'mac' in ua_lower:
                device_info["platform"] = "macOS"
                device_info["model"] = "Mac"
        
        except Exception as e:
            logger.warning(f"解析 User-Agent 失败: {str(e)}")
        
        return device_info
    
    def _extract_umid_from_cookies(self, cookies: str) -> Optional[str]:
        """
        从 cookies 中提取 umidToken
        """
        try:
            # cookies 格式: "key1=value1; key2=value2; ..."
            cookie_dict = {}
            for item in cookies.split(';'):
                item = item.strip()
                if '=' in item:
                    key, value = item.split('=', 1)
                    cookie_dict[key.strip()] = value.strip()
            
            # 查找 umidToken 相关的 cookie
            # 常见的 key: _m_h5_tk, _m_h5_tk_enc, etc.
            umid_keys = ['_m_h5_tk', '_m_h5_tk_enc', 'umidToken']
            
            for key in umid_keys:
                if key in cookie_dict:
                    return cookie_dict[key]
            
            logger.warning("未找到 umidToken 相关的 cookie")
            return None
        except Exception as e:
            logger.error(f"提取 umidToken 失败: {str(e)}")
            return None
