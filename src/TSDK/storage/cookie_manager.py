"""
Cookie 安全存储管理器
支持加密存储、自动刷新、多账户管理
"""

from typing import Dict, Optional, List
from pathlib import Path
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
import json
import base64
import hashlib
from cryptography.fernet import Fernet
from loguru import logger


@dataclass
class CookieItem:
    """Cookie 项"""
    name: str
    value: str
    domain: str
    path: str = "/"
    expires: Optional[datetime] = None
    secure: bool = False
    http_only: bool = False


@dataclass
class UserCookies:
    """用户 Cookie 集合"""
    user_id: str
    nick: str
    cookies: List[CookieItem]
    created_at: datetime
    updated_at: datetime
    expires_at: Optional[datetime] = None
    is_valid: bool = True


class CookieManager:
    """Cookie 管理器"""
    
    # 重要的 Cookie 字段
    IMPORTANT_COOKIES = [
        '_m_h5_tk',
        '_m_h5_tk_enc',
        'cookie2',
        '_tb_token_',
        'unb',
        'cookie17',
        '_cc_',
        '_l_g_',
        'sg',
        'cookie1',
        'sgcookie',
        'x5sec',
        'cna',
        'isg',
    ]
    
    def __init__(self, storage_dir: str = "storage/cookies", encryption_key: Optional[str] = None):
        """
        初始化 Cookie 管理器
        
        Args:
            storage_dir: Cookie 存储目录
            encryption_key: 加密密钥（32位字符串），如果不提供则自动生成
        """
        self.storage_dir = Path(storage_dir)
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        
        # 初始化加密
        if encryption_key:
            key = hashlib.sha256(encryption_key.encode()).digest()
            self.cipher = Fernet(base64.urlsafe_b64encode(key))
        else:
            # 自动生成加密密钥
            key_file = self.storage_dir / ".encryption_key"
            if key_file.exists():
                self.cipher = Fernet(key_file.read_bytes())
            else:
                key = Fernet.generate_key()
                key_file.write_bytes(key)
                self.cipher = Fernet(key)
                logger.warning(f"已生成新的加密密钥，保存在: {key_file}")
    
    def save_cookies(self, user_id: str, nick: str, cookies: Dict[str, str], 
                    domain: str = ".taobao.com") -> UserCookies:
        """
        保存用户 Cookie
        
        Args:
            user_id: 用户 ID
            nick: 用户昵称
            cookies: Cookie 字典
            domain: Cookie 域名
        
        Returns:
            UserCookies 对象
        """
        # 过滤重要 Cookie
        cookie_items = []
        for name in self.IMPORTANT_COOKIES:
            if name in cookies:
                cookie_items.append(CookieItem(
                    name=name,
                    value=cookies[name],
                    domain=domain,
                    path="/",
                    expires=datetime.now() + timedelta(days=7)  # 默认7天过期
                ))
        
        # 创建 UserCookies 对象
        user_cookies = UserCookies(
            user_id=user_id,
            nick=nick,
            cookies=cookie_items,
            created_at=datetime.now(),
            updated_at=datetime.now(),
            expires_at=datetime.now() + timedelta(days=7)
        )
        
        # 加密并保存
        self._save_encrypted(user_id, user_cookies)
        
        logger.info(f"已保存用户 {nick}({user_id}) 的 Cookie，共 {len(cookie_items)} 个")
        return user_cookies
    
    def load_cookies(self, user_id: str) -> Optional[UserCookies]:
        """
        加载用户 Cookie
        
        Args:
            user_id: 用户 ID
        
        Returns:
            UserCookies 对象，如果不存在则返回 None
        """
        try:
            user_cookies = self._load_encrypted(user_id)
            
            # 检查是否过期
            if user_cookies.expires_at and user_cookies.expires_at < datetime.now():
                logger.warning(f"用户 {user_id} 的 Cookie 已过期")
                user_cookies.is_valid = False
            
            logger.info(f"加载用户 {user_cookies.nick}({user_id}) 的 Cookie")
            return user_cookies
            
        except FileNotFoundError:
            logger.warning(f"未找到用户 {user_id} 的 Cookie")
            return None
        except Exception as e:
            logger.error(f"加载 Cookie 失败: {e}")
            return None
    
    def update_cookies(self, user_id: str, new_cookies: Dict[str, str]) -> bool:
        """
        更新用户 Cookie
        
        Args:
            user_id: 用户 ID
            new_cookies: 新的 Cookie 字典
        
        Returns:
            是否更新成功
        """
        user_cookies = self.load_cookies(user_id)
        if not user_cookies:
            logger.error(f"用户 {user_id} 的 Cookie 不存在，无法更新")
            return False
        
        # 更新 Cookie 值
        cookie_dict = {c.name: c for c in user_cookies.cookies}
        for name, value in new_cookies.items():
            if name in cookie_dict:
                cookie_dict[name].value = value
            else:
                # 添加新 Cookie
                user_cookies.cookies.append(CookieItem(
                    name=name,
                    value=value,
                    domain=".taobao.com",
                    path="/",
                    expires=datetime.now() + timedelta(days=7)
                ))
        
        user_cookies.updated_at = datetime.now()
        user_cookies.expires_at = datetime.now() + timedelta(days=7)
        user_cookies.is_valid = True
        
        # 保存
        self._save_encrypted(user_id, user_cookies)
        logger.info(f"已更新用户 {user_id} 的 Cookie")
        return True
    
    def delete_cookies(self, user_id: str) -> bool:
        """删除用户 Cookie"""
        cookie_file = self._get_cookie_file(user_id)
        if cookie_file.exists():
            cookie_file.unlink()
            logger.info(f"已删除用户 {user_id} 的 Cookie")
            return True
        return False
    
    def list_users(self) -> List[Dict[str, str]]:
        """列出所有已保存的用户"""
        users = []
        for cookie_file in self.storage_dir.glob("*.enc"):
            user_id = cookie_file.stem
            user_cookies = self.load_cookies(user_id)
            if user_cookies:
                users.append({
                    'user_id': user_cookies.user_id,
                    'nick': user_cookies.nick,
                    'is_valid': user_cookies.is_valid,
                    'expires_at': user_cookies.expires_at.isoformat() if user_cookies.expires_at else None,
                })
        return users
    
    def to_requests_cookies(self, user_id: str) -> Optional[Dict[str, str]]:
        """
        将 UserCookies 转换为 requests 可用的 Cookie 字典
        
        Args:
            user_id: 用户 ID
        
        Returns:
            Cookie 字典
        """
        user_cookies = self.load_cookies(user_id)
        if not user_cookies:
            return None
        
        return {c.name: c.value for c in user_cookies.cookies}
    
    def from_requests_cookies(self, user_id: str, nick: str, 
                             requests_cookies: Dict[str, str]) -> UserCookies:
        """
        从 requests 的 Cookie 字典创建 UserCookies
        
        Args:
            user_id: 用户 ID
            nick: 用户昵称
            requests_cookies: requests 的 Cookie 字典
        
        Returns:
            UserCookies 对象
        """
        return self.save_cookies(user_id, nick, requests_cookies)
    
    def _get_cookie_file(self, user_id: str) -> Path:
        """获取 Cookie 文件路径"""
        return self.storage_dir / f"{user_id}.enc"
    
    def _save_encrypted(self, user_id: str, user_cookies: UserCookies):
        """加密并保存 Cookie"""
        # 转换为 JSON
        data = {
            'user_id': user_cookies.user_id,
            'nick': user_cookies.nick,
            'cookies': [asdict(c) for c in user_cookies.cookies],
            'created_at': user_cookies.created_at.isoformat(),
            'updated_at': user_cookies.updated_at.isoformat(),
            'expires_at': user_cookies.expires_at.isoformat() if user_cookies.expires_at else None,
            'is_valid': user_cookies.is_valid,
        }
        
        json_str = json.dumps(data, ensure_ascii=False)
        
        # 加密
        encrypted = self.cipher.encrypt(json_str.encode('utf-8'))
        
        # 保存
        cookie_file = self._get_cookie_file(user_id)
        cookie_file.write_bytes(encrypted)
    
    def _load_encrypted(self, user_id: str) -> UserCookies:
        """加载并解密 Cookie"""
        cookie_file = self._get_cookie_file(user_id)
        
        # 读取并解密
        encrypted = cookie_file.read_bytes()
        decrypted = self.cipher.decrypt(encrypted)
        
        # 解析 JSON
        data = json.loads(decrypted.decode('utf-8'))
        
        # 重建对象
        cookies = [CookieItem(
            name=c['name'],
            value=c['value'],
            domain=c['domain'],
            path=c['path'],
            expires=datetime.fromisoformat(c['expires']) if c.get('expires') else None,
            secure=c.get('secure', False),
            http_only=c.get('http_only', False),
        ) for c in data['cookies']]
        
        return UserCookies(
            user_id=data['user_id'],
            nick=data['nick'],
            cookies=cookies,
            created_at=datetime.fromisoformat(data['created_at']),
            updated_at=datetime.fromisoformat(data['updated_at']),
            expires_at=datetime.fromisoformat(data['expires_at']) if data.get('expires_at') else None,
            is_valid=data.get('is_valid', True),
        )


if __name__ == "__main__":
    # 测试代码
    manager = CookieManager()
    
    # 保存 Cookie
    test_cookies = {
        '_m_h5_tk': 'test_token_12345',
        'cookie2': 'test_cookie2',
        '_tb_token_': 'test_tb_token',
    }
    
    user_cookies = manager.save_cookies('test_user_001', '测试用户', test_cookies)
    print(f"保存成功: {user_cookies.nick}")
    
    # 加载 Cookie
    loaded = manager.load_cookies('test_user_001')
    if loaded:
        print(f"加载成功: {loaded.nick}")
        print(f"Cookie 数量: {len(loaded.cookies)}")
    
    # 列出所有用户
    users = manager.list_users()
    print(f"用户列表: {users}")
