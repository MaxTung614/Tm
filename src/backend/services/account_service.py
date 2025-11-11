"""
多账号管理服务
"""
import json
import os
from datetime import datetime
from pathlib import Path
from typing import List, Optional, Dict
from loguru import logger


class AccountService:
    """账号管理服务类"""
    
    def __init__(self):
        self.accounts_dir = Path("data/accounts")
        self.current_account_file = Path("data/current_account.json")
        self._ensure_dirs()
    
    def _ensure_dirs(self):
        """确保目录存在"""
        self.accounts_dir.mkdir(parents=True, exist_ok=True)
    
    def get_all_accounts(self) -> List[Dict]:
        """
        获取所有账号列表
        """
        try:
            accounts = []
            
            for account_file in self.accounts_dir.glob("*.json"):
                try:
                    with open(account_file, 'r', encoding='utf-8') as f:
                        account_data = json.load(f)
                        accounts.append({
                            "account_id": account_data.get("account_id", account_file.stem),
                            "account_name": account_data.get("account_name", account_file.stem),
                            "login_time": account_data.get("login_time", "未知"),
                            "last_used": account_data.get("last_used", "未使用"),
                            "status": account_data.get("status", "active"),
                            "notes": account_data.get("notes", "")
                        })
                except Exception as e:
                    logger.error(f"读取账号文件失败 {account_file}: {str(e)}")
                    continue
            
            # 按最后使用时间排序
            accounts.sort(key=lambda x: x.get("last_used", ""), reverse=True)
            
            logger.info(f"获取到 {len(accounts)} 个账号")
            return accounts
        except Exception as e:
            logger.error(f"获取账号列表失败: {str(e)}")
            return []
    
    def get_account(self, account_id: str) -> Optional[Dict]:
        """
        获取指定账号信息
        """
        try:
            account_file = self.accounts_dir / f"{account_id}.json"
            
            if not account_file.exists():
                logger.warning(f"账号不存在: {account_id}")
                return None
            
            with open(account_file, 'r', encoding='utf-8') as f:
                account_data = json.load(f)
            
            logger.info(f"获取账号信息: {account_id}")
            return account_data
        except Exception as e:
            logger.error(f"获取账号信息失败: {str(e)}")
            return None
    
    def save_account(self, account_id: str, account_data: Dict) -> bool:
        """
        保存账号信息
        """
        try:
            account_file = self.accounts_dir / f"{account_id}.json"
            
            # 补充默认字段
            if "account_id" not in account_data:
                account_data["account_id"] = account_id
            if "status" not in account_data:
                account_data["status"] = "active"
            if "last_used" not in account_data:
                account_data["last_used"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            
            # 更新时间
            account_data["updated_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            
            with open(account_file, 'w', encoding='utf-8') as f:
                json.dump(account_data, f, ensure_ascii=False, indent=2)
            
            logger.success(f"保存账号成功: {account_id}")
            return True
        except Exception as e:
            logger.error(f"保存账号失败: {str(e)}")
            return False
    
    def delete_account(self, account_id: str) -> bool:
        """
        删除账号
        """
        try:
            account_file = self.accounts_dir / f"{account_id}.json"
            
            if not account_file.exists():
                logger.warning(f"账号不存在: {account_id}")
                return False
            
            account_file.unlink()
            logger.success(f"删除账号成功: {account_id}")
            return True
        except Exception as e:
            logger.error(f"删除账号失败: {str(e)}")
            return False
    
    def switch_account(self, account_id: str) -> bool:
        """
        切换到指定账号
        """
        try:
            # 获取账号信息
            account_data = self.get_account(account_id)
            if not account_data:
                logger.error(f"账号不存在: {account_id}")
                return False
            
            # 保存为当前账号
            with open(self.current_account_file, 'w', encoding='utf-8') as f:
                json.dump(account_data, f, ensure_ascii=False, indent=2)
            
            # 更新最后使用时间
            account_data["last_used"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            self.save_account(account_id, account_data)
            
            logger.success(f"切换账号成功: {account_id}")
            return True
        except Exception as e:
            logger.error(f"切换账号失败: {str(e)}")
            return False
    
    def get_current_account(self) -> Optional[Dict]:
        """
        获取当前使用的账号
        """
        try:
            if not self.current_account_file.exists():
                logger.warning("当前没有活跃账号")
                return None
            
            with open(self.current_account_file, 'r', encoding='utf-8') as f:
                account_data = json.load(f)
            
            logger.info(f"当前账号: {account_data.get('account_id', '未知')}")
            return account_data
        except Exception as e:
            logger.error(f"获取当前账号失败: {str(e)}")
            return None
    
    def get_current_cookie(self) -> Optional[str]:
        """
        获取当前账号的 Cookie
        """
        try:
            account_data = self.get_current_account()
            if not account_data:
                return None
            
            cookie = account_data.get("cookies", "")
            if not cookie:
                logger.warning("当前账号没有 Cookie")
                return None
            
            return cookie
        except Exception as e:
            logger.error(f"获取当前 Cookie 失败: {str(e)}")
            return None
    
    def add_account_from_qrcode(self, account_name: str, cookies: str, notes: str = "") -> Optional[str]:
        """
        从扫码登录添加账号
        """
        try:
            # 生成账号ID
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            account_id = f"account_{timestamp}"
            
            # 构建账号数据
            account_data = {
                "account_id": account_id,
                "account_name": account_name or f"账号_{timestamp}",
                "cookies": cookies,
                "login_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "last_used": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "status": "active",
                "notes": notes
            }
            
            # 保存账号
            if self.save_account(account_id, account_data):
                logger.success(f"添加账号成功: {account_id} ({account_name})")
                return account_id
            else:
                return None
        except Exception as e:
            logger.error(f"添加账号失败: {str(e)}")
            return None
    
    def update_account_cookie(self, account_id: str, cookies: str) -> bool:
        """
        更新账号的 Cookie
        """
        try:
            account_data = self.get_account(account_id)
            if not account_data:
                logger.error(f"账号不存在: {account_id}")
                return False
            
            # 更新 Cookie 和登录时间
            account_data["cookies"] = cookies
            account_data["login_time"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            
            return self.save_account(account_id, account_data)
        except Exception as e:
            logger.error(f"更新 Cookie 失败: {str(e)}")
            return False
    
    def validate_account(self, account_id: str) -> Dict:
        """
        验证账号状态
        """
        try:
            account_data = self.get_account(account_id)
            if not account_data:
                return {
                    "valid": False,
                    "message": "账号不存在"
                }
            
            # 检查 Cookie 是否存在
            if not account_data.get("cookies"):
                return {
                    "valid": False,
                    "message": "Cookie 不存在"
                }
            
            # 检查状态
            if account_data.get("status") != "active":
                return {
                    "valid": False,
                    "message": f"账号状态异常: {account_data.get('status')}"
                }
            
            return {
                "valid": True,
                "message": "账号正常",
                "account_data": account_data
            }
        except Exception as e:
            logger.error(f"验证账号失败: {str(e)}")
            return {
                "valid": False,
                "message": str(e)
            }
