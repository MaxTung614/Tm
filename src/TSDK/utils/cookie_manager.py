"""
Cookie 持久化存储管理模块
支持加密存储、自动加载、过期检测等功能
"""

import json
import os
import base64
from pathlib import Path
from typing import Dict, Optional, Any
from datetime import datetime, timedelta
from cryptography.fernet import Fernet
from loguru import logger


class CookieManager:
    """Cookie管理器 - 负责Cookie的加密存储和加载"""
    
    def __init__(self, storage_dir: str = "data/cookies", encrypt: bool = True):
        """
        初始化Cookie管理器
        
        Args:
            storage_dir: Cookie存储目录
            encrypt: 是否加密存储
        """
        self.storage_dir = Path(storage_dir)
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        self.encrypt = encrypt
        
        # 加密密钥管理
        self.key_file = self.storage_dir / ".key"
        self._cipher = None
        
        if self.encrypt:
            self._init_encryption()
    
    def _init_encryption(self):
        """初始化加密功能"""
        if self.key_file.exists():
            # 读取现有密钥
            with open(self.key_file, 'rb') as f:
                key = f.read()
        else:
            # 生成新密钥
            key = Fernet.generate_key()
            with open(self.key_file, 'wb') as f:
                f.write(key)
            logger.info(f"生成新的加密密钥: {self.key_file}")
        
        self._cipher = Fernet(key)
    
    def save_cookies(self, user_id: str, cookies: Dict[str, str], 
                     metadata: Optional[Dict[str, Any]] = None) -> bool:
        """
        保存用户Cookie
        
        Args:
            user_id: 用户ID
            cookies: Cookie字典
            metadata: 附加元数据（如登录时间、过期时间等）
            
        Returns:
            是否保存成功
        """
        try:
            # 构建完整的Cookie数据
            cookie_data = {
                'user_id': user_id,
                'cookies': cookies,
                'saved_at': datetime.now().isoformat(),
                'metadata': metadata or {}
            }
            
            # 序列化
            json_data = json.dumps(cookie_data, ensure_ascii=False, indent=2)
            
            # 加密（如果启用）
            if self.encrypt:
                encrypted_data = self._cipher.encrypt(json_data.encode('utf-8'))
                data_to_save = encrypted_data
                file_ext = '.enc'
            else:
                data_to_save = json_data.encode('utf-8')
                file_ext = '.json'
            
            # 保存到文件
            cookie_file = self.storage_dir / f"{user_id}{file_ext}"
            with open(cookie_file, 'wb') as f:
                f.write(data_to_save)
            
            logger.info(f"成功保存用户 {user_id} 的Cookie到 {cookie_file}")
            return True
            
        except Exception as e:
            logger.error(f"保存Cookie失败: {e}")
            return False
    
    def load_cookies(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        加载用户Cookie
        
        Args:
            user_id: 用户ID
            
        Returns:
            Cookie数据字典，失败返回None
        """
        try:
            # 尝试加载加密文件
            cookie_file = self.storage_dir / f"{user_id}.enc"
            if not cookie_file.exists():
                # 尝试加载未加密文件
                cookie_file = self.storage_dir / f"{user_id}.json"
                if not cookie_file.exists():
                    logger.warning(f"用户 {user_id} 的Cookie文件不存在")
                    return None
            
            # 读取文件
            with open(cookie_file, 'rb') as f:
                data = f.read()
            
            # 解密（如果是加密文件）
            if cookie_file.suffix == '.enc' and self.encrypt:
                json_data = self._cipher.decrypt(data).decode('utf-8')
            else:
                json_data = data.decode('utf-8')
            
            # 反序列化
            cookie_data = json.loads(json_data)
            
            logger.info(f"成功加载用户 {user_id} 的Cookie")
            return cookie_data
            
        except Exception as e:
            logger.error(f"加载Cookie失败: {e}")
            return None
    
    def delete_cookies(self, user_id: str) -> bool:
        """
        删除用户Cookie
        
        Args:
            user_id: 用户ID
            
        Returns:
            是否删除成功
        """
        try:
            for ext in ['.enc', '.json']:
                cookie_file = self.storage_dir / f"{user_id}{ext}"
                if cookie_file.exists():
                    cookie_file.unlink()
                    logger.info(f"成功删除用户 {user_id} 的Cookie")
                    return True
            
            logger.warning(f"用户 {user_id} 的Cookie文件不存在")
            return False
            
        except Exception as e:
            logger.error(f"删除Cookie失败: {e}")
            return False
    
    def list_users(self) -> list:
        """
        列出所有已保存Cookie的用户
        
        Returns:
            用户ID列表
        """
        users = set()
        for file in self.storage_dir.glob("*"):
            if file.suffix in ['.enc', '.json']:
                users.add(file.stem)
        return sorted(list(users))
    
    def is_cookie_valid(self, user_id: str, max_age_hours: int = 24) -> bool:
        """
        检查Cookie是否有效（未过期）
        
        Args:
            user_id: 用户ID
            max_age_hours: 最大有效时长（小时）
            
        Returns:
            Cookie是否有效
        """
        cookie_data = self.load_cookies(user_id)
        if not cookie_data:
            return False
        
        saved_at_str = cookie_data.get('saved_at')
        if not saved_at_str:
            return False
        
        saved_at = datetime.fromisoformat(saved_at_str)
        age = datetime.now() - saved_at
        
        return age < timedelta(hours=max_age_hours)
    
    def get_cookie_dict(self, user_id: str) -> Optional[Dict[str, str]]:
        """
        获取纯Cookie字典（仅包含Cookie键值对）
        
        Args:
            user_id: 用户ID
            
        Returns:
            Cookie字典
        """
        cookie_data = self.load_cookies(user_id)
        if cookie_data:
            return cookie_data.get('cookies', {})
        return None
    
    def export_cookie_string(self, user_id: str) -> Optional[str]:
        """
        导出Cookie字符串（浏览器格式）
        
        Args:
            user_id: 用户ID
            
        Returns:
            Cookie字符串，格式: "key1=value1; key2=value2"
        """
        cookies = self.get_cookie_dict(user_id)
        if cookies:
            return '; '.join([f"{k}={v}" for k, v in cookies.items()])
        return None
