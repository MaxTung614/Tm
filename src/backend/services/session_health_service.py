"""
会话健康检查服务
定期检查账号Cookie有效性，确保24小时稳定性
"""
import asyncio
from datetime import datetime, timedelta
from typing import Dict, Optional, Callable, List
from loguru import logger

from backend.services.account_service import AccountService
from backend.services.auth_service import AuthService


class SessionHealthService:
    """会话健康检查服务类"""
    
    def __init__(self):
        self.account_service = AccountService()
        self.auth_service = AuthService()
        
        # 健康检查任务
        self.health_check_task: Optional[asyncio.Task] = None
        self.is_running = False
        
        # 配置
        self.check_interval = 3600  # 默认每小时检查一次（秒）
        self.quick_check_interval = 300  # 快速检查间隔5分钟（Cookie过期后）
        
        # 回调函数
        self.on_cookie_expired: Optional[Callable] = None
        self.on_cookie_renewed: Optional[Callable] = None
        self.on_health_check_complete: Optional[Callable] = None
        
        # 统计数据
        self.stats = {
            'total_checks': 0,
            'expired_detected': 0,
            'renewed_detected': 0,
            'last_check_time': None,
            'accounts_checked': 0,
            'healthy_accounts': 0,
            'unhealthy_accounts': 0
        }
        
        logger.info("会话健康检查服务已初始化")
    
    async def start(
        self,
        check_interval: int = 3600,
        on_cookie_expired: Optional[Callable] = None,
        on_cookie_renewed: Optional[Callable] = None
    ):
        """
        启动健康检查服务
        
        Args:
            check_interval: 检查间隔（秒），默认3600秒（1小时）
            on_cookie_expired: Cookie过期回调
            on_cookie_renewed: Cookie续期回调
        """
        if self.is_running:
            logger.warning("健康检查服务已在运行")
            return {
                'success': False,
                'error': '服务已在运行'
            }
        
        self.check_interval = check_interval
        self.on_cookie_expired = on_cookie_expired
        self.on_cookie_renewed = on_cookie_renewed
        
        # 创建并启动健康检查任务
        self.health_check_task = asyncio.create_task(self._health_check_loop())
        self.is_running = True
        
        logger.success(f"健康检查服务已启动，检查间隔: {check_interval}秒")
        
        return {
            'success': True,
            'check_interval': check_interval,
            'started_at': datetime.now().isoformat()
        }
    
    async def stop(self):
        """停止健康检查服务"""
        if not self.is_running:
            logger.warning("健康检查服务未运行")
            return {
                'success': False,
                'error': '服务未运行'
            }
        
        # 取消任务
        if self.health_check_task:
            self.health_check_task.cancel()
            try:
                await self.health_check_task
            except asyncio.CancelledError:
                pass
        
        self.is_running = False
        
        logger.success("健康检查服务已停止")
        
        return {
            'success': True,
            'stopped_at': datetime.now().isoformat(),
            'stats': self.stats
        }
    
    async def _health_check_loop(self):
        """健康检查循环"""
        logger.info("开始健康检查循环")
        
        while self.is_running:
            try:
                # 执行健康检查
                await self.check_all_accounts()
                
                # 等待下次检查
                await asyncio.sleep(self.check_interval)
                
            except asyncio.CancelledError:
                logger.info("健康检查循环被取消")
                break
            except Exception as e:
                logger.error(f"健康检查循环出错: {str(e)}")
                await asyncio.sleep(60)  # 出错后等待1分钟
        
        logger.info("健康检查循环已结束")
    
    async def check_all_accounts(self) -> dict:
        """
        检查所有账号的健康状态
        """
        logger.info("开始检查所有账号健康状态")
        
        check_start = datetime.now()
        
        # 获取所有账号
        accounts = self.account_service.get_all_accounts()
        
        if not accounts:
            logger.info("没有账号需要检查")
            return {
                'success': True,
                'total_accounts': 0,
                'healthy': 0,
                'unhealthy': 0
            }
        
        healthy_count = 0
        unhealthy_count = 0
        expired_accounts = []
        renewed_accounts = []
        
        # 检查每个账号
        for account in accounts:
            account_id = account.get('account_id')
            
            # 只检查活跃账号
            if account.get('status') != 'active':
                continue
            
            # 检查Cookie有效性
            result = await self.check_account_health(account_id)
            
            if result['success']:
                if result['cookie_valid']:
                    healthy_count += 1
                    
                    # 如果之前是过期状态，现在恢复了
                    if account.get('previous_status') == 'cookie_expired':
                        renewed_accounts.append(account)
                else:
                    unhealthy_count += 1
                    expired_accounts.append(account)
        
        # 更新统计
        self.stats['total_checks'] += 1
        self.stats['last_check_time'] = datetime.now().isoformat()
        self.stats['accounts_checked'] = len(accounts)
        self.stats['healthy_accounts'] = healthy_count
        self.stats['unhealthy_accounts'] = unhealthy_count
        self.stats['expired_detected'] += len(expired_accounts)
        self.stats['renewed_detected'] += len(renewed_accounts)
        
        check_duration = (datetime.now() - check_start).total_seconds()
        
        logger.info(
            f"健康检查完成: 总数{len(accounts)}, "
            f"健康{healthy_count}, 异常{unhealthy_count}, "
            f"耗时{check_duration:.2f}秒"
        )
        
        # 触发回调
        if expired_accounts and self.on_cookie_expired:
            for account in expired_accounts:
                try:
                    await self.on_cookie_expired(account)
                except Exception as e:
                    logger.error(f"Cookie过期回调失败: {str(e)}")
        
        if renewed_accounts and self.on_cookie_renewed:
            for account in renewed_accounts:
                try:
                    await self.on_cookie_renewed(account)
                except Exception as e:
                    logger.error(f"Cookie续期回调失败: {str(e)}")
        
        return {
            'success': True,
            'total_accounts': len(accounts),
            'healthy': healthy_count,
            'unhealthy': unhealthy_count,
            'expired_accounts': [a.get('account_id') for a in expired_accounts],
            'renewed_accounts': [a.get('account_id') for a in renewed_accounts],
            'check_duration': check_duration
        }
    
    async def check_account_health(self, account_id: str) -> dict:
        """
        检查单个账号健康状态
        
        Args:
            account_id: 账号ID
        
        Returns:
            健康检查结果
        """
        try:
            # 获取账号信息
            account = self.account_service.get_account(account_id)
            
            if not account:
                logger.warning(f"账号不存在: {account_id}")
                return {
                    'success': False,
                    'error': '账号不存在',
                    'cookie_valid': False
                }
            
            # 获取Cookie
            cookie = account.get('cookie')
            
            if not cookie:
                logger.warning(f"账号 {account_id} 没有Cookie")
                return {
                    'success': True,
                    'cookie_valid': False,
                    'reason': 'no_cookie'
                }
            
            # 验证Cookie
            verify_result = await self.auth_service.verify_cookie(cookie)
            
            if verify_result['valid']:
                # Cookie有效
                logger.debug(f"账号 {account_id} Cookie有效")
                
                # 更新账号状态
                if account.get('status') != 'active':
                    account['status'] = 'active'
                    account['previous_status'] = account.get('status')
                    account['last_health_check'] = datetime.now().isoformat()
                    self.account_service.save_account(account_id, account)
                
                return {
                    'success': True,
                    'cookie_valid': True,
                    'account_id': account_id,
                    'account_name': account.get('account_name'),
                    'last_check': datetime.now().isoformat()
                }
            else:
                # Cookie无效
                logger.warning(
                    f"账号 {account_id} Cookie无效: {verify_result.get('reason')}"
                )
                
                # 更新账号状态
                account['previous_status'] = account.get('status')
                account['status'] = 'cookie_expired'
                account['expired_at'] = datetime.now().isoformat()
                account['expire_reason'] = verify_result.get('reason')
                account['last_health_check'] = datetime.now().isoformat()
                self.account_service.save_account(account_id, account)
                
                return {
                    'success': True,
                    'cookie_valid': False,
                    'account_id': account_id,
                    'account_name': account.get('account_name'),
                    'reason': verify_result.get('reason'),
                    'message': verify_result.get('message'),
                    'expired_at': account['expired_at']
                }
        
        except Exception as e:
            logger.error(f"检查账号健康状态失败 {account_id}: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'cookie_valid': False
            }
    
    async def force_check_account(self, account_id: str) -> dict:
        """
        强制检查指定账号（不等待定时检查）
        
        Args:
            account_id: 账号ID
        
        Returns:
            检查结果
        """
        logger.info(f"强制检查账号: {account_id}")
        
        result = await self.check_account_health(account_id)
        
        # 如果检测到过期，触发回调
        if result['success'] and not result['cookie_valid']:
            if self.on_cookie_expired:
                account = self.account_service.get_account(account_id)
                if account:
                    try:
                        await self.on_cookie_expired(account)
                    except Exception as e:
                        logger.error(f"Cookie过期回调失败: {str(e)}")
        
        return result
    
    def get_stats(self) -> dict:
        """获取统计信息"""
        return {
            'success': True,
            'is_running': self.is_running,
            'check_interval': self.check_interval,
            'stats': self.stats
        }
    
    def get_health_status(self) -> dict:
        """获取服务健康状态"""
        return {
            'success': True,
            'is_running': self.is_running,
            'check_interval': self.check_interval,
            'last_check': self.stats.get('last_check_time'),
            'total_checks': self.stats.get('total_checks'),
            'current_status': {
                'healthy_accounts': self.stats.get('healthy_accounts'),
                'unhealthy_accounts': self.stats.get('unhealthy_accounts'),
                'total_accounts': self.stats.get('accounts_checked')
            }
        }


