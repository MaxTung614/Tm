"""
统计服务
"""
import json
from pathlib import Path
from loguru import logger
from datetime import datetime, timedelta
from typing import Optional, List


class StatsService:
    """统计服务类"""
    
    def __init__(self):
        self.stats_file = Path("data/stats.json")
        self.stats_file.parent.mkdir(parents=True, exist_ok=True)
        self._load_stats()
    
    def _load_stats(self):
        """加载统计数据"""
        try:
            if self.stats_file.exists():
                with open(self.stats_file, 'r', encoding='utf-8') as f:
                    self.stats = json.load(f)
            else:
                # 默认统计数据
                self.stats = {
                    "totalGrabbed": 0,
                    "successCount": 0,
                    "failedCount": 0,
                    "totalAmount": 0.0,
                    "todayGrabbed": 0,
                    "lastUpdateDate": datetime.now().date().isoformat(),
                    "history": []
                }
                self._save_stats()
        except Exception as e:
            logger.error(f"加载统计数据失败: {str(e)}")
            self.stats = {}
    
    def _save_stats(self):
        """保存统计数据"""
        try:
            with open(self.stats_file, 'w', encoding='utf-8') as f:
                json.dump(self.stats, f, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.error(f"保存统计数据失败: {str(e)}")
    
    def _check_and_reset_daily(self):
        """检查并重置每日统计"""
        today = datetime.now().date().isoformat()
        if self.stats.get("lastUpdateDate") != today:
            self.stats["todayGrabbed"] = 0
            self.stats["lastUpdateDate"] = today
            self._save_stats()
    
    async def get_dashboard_stats(self) -> dict:
        """获取仪表板统计"""
        try:
            self._check_and_reset_daily()
            
            # 计算成功率
            total = self.stats.get("successCount", 0) + self.stats.get("failedCount", 0)
            success_rate = (self.stats.get("successCount", 0) / total * 100) if total > 0 else 0
            
            return {
                "totalGrabbed": self.stats.get("totalGrabbed", 0),
                "successRate": round(success_rate, 1),
                "totalAmount": self.stats.get("totalAmount", 0.0),
                "todayGrabbed": self.stats.get("todayGrabbed", 0)
            }
        except Exception as e:
            logger.error(f"获取统计数据失败: {str(e)}")
            raise
    
    async def get_history(self, start_date: Optional[str] = None, 
                         end_date: Optional[str] = None,
                         page: int = 1, page_size: int = 20) -> dict:
        """获取历史记录"""
        try:
            history = self.stats.get("history", [])
            
            # 日期筛选
            if start_date or end_date:
                filtered_history = []
                for record in history:
                    record_date = record.get("timestamp", "")
                    if start_date and record_date < start_date:
                        continue
                    if end_date and record_date > end_date:
                        continue
                    filtered_history.append(record)
                history = filtered_history
            
            # 分页
            start = (page - 1) * page_size
            end = start + page_size
            paginated_history = history[start:end]
            
            return {
                "records": paginated_history,
                "total": len(history),
                "page": page,
                "pageSize": page_size
            }
        except Exception as e:
            logger.error(f"获取历史记录失败: {str(e)}")
            raise
    
    async def record_grab_result(self, gift_name: str, amount: str, 
                                success: bool, reason: Optional[str] = None):
        """记录抢购结果"""
        try:
            self._check_and_reset_daily()
            
            # 更新统计
            if success:
                self.stats["totalGrabbed"] = self.stats.get("totalGrabbed", 0) + 1
                self.stats["successCount"] = self.stats.get("successCount", 0) + 1
                self.stats["todayGrabbed"] = self.stats.get("todayGrabbed", 0) + 1
                
                # 提取金额数字
                try:
                    amount_value = float(amount.replace('元', '').replace('¥', ''))
                    self.stats["totalAmount"] = self.stats.get("totalAmount", 0.0) + amount_value
                except:
                    pass
            else:
                self.stats["failedCount"] = self.stats.get("failedCount", 0) + 1
            
            # 添加历史记录
            if "history" not in self.stats:
                self.stats["history"] = []
            
            self.stats["history"].insert(0, {
                "id": f"record_{len(self.stats['history'])}",
                "giftName": gift_name,
                "amount": amount,
                "status": "success" if success else "failed",
                "timestamp": datetime.now().isoformat(),
                "reason": reason
            })
            
            # 只保留最近1000条记录
            self.stats["history"] = self.stats["history"][:1000]
            
            self._save_stats()
            
        except Exception as e:
            logger.error(f"记录抢购结果失败: {str(e)}")
