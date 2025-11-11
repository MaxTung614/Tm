"""
礼品服务 - 使用真实 TSDK API
"""
from datetime import datetime
from loguru import logger
from typing import Optional, List

from TSDK.api.taobao.gift import TmallGiftAPI
from backend.utils.cookie_storage import CookieStorage
from backend.services.risk_params_service import RiskParamsService


class GiftService:
    """礼品服务类"""
    
    def __init__(self):
        self.cookie_storage = CookieStorage()
        self.risk_params_service = RiskParamsService()
    
    def _get_gift_api(self) -> TmallGiftAPI:
        """获取 TmallGiftAPI 实例"""
        cookie = self.cookie_storage.get_cookie()
        if not cookie:
            raise Exception("未登录")
        
        gift_api = TmallGiftAPI()
        gift_api.cookie = cookie
        return gift_api
    
    async def get_gift_list(self, status: Optional[str] = None, gift_type: Optional[str] = None, page: int = 1, page_size: int = 20) -> dict:
        """
        获取礼品列表 - 使用真实 TSDK API
        """
        try:
            gift_api = self._get_gift_api()
            
            # 获取红包列表
            red_packets = gift_api.get_red_packets()
            
            # 转换为前端需要的格式
            gifts = []
            for packet in red_packets:
                # 只处理红包类型（排除话费、商品等）
                packet_type = "redPacket"
                
                # 检查是否是话费红包，如果是则跳过
                if "话费" in packet.get('name', '') or "话费" in packet.get('description', ''):
                    continue
                
                # 检查是否是商品券，如果是则跳过
                if "券" in packet.get('name', '') or "coupon" in packet.get('type', '').lower():
                    continue
                
                gifts.append({
                    "id": packet.get('id', packet.get('benefitCode')),
                    "benefitCode": packet.get('benefitCode'),
                    "name": packet.get('name', '现金红包'),
                    "amount": packet.get('amount', '0元'),
                    "coinCost": int(packet.get('coinCost', 0)),
                    "type": "redPacket",  # 统一为红包类型
                    "status": "available" if packet.get('status') == 'AVAILABLE' else "claimed",
                    "expireTime": packet.get('expireTime'),
                    "description": packet.get('description', '限时抢购现金红包')
                })
            
            # 应用类型筛选（如果指定了类型）
            if gift_type:
                gifts = [g for g in gifts if g["type"] == gift_type]
            
            # 应用状态筛选
            if status:
                gifts = [g for g in gifts if g["status"] == status]
            
            # 分页
            start = (page - 1) * page_size
            end = start + page_size
            paginated_gifts = gifts[start:end]
            
            logger.info(f"获取到 {len(gifts)} 个红包，返回第 {page} 页")
            
            return {
                "gifts": paginated_gifts,
                "total": len(gifts),
                "page": page,
                "pageSize": page_size
            }
        except Exception as e:
            logger.error(f"获取礼品列表失败: {str(e)}")
            raise
    
    async def grab_gift(self, gift_id: str) -> dict:
        """
        抢购单个礼品 - 使用真实 TSDK API + 风控参数
        """
        try:
            gift_api = self._get_gift_api()
            
            # 获取风控参数
            risk_params = self.risk_params_service.get_grab_params()
            
            logger.info(f"开始抢购礼品: {gift_id}")
            logger.debug(f"风控参数: ua={'已设置' if risk_params['ua'] else '未设置'}, "
                        f"umidToken={'已设置' if risk_params['umidToken'] else '未设置'}, "
                        f"asac={'已设置' if risk_params['asac'] else '未设置'}")
            
            # 检查风控参数是否完整
            if not self.risk_params_service.is_params_valid():
                logger.warning("风控参数不完整，抢购可能失败")
                warnings = self.risk_params_service._get_warnings()
                logger.warning(f"警告: {', '.join(warnings)}")
            
            # 使用 TSDK 的 exchange_red_packet 方法
            result = gift_api.exchange_red_packet(
                benefit_code=gift_id,
                asac=risk_params.get('asac', ''),
                ua=risk_params.get('ua', ''),
                umid_token=risk_params.get('umidToken', '')
            )
            
            if result:
                logger.success(f"抢购成功: {gift_id}")
                return {
                    "success": True,
                    "message": "抢购成功",
                    "orderId": result.get('orderId', gift_id),
                    "timestamp": datetime.now().isoformat(),
                    "data": result
                }
            else:
                logger.error(f"抢购失败: {gift_id}")
                return {
                    "success": False,
                    "message": "抢购失败，可能是库存不足或风控限制",
                    "timestamp": datetime.now().isoformat(),
                    "suggestion": "请检查风控参数是否正确配置"
                }
        except Exception as e:
            logger.error(f"抢购异常: {str(e)}")
            return {
                "success": False,
                "message": str(e),
                "timestamp": datetime.now().isoformat(),
                "suggestion": "建议更新风控参数后重试"
            }
    
    async def batch_grab_gifts(self, gift_ids: List[str]) -> dict:
        """
        批量抢购礼品
        """
        try:
            success_count = 0
            failed_count = 0
            results = []
            
            for gift_id in gift_ids:
                result = await self.grab_gift(gift_id)
                results.append({
                    "giftId": gift_id,
                    "success": result.get("success", False),
                    "message": result.get("message", "")
                })
                
                if result.get("success"):
                    success_count += 1
                else:
                    failed_count += 1
            
            return {
                "success": success_count,
                "failed": failed_count,
                "total": len(gift_ids),
                "results": results
            }
        except Exception as e:
            logger.error(f"批量抢购失败: {str(e)}")
            raise
    
    async def get_gift_status(self, gift_id: str) -> dict:
        """
        获取礼品状态 - 通过重新获取列表来检查状态
        """
        try:
            gift_api = self._get_gift_api()
            
            # 获取所有红包
            red_packets = gift_api.get_red_packets()
            
            # 查找指定红包
            for packet in red_packets:
                if packet.get('benefitCode') == gift_id or packet.get('id') == gift_id:
                    return {
                        "giftId": gift_id,
                        "status": "available" if packet.get('status') == 'AVAILABLE' else "claimed",
                        "stock": 100 if packet.get('status') == 'AVAILABLE' else 0,  # TSDK 没有库存信息
                        "timestamp": datetime.now().isoformat()
                    }
            
            # 未找到
            return {
                "giftId": gift_id,
                "status": "expired",
                "stock": 0,
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"获取礼品状态失败: {str(e)}")
            raise