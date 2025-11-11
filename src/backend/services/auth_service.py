"""
认证服务 - 使用真实 TSDK API，支持自动提取设备参数
"""
import uuid
import base64
from io import BytesIO
from datetime import datetime, timedelta
from loguru import logger
from PIL import Image

from TSDK.api.taobao.h5 import TaobaoH5
from backend.utils.cookie_storage import CookieStorage
from backend.services.device_service import DeviceService
from backend.services.account_service import AccountService


class AuthService:
    """认证服务类"""
    
    def __init__(self):
        self.cookie_storage = CookieStorage()
        self.device_service = DeviceService()
        self.account_service = AccountService()
        self.qr_sessions = {}  # 存储二维码会话
        self.h5_instance = None  # TaobaoH5 实例
        
    def _get_h5_instance(self):
        """获取或创建 TaobaoH5 实例"""
        if not self.h5_instance:
            self.h5_instance = TaobaoH5()
            # 如果有保存的 Cookie，加载它
            saved_cookie = self.cookie_storage.get_cookie()
            if saved_cookie:
                self.h5_instance.cookie = saved_cookie
        return self.h5_instance
        
    async def login_with_cookie(self, cookie: str) -> dict:
        """
        使用 Cookie 登录
        """
        try:
            # 保存 Cookie
            self.cookie_storage.save_cookie(cookie)
            
            # 创建 H5 实例并设置 Cookie
            h5 = TaobaoH5()
            h5.cookie = cookie
            self.h5_instance = h5
            
            # 获取用户信息
            user_info = await self.get_user_info()
            
            return user_info
        except Exception as e:
            logger.error(f"Cookie 登录失败: {str(e)}")
            raise
    
    async def get_user_info(self) -> dict:
        """
        获取用户信息 - 使用真实 TSDK API
        """
        try:
            from TSDK.api.taobao.gift import TmallGiftAPI
            
            cookie = self.cookie_storage.get_cookie()
            if not cookie:
                return None
            
            # 使用 TmallGiftAPI 获取用户余额
            gift_api = TmallGiftAPI()
            gift_api.cookie = cookie
            
            # 获取余额信息
            balance_info = gift_api.get_user_balance()
            
            return {
                "id": str(uuid.uuid4()),
                "nick": "淘宝用户",  # TSDK 没有直接获取昵称的 API
                "avatar": None,
                "goldCoin": int(balance_info.get('coinAmount', 0)),
                "balance": float(balance_info.get('totalAmount', 0))
            }
        except Exception as e:
            logger.error(f"获取用户信息失败: {str(e)}")
            return None
    
    async def logout(self):
        """
        退出登录
        """
        self.cookie_storage.clear_cookie()
        self.h5_instance = None
    
    async def generate_qrcode(self) -> dict:
        """
        生成登录二维码 - 使用真实 TSDK API
        """
        try:
            h5 = self._get_h5_instance()
            
            # 调用 TSDK 的二维码登录前置方法
            h5._login_bofore()
            
            # 生成二维码
            res = h5.get('https://login.taobao.com/havanaone/loginLegacy/qrCode/generate.do', params={
                'adUrl': '',
                'adImage': '',
                'adText': '',
                'viewFd4h': '',
                'appName': 'taobao',
                'appEntrance': 'taobao_pc',
                'defaultView': 'qrcode',
                'umidTag': 'SERVER'
            })
            
            if res.status_code != 200:
                raise Exception("生成二维码失败")
            
            resj = res.json()
            
            if resj.get('hasError'):
                raise Exception(f"生成二维码错误: {resj.get('content')}")
            
            qr_data = resj.get('content', {}).get('data', {})
            qr_url = qr_data.get('url')
            lg_token = qr_data.get('lgToken')
            ck = qr_data.get('ck')
            t = qr_data.get('t')
            
            # 保存会话信息
            qr_id = str(uuid.uuid4())
            self.qr_sessions[qr_id] = {
                "created_at": datetime.now(),
                "status": "pending",
                "lgToken": lg_token,
                "ck": ck,
                "t": t,
                "cookie": None
            }
            
            # 生成二维码图片（转换为 base64）
            import qrcode
            qr = qrcode.QRCode(version=1, box_size=10, border=5)
            qr.add_data(qr_url)
            qr.make(fit=True)
            
            img = qr.make_image(fill_color="black", back_color="white")
            
            # 转换为 base64
            buffered = BytesIO()
            img.save(buffered, format="PNG")
            qr_base64 = base64.b64encode(buffered.getvalue()).decode()
            
            logger.info(f"二维码生成成功: {qr_id}")
            
            return {
                "qrId": qr_id,
                "qrCode": f"data:image/png;base64,{qr_base64}",
                "expireTime": 300  # 5分钟
            }
        except Exception as e:
            logger.error(f"生成二维码失败: {str(e)}")
            raise
    
    async def check_qrcode(self, qr_id: str) -> dict:
        """
        检查二维码扫描状态 - 使用真实 TSDK API
        """
        try:
            if qr_id not in self.qr_sessions:
                return {
                    "status": "expired",
                    "message": "二维码已过期"
                }
            
            session = self.qr_sessions[qr_id]
            
            # 检查是否过期（5分钟）
            if datetime.now() - session["created_at"] > timedelta(minutes=5):
                del self.qr_sessions[qr_id]
                return {
                    "status": "expired",
                    "message": "二维码已过期"
                }
            
            # 调用 TSDK 检查二维码状态
            h5 = self._get_h5_instance()
            
            try:
                qr_check_result = h5.qrNewCheck2(
                    t=session['t'],
                    ck=session['ck']
                )
                
                code = qr_check_result.get('code')
                
                # 根据状态码判断
                if code == '10000':  # 扫码成功
                    # 获取 Cookie
                    cookie_str = '; '.join([f"{k}={v}" for k, v in h5.cookies.items()])
                    
                    # 保存 Cookie
                    self.cookie_storage.save_cookie(cookie_str)
                    session["cookie"] = cookie_str
                    session["status"] = "confirmed"
                    
                    logger.success("二维码扫描成功，已登录")
                    
                    return {
                        "status": "confirmed",
                        "message": "扫描成功",
                        "cookie": cookie_str
                    }
                elif code == '10001':  # 等待扫描
                    return {
                        "status": "pending",
                        "message": "等待扫描"
                    }
                elif code == '10004':  # 二维码失效
                    del self.qr_sessions[qr_id]
                    return {
                        "status": "expired",
                        "message": "二维码已失效"
                    }
                else:
                    return {
                        "status": "pending",
                        "message": qr_check_result.get('message', '等待扫描')
                    }
            except Exception as check_error:
                logger.warning(f"检查二维码状态异常: {str(check_error)}")
                return {
                    "status": "pending",
                    "message": "等待扫描"
                }
                
        except Exception as e:
            logger.error(f"检查二维码状态失败: {str(e)}")
            raise