class EnhancedSessionHealthService(SessionHealthService):
    """
    增强的会话健康检查服务
    支持智能检查频率调整
    """
    
    def __init__(self):
        super().__init__()
        
        # 智能检查配置
        self.normal_interval = 3600  # 正常间隔1小时
        self.alert_interval = 600    # 警告间隔10分钟
        self.critical_interval = 300  # 严重间隔5分钟
        
        # 健康等级阈值
        self.alert_threshold = 0.2  # 20%账号异常
        self.critical_threshold = 0.5  # 50%账号异常
        
    async def _health_check_loop(self):
        """智能健康检查循环"""
        logger.info("开始智能健康检查循环")
        
        while self.is_running:
            try:
                # 执行健康检查
                result = await self.check_all_accounts()
                
                # 根据健康状态调整检查间隔
                interval = self._calculate_next_interval(result)
                
                logger.info(f"下次检查间隔: {interval}秒")
                
                # 等待下次检查
                await asyncio.sleep(interval)
                
            except asyncio.CancelledError:
                logger.info("智能健康检查循环被取消")
                break
            except Exception as e:
                logger.error(f"智能健康检查循环出错: {str(e)}")
                await asyncio.sleep(60)
        
        logger.info("智能健康检查循环已结束")
    
    def _calculate_next_interval(self, check_result: dict) -> int:
        """
        根据检查结果计算下次检查间隔
        """
        total = check_result.get('total_accounts', 1)
        unhealthy = check_result.get('unhealthy', 0)
        
        if total == 0:
            return self.normal_interval
        
        unhealthy_rate = unhealthy / total
        
        if unhealthy_rate >= self.critical_threshold:
            # 严重：50%以上账号异常
            logger.warning(f"⚠️ 严重: {unhealthy_rate*100:.1f}% 账号异常，提高检查频率")
            return self.critical_interval
        elif unhealthy_rate >= self.alert_threshold:
            # 警告：20%以上账号异常
            logger.warning(f"⚠️ 警告: {unhealthy_rate*100:.1f}% 账号异常，提高检查频率")
            return self.alert_interval
        else:
            # 正常
            logger.info(f"✅ 健康: {unhealthy_rate*100:.1f}% 账号异常，正常检查频率")
            return self.normal_interval


# 全局单例
_session_health_service = None
_enhanced_service = None


def get_session_health_service() -> SessionHealthService:
    """获取会话健康服务单例"""
    global _session_health_service
    if _session_health_service is None:
        _session_health_service = SessionHealthService()
    return _session_health_service


def get_enhanced_health_service() -> EnhancedSessionHealthService:
    """获取增强健康服务单例"""
    global _enhanced_service
    if _enhanced_service is None:
        _enhanced_service = EnhancedSessionHealthService()
    return _enhanced_service
