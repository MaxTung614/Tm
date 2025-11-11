"""
Cookie 存储管理 - 支持多账号
"""
import json
from pathlib import Path
from cryptography.fernet import Fernet
from loguru import logger


class CookieStorage:
    """Cookie 安全存储类 - 支持多账号管理"""
    
    def __init__(self):
        self.data_dir = Path("data")
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
        # 原有的单账号文件（向后兼容）
        self.cookie_file = self.data_dir / "cookie.enc"
        self.key_file = self.data_dir / "key.key"
        
        # 新的多账号文件
        self.current_account_file = self.data_dir / "current_account.json"
        
        # 初始化加密密钥
        self._init_encryption_key()
    
    def _init_encryption_key(self):
        """初始化加密密钥"""
        try:
            if self.key_file.exists():
                with open(self.key_file, 'rb') as f:
                    self.key = f.read()
            else:
                # 生成新密钥
                self.key = Fernet.generate_key()
                with open(self.key_file, 'wb') as f:
                    f.write(self.key)
            
            self.cipher = Fernet(self.key)
        except Exception as e:
            logger.error(f"初始化加密密钥失败: {str(e)}")
            raise
    
    def save_cookie(self, cookie: str):
        """保存 Cookie（加密）- 向后兼容的单账号方式"""
        try:
            # 加密 Cookie
            encrypted_cookie = self.cipher.encrypt(cookie.encode())
            
            # 保存到文件
            with open(self.cookie_file, 'wb') as f:
                f.write(encrypted_cookie)
            
            logger.info("Cookie 已保存")
        except Exception as e:
            logger.error(f"保存 Cookie 失败: {str(e)}")
            raise
    
    def get_cookie(self) -> str:
        """获取 Cookie（解密）- 优先从当前账号获取，否则使用单账号方式"""
        try:
            # 1. 优先尝试从多账号系统获取
            if self.current_account_file.exists():
                try:
                    with open(self.current_account_file, 'r', encoding='utf-8') as f:
                        account_data = json.load(f)
                    
                    cookie = account_data.get("cookies", "")
                    if cookie:
                        logger.info(f"从多账号系统获取 Cookie: {account_data.get('account_name', '未知')}")
                        return cookie
                except Exception as e:
                    logger.warning(f"从多账号系统获取 Cookie 失败，尝试单账号方式: {str(e)}")
            
            # 2. 回退到单账号方式
            if not self.cookie_file.exists():
                logger.warning("没有找到 Cookie")
                return None
            
            # 读取加密的 Cookie
            with open(self.cookie_file, 'rb') as f:
                encrypted_cookie = f.read()
            
            # 解密
            cookie = self.cipher.decrypt(encrypted_cookie).decode()
            logger.info("从单账号文件获取 Cookie")
            
            return cookie
        except Exception as e:
            logger.error(f"获取 Cookie 失败: {str(e)}")
            return None
    
    def clear_cookie(self):
        """清除 Cookie"""
        try:
            if self.cookie_file.exists():
                self.cookie_file.unlink()
            if self.current_account_file.exists():
                self.current_account_file.unlink()
            logger.info("Cookie 已清除")
        except Exception as e:
            logger.error(f"清除 Cookie 失败: {str(e)}")
            raise