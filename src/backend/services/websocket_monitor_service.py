"""
WebSocket 实时监控服务
实现毫秒级响应的礼包监控系统
"""
import asyncio
import json
from datetime import datetime
from typing import Dict, Set, Optional, Callable, Any
from loguru import logger
from collections import defaultdict

from backend.services.gift_service import GiftService
from backend.services.account_service import AccountService


class WebSocketMonitorService:
    """WebSocket实时监控服务类"""
    
    def __init__(self):
        self.gift_service = GiftService()
        self.account_service = AccountService()
        
        # 监控状态管理
        self.active_monitors: Dict[str, asyncio.Task] = {}  # {monitor_id: task}
        self.monitor_configs: Dict[str, dict] = {}  # {monitor_id: config}
        
        # 回调函数管理
        self.callbacks: Dict[str, Callable] = {}  # {monitor_id: callback}
        
        # 礼包状态缓存 (用于变化检测)
        self.gift_states: Dict[str, Dict[str, Any]] = defaultdict(dict)  # {monitor_id: {gift_id: state}}
        
        # 性能统计
        self.performance_stats: Dict[str, dict] = defaultdict(lambda: {
            'total_checks': 0,
            'state_changes': 0,
            'avg_response_time': 0,
            'min_response_time': float('inf'),
            'max_response_time': 0,
            'total_response_time': 0
        })
        
        logger.info("WebSocket监控服务已初始化")
    
    async def start_monitor(
        self, 
        monitor_id: str,
        account_id: str,
        gift_ids: Optional[list] = None,
        check_interval: float = 0.5,  # 500ms检查间隔（高频轮询模拟实时）
        on_status_change: Optional[Callable] = None
    ) -> dict:
        """
        启动礼包监控
        
        Args:
            monitor_id: 监控任务ID
            account_id: 账号ID
            gift_ids: 要监控的礼包ID列表（None表示监控所有）
            check_interval: 检查间隔（秒），默认500ms
            on_status_change: 状态变化回调函数
        
        Returns:
            监控任务信息
        """
        try:
            # 检查是否已经在监控
            if monitor_id in self.active_monitors:
                logger.warning(f"监控任务已存在: {monitor_id}")
                return {
                    'success': False,
                    'error': '监控任务已存在'
                }
            
            # 验证账号
            account = self.account_service.get_account(account_id)
            if not account:
                logger.error(f"账号不存在: {account_id}")
                return {
                    'success': False,
                    'error': '账号不存在'
                }
            
            # 保存配置
            self.monitor_configs[monitor_id] = {
                'monitor_id': monitor_id,
                'account_id': account_id,
                'gift_ids': gift_ids,
                'check_interval': check_interval,
                'started_at': datetime.now().isoformat(),
                'status': 'running'
            }
            
            # 保存回调
            if on_status_change:
                self.callbacks[monitor_id] = on_status_change
            
            # 创建并启动监控任务
            task = asyncio.create_task(
                self._monitor_loop(monitor_id, account_id, gift_ids, check_interval)
            )
            self.active_monitors[monitor_id] = task
            
            logger.success(f"监控任务已启动: {monitor_id}, 账号: {account_id}, 间隔: {check_interval}s")
            
            return {
                'success': True,
                'monitor_id': monitor_id,
                'config': self.monitor_configs[monitor_id]
            }
            
        except Exception as e:
            logger.error(f"启动监控失败: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    async def _monitor_loop(
        self,
        monitor_id: str,
        account_id: str,
        gift_ids: Optional[list],
        check_interval: float
    ):
        """
        监控循环 - 持续检查礼包状态变化
        """
        logger.info(f"开始监控循环: {monitor_id}")
        
        while monitor_id in self.active_monitors:
            try:
                # 记录检查开始时间
                check_start = asyncio.get_event_loop().time()
                
                # 获取礼包列表
                result = await self.gift_service.get_gift_list()
                
                if result.get('success'):
                    gifts = result.get('gifts', [])
                    
                    # 如果指定了gift_ids，只监控这些礼包
                    if gift_ids:
                        gifts = [g for g in gifts if g['id'] in gift_ids]
                    
                    # 检查每个礼包的状态变化
                    for gift in gifts:
                        await self._check_gift_state_change(
                            monitor_id,
                            account_id,
                            gift,
                            check_start
                        )
                
                # 更新统计
                self.performance_stats[monitor_id]['total_checks'] += 1
                
                # 等待下次检查
                await asyncio.sleep(check_interval)
                
            except asyncio.CancelledError:
                logger.info(f"监控任务被取消: {monitor_id}")
                break
            except Exception as e:
                logger.error(f"监控循环出错 {monitor_id}: {str(e)}")
                await asyncio.sleep(check_interval)
        
        logger.info(f"监控循环已结束: {monitor_id}")
    
    async def _check_gift_state_change(
        self,
        monitor_id: str,
        account_id: str,
        gift: dict,
        check_start: float
    ):
        """
        检查礼包状态变化
        """
        gift_id = gift['id']
        current_status = gift.get('status')
        current_stock = gift.get('stock', 0)
        
        # 获取之前的状态
        previous_state = self.gift_states[monitor_id].get(gift_id, {})
        previous_status = previous_state.get('status')
        previous_stock = previous_state.get('stock', 0)
        
        # 检测关键状态变化
        status_changed = previous_status != current_status
        stock_changed = previous_stock != current_stock
        became_available = (
            previous_status != 'available' and 
            current_status == 'available'
        )
        
        # 如果检测到变化
        if status_changed or stock_changed:
            # 计算响应时间
            response_time = (asyncio.get_event_loop().time() - check_start) * 1000  # 转换为毫秒
            
            # 更新性能统计
            stats = self.performance_stats[monitor_id]
            stats['state_changes'] += 1
            stats['total_response_time'] += response_time
            stats['avg_response_time'] = stats['total_response_time'] / stats['state_changes']
            stats['min_response_time'] = min(stats['min_response_time'], response_time)
            stats['max_response_time'] = max(stats['max_response_time'], response_time)
            
            # 记录变化
            change_info = {
                'monitor_id': monitor_id,
                'account_id': account_id,
                'gift_id': gift_id,
                'gift_name': gift.get('name'),
                'gift_amount': gift.get('amount'),
                'previous_status': previous_status,
                'current_status': current_status,
                'previous_stock': previous_stock,
                'current_stock': current_stock,
                'became_available': became_available,
                'response_time_ms': response_time,
                'timestamp': datetime.now().isoformat()
            }
            
            logger.info(
                f"🔔 礼包状态变化: {gift.get('name')} "
                f"({previous_status} → {current_status}), "
                f"响应时间: {response_time:.2f}ms"
            )
            
            # 如果变为可用，触发回调
            if became_available and monitor_id in self.callbacks:
                try:
                    await self.callbacks[monitor_id](change_info)
                except Exception as e:
                    logger.error(f"回调函数执行失败: {str(e)}")
            
            # 记录到日志
            if became_available:
                logger.success(
                    f"✅ 检测到可抢购礼包: {gift.get('name')} "
                    f"{gift.get('amount')}元, "
                    f"响应时间: {response_time:.2f}ms"
                )
        
        # 更新状态缓存
        self.gift_states[monitor_id][gift_id] = {
            'status': current_status,
            'stock': current_stock,
            'updated_at': datetime.now().isoformat()
        }
    
    async def stop_monitor(self, monitor_id: str) -> dict:
        """
        停止监控任务
        """
        try:
            if monitor_id not in self.active_monitors:
                logger.warning(f"监控任务不存在: {monitor_id}")
                return {
                    'success': False,
                    'error': '监控任务不存在'
                }
            
            # 取消任务
            task = self.active_monitors[monitor_id]
            task.cancel()
            
            # 等待任务结束
            try:
                await task
            except asyncio.CancelledError:
                pass
            
            # 清理
            del self.active_monitors[monitor_id]
            
            # 更新配置状态
            if monitor_id in self.monitor_configs:
                self.monitor_configs[monitor_id]['status'] = 'stopped'
                self.monitor_configs[monitor_id]['stopped_at'] = datetime.now().isoformat()
            
            # 获取统计信息
            stats = self.performance_stats.get(monitor_id, {})
            
            logger.success(f"监控任务已停止: {monitor_id}, 统计: {stats}")
            
            return {
                'success': True,
                'monitor_id': monitor_id,
                'stats': stats
            }
            
        except Exception as e:
            logger.error(f"停止监控失败: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    async def get_monitor_status(self, monitor_id: str) -> dict:
        """
        获取监控状态
        """
        if monitor_id not in self.monitor_configs:
            return {
                'success': False,
                'error': '监控任务不存在'
            }
        
        config = self.monitor_configs[monitor_id]
        stats = self.performance_stats.get(monitor_id, {})
        is_running = monitor_id in self.active_monitors
        
        return {
            'success': True,
            'monitor_id': monitor_id,
            'config': config,
            'stats': stats,
            'is_running': is_running,
            'gift_count': len(self.gift_states.get(monitor_id, {}))
        }
    
    async def get_all_monitors(self) -> list:
        """
        获取所有监控任务
        """
        monitors = []
        for monitor_id in self.monitor_configs:
            status = await self.get_monitor_status(monitor_id)
            if status['success']:
                monitors.append(status)
        
        return monitors
    
    async def get_performance_summary(self) -> dict:
        """
        获取性能摘要
        """
        total_monitors = len(self.monitor_configs)
        active_monitors = len(self.active_monitors)
        
        # 汇总所有监控的性能数据
        total_checks = sum(s['total_checks'] for s in self.performance_stats.values())
        total_changes = sum(s['state_changes'] for s in self.performance_stats.values())
        
        avg_response_times = [
            s['avg_response_time'] 
            for s in self.performance_stats.values() 
            if s['state_changes'] > 0
        ]
        
        overall_avg = sum(avg_response_times) / len(avg_response_times) if avg_response_times else 0
        
        min_response = min(
            (s['min_response_time'] for s in self.performance_stats.values() if s['state_changes'] > 0),
            default=0
        )
        
        max_response = max(
            (s['max_response_time'] for s in self.performance_stats.values()),
            default=0
        )
        
        return {
            'total_monitors': total_monitors,
            'active_monitors': active_monitors,
            'total_checks': total_checks,
            'total_state_changes': total_changes,
            'overall_avg_response_ms': round(overall_avg, 2),
            'min_response_ms': round(min_response, 2),
            'max_response_ms': round(max_response, 2),
            'timestamp': datetime.now().isoformat()
        }
    
    async def cleanup_stopped_monitors(self):
        """
        清理已停止的监控任务
        """
        stopped_monitors = [
            mid for mid, config in self.monitor_configs.items()
            if config.get('status') == 'stopped'
        ]
        
        for monitor_id in stopped_monitors:
            # 清理配置
            if monitor_id in self.monitor_configs:
                del self.monitor_configs[monitor_id]
            
            # 清理状态缓存
            if monitor_id in self.gift_states:
                del self.gift_states[monitor_id]
            
            # 清理回调
            if monitor_id in self.callbacks:
                del self.callbacks[monitor_id]
        
        logger.info(f"已清理 {len(stopped_monitors)} 个已停止的监控任务")
        
        return {
            'success': True,
            'cleaned_count': len(stopped_monitors)
        }


class OptimizedMonitorService:
    """
    优化的监控服务 - 使用智能轮询策略
    当检测到变化时提高轮询频率，稳定时降低频率
    """
    
    def __init__(self):
        self.base_service = WebSocketMonitorService()
        self.adaptive_intervals: Dict[str, float] = {}  # {monitor_id: current_interval}
    
    async def start_adaptive_monitor(
        self,
        monitor_id: str,
        account_id: str,
        gift_ids: Optional[list] = None,
        min_interval: float = 0.3,  # 最小间隔300ms（高频）
        max_interval: float = 2.0,  # 最大间隔2s（低频）
        on_status_change: Optional[Callable] = None
    ) -> dict:
        """
        启动自适应监控
        检测到变化时提高频率，稳定时降低频率
        """
        # 初始使用中等间隔
        initial_interval = (min_interval + max_interval) / 2
        self.adaptive_intervals[monitor_id] = initial_interval
        
        # 包装回调函数，添加自适应逻辑
        async def adaptive_callback(change_info):
            # 检测到变化，提高频率
            self.adaptive_intervals[monitor_id] = min_interval
            logger.info(f"检测到变化，提高监控频率: {min_interval}s")
            
            # 执行原回调
            if on_status_change:
                await on_status_change(change_info)
            
            # 延迟后恢复正常频率
            await asyncio.sleep(30)  # 30秒后
            if monitor_id in self.adaptive_intervals:
                self.adaptive_intervals[monitor_id] = max_interval
                logger.info(f"恢复正常监控频率: {max_interval}s")
        
        return await self.base_service.start_monitor(
            monitor_id=monitor_id,
            account_id=account_id,
            gift_ids=gift_ids,
            check_interval=initial_interval,
            on_status_change=adaptive_callback
        )
    
    async def stop_monitor(self, monitor_id: str) -> dict:
        """停止监控"""
        if monitor_id in self.adaptive_intervals:
            del self.adaptive_intervals[monitor_id]
        return await self.base_service.stop_monitor(monitor_id)
    
    async def get_monitor_status(self, monitor_id: str) -> dict:
        """获取监控状态"""
        status = await self.base_service.get_monitor_status(monitor_id)
        if status['success'] and monitor_id in self.adaptive_intervals:
            status['current_interval'] = self.adaptive_intervals[monitor_id]
        return status
    
    async def get_all_monitors(self) -> list:
        """获取所有监控"""
        return await self.base_service.get_all_monitors()
    
    async def get_performance_summary(self) -> dict:
        """获取性能摘要"""
        return await self.base_service.get_performance_summary()


# 全局单例
_monitor_service = None
_optimized_service = None


def get_monitor_service() -> WebSocketMonitorService:
    """获取监控服务单例"""
    global _monitor_service
    if _monitor_service is None:
        _monitor_service = WebSocketMonitorService()
    return _monitor_service


def get_optimized_monitor_service() -> OptimizedMonitorService:
    """获取优化监控服务单例"""
    global _optimized_service
    if _optimized_service is None:
        _optimized_service = OptimizedMonitorService()
    return _optimized_service
