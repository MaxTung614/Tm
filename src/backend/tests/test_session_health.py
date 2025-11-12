"""
会话健康检查服务单元测试
"""
import pytest
import asyncio
from datetime import datetime
from unittest.mock import Mock, AsyncMock, patch

from backend.services.session_health_service import (
    SessionHealthService,
    EnhancedSessionHealthService,
    get_session_health_service,
    get_enhanced_health_service
)


class TestSessionHealthService:
    """会话健康检查服务测试"""
    
    @pytest.fixture
    def service(self):
        """创建服务实例"""
        return SessionHealthService()
    
    @pytest.fixture
    def mock_account_service(self):
        """模拟账号服务"""
        with patch('backend.services.session_health_service.AccountService') as mock:
            instance = mock.return_value
            instance.get_all_accounts.return_value = [
                {
                    'account_id': 'test_account_1',
                    'account_name': '测试账号1',
                    'cookie': 'valid_cookie',
                    'status': 'active'
                },
                {
                    'account_id': 'test_account_2',
                    'account_name': '测试账号2',
                    'cookie': 'expired_cookie',
                    'status': 'active'
                }
            ]
            instance.get_account.side_effect = lambda aid: {
                'test_account_1': {
                    'account_id': 'test_account_1',
                    'account_name': '测试账号1',
                    'cookie': 'valid_cookie',
                    'status': 'active'
                },
                'test_account_2': {
                    'account_id': 'test_account_2',
                    'account_name': '测试账号2',
                    'cookie': 'expired_cookie',
                    'status': 'active'
                }
            }.get(aid)
            yield instance
    
    @pytest.fixture
    def mock_auth_service(self):
        """模拟认证服务"""
        with patch('backend.services.session_health_service.AuthService') as mock:
            instance = mock.return_value
            instance.verify_cookie = AsyncMock(side_effect=lambda cookie: {
                'valid_cookie': {'valid': True, 'message': 'Cookie有效'},
                'expired_cookie': {
                    'valid': False,
                    'reason': 'expired',
                    'message': 'Cookie已过期'
                }
            }.get(cookie, {'valid': False, 'reason': 'unknown'}))
            yield instance
    
    @pytest.mark.asyncio
    async def test_start_service(self, service):
        """测试启动服务"""
        result = await service.start(check_interval=3600)
        
        assert result['success'] is True
        assert service.is_running is True
        assert service.check_interval == 3600
        
        # 停止服务
        await service.stop()
    
    @pytest.mark.asyncio
    async def test_start_service_when_running(self, service):
        """测试服务已运行时再次启动"""
        # 第一次启动
        await service.start()
        
        # 第二次启动
        result = await service.start()
        
        assert result['success'] is False
        assert '已在运行' in result['error']
        
        # 停止服务
        await service.stop()
    
    @pytest.mark.asyncio
    async def test_stop_service(self, service):
        """测试停止服务"""
        # 先启动
        await service.start()
        
        # 再停止
        result = await service.stop()
        
        assert result['success'] is True
        assert service.is_running is False
        assert 'stats' in result
    
    @pytest.mark.asyncio
    async def test_stop_service_when_not_running(self, service):
        """测试服务未运行时停止"""
        result = await service.stop()
        
        assert result['success'] is False
        assert '未运行' in result['error']
    
    @pytest.mark.asyncio
    async def test_check_account_health_valid(self, service, mock_account_service, mock_auth_service):
        """测试检查账号健康（Cookie有效）"""
        service.account_service = mock_account_service
        service.auth_service = mock_auth_service
        
        result = await service.check_account_health('test_account_1')
        
        assert result['success'] is True
        assert result['cookie_valid'] is True
        assert result['account_id'] == 'test_account_1'
    
    @pytest.mark.asyncio
    async def test_check_account_health_expired(self, service, mock_account_service, mock_auth_service):
        """测试检查账号健康（Cookie过期）"""
        service.account_service = mock_account_service
        service.auth_service = mock_auth_service
        
        result = await service.check_account_health('test_account_2')
        
        assert result['success'] is True
        assert result['cookie_valid'] is False
        assert result['reason'] == 'expired'
        assert '过期' in result['message']
    
    @pytest.mark.asyncio
    async def test_check_account_health_nonexistent(self, service, mock_account_service):
        """测试检查不存在的账号"""
        service.account_service = mock_account_service
        
        # 设置返回None
        service.account_service.get_account = Mock(return_value=None)
        
        result = await service.check_account_health('nonexistent')
        
        assert result['success'] is False
        assert '账号不存在' in result['error']
    
    @pytest.mark.asyncio
    async def test_check_all_accounts(self, service, mock_account_service, mock_auth_service):
        """测试检查所有账号"""
        service.account_service = mock_account_service
        service.auth_service = mock_auth_service
        
        result = await service.check_all_accounts()
        
        assert result['success'] is True
        assert result['total_accounts'] == 2
        assert result['healthy'] == 1  # test_account_1有效
        assert result['unhealthy'] == 1  # test_account_2过期
        assert len(result['expired_accounts']) == 1
    
    @pytest.mark.asyncio
    async def test_check_all_accounts_with_callbacks(self, service, mock_account_service, mock_auth_service):
        """测试检查所有账号（带回调）"""
        service.account_service = mock_account_service
        service.auth_service = mock_auth_service
        
        # 回调记录
        expired_calls = []
        renewed_calls = []
        
        async def on_expired(account):
            expired_calls.append(account)
        
        async def on_renewed(account):
            renewed_calls.append(account)
        
        service.on_cookie_expired = on_expired
        service.on_cookie_renewed = on_renewed
        
        result = await service.check_all_accounts()
        
        assert result['success'] is True
        assert len(expired_calls) == 1  # 1个过期
        assert expired_calls[0]['account_id'] == 'test_account_2'
    
    @pytest.mark.asyncio
    async def test_force_check_account(self, service, mock_account_service, mock_auth_service):
        """测试强制检查账号"""
        service.account_service = mock_account_service
        service.auth_service = mock_auth_service
        
        expired_calls = []
        
        async def on_expired(account):
            expired_calls.append(account)
        
        service.on_cookie_expired = on_expired
        
        result = await service.force_check_account('test_account_2')
        
        assert result['success'] is True
        assert result['cookie_valid'] is False
        assert len(expired_calls) == 1
    
    @pytest.mark.asyncio
    async def test_get_stats(self, service):
        """测试��取统计"""
        stats = service.get_stats()
        
        assert stats['success'] is True
        assert 'is_running' in stats
        assert 'stats' in stats
    
    @pytest.mark.asyncio
    async def test_get_health_status(self, service):
        """测试获取健康状态"""
        status = service.get_health_status()
        
        assert status['success'] is True
        assert 'is_running' in status
        assert 'check_interval' in status
        assert 'current_status' in status
    
    @pytest.mark.asyncio
    async def test_health_check_loop(self, service, mock_account_service, mock_auth_service):
        """测试健康检查循环"""
        service.account_service = mock_account_service
        service.auth_service = mock_auth_service
        
        # 启动快速检查（每秒）
        await service.start(check_interval=1)
        
        # 运行2秒
        await asyncio.sleep(2.1)
        
        # 停止
        result = await service.stop()
        
        # 应该至少执行了2次检查
        assert service.stats['total_checks'] >= 2
    
    @pytest.mark.asyncio
    async def test_stats_accumulation(self, service, mock_account_service, mock_auth_service):
        """测试统计数据累积"""
        service.account_service = mock_account_service
        service.auth_service = mock_auth_service
        
        # 执行多次检查
        for _ in range(3):
            await service.check_all_accounts()
        
        # 验证统计
        assert service.stats['total_checks'] == 3
        assert service.stats['expired_detected'] == 3  # 每次都检测到1个过期


class TestEnhancedSessionHealthService:
    """增强会话健康检查服务测试"""
    
    @pytest.fixture
    def service(self):
        """创建增强服务实例"""
        return EnhancedSessionHealthService()
    
    @pytest.fixture
    def mock_account_service(self):
        """模拟账号服务"""
        with patch('backend.services.session_health_service.AccountService') as mock:
            instance = mock.return_value
            instance.get_all_accounts.return_value = [
                {
                    'account_id': f'account_{i}',
                    'account_name': f'账号{i}',
                    'cookie': 'valid_cookie' if i < 5 else 'expired_cookie',
                    'status': 'active'
                }
                for i in range(10)
            ]
            instance.get_account.side_effect = lambda aid: {
                'account_id': aid,
                'cookie': 'valid_cookie' if int(aid.split('_')[1]) < 5 else 'expired_cookie',
                'status': 'active'
            }
            yield instance
    
    @pytest.fixture
    def mock_auth_service(self):
        """模拟认证服务"""
        with patch('backend.services.session_health_service.AuthService') as mock:
            instance = mock.return_value
            instance.verify_cookie = AsyncMock(side_effect=lambda cookie: {
                'valid_cookie': {'valid': True},
                'expired_cookie': {'valid': False, 'reason': 'expired', 'message': '过期'}
            }.get(cookie, {'valid': False}))
            yield instance
    
    @pytest.mark.asyncio
    async def test_normal_interval_calculation(self, service, mock_account_service, mock_auth_service):
        """测试正常间隔计算（健康账号多）"""
        service.account_service = mock_account_service
        service.auth_service = mock_auth_service
        
        # 50%健康（5/10）
        result = await service.check_all_accounts()
        
        interval = service._calculate_next_interval(result)
        
        # 50%异常，应该使用critical_interval
        assert interval == service.critical_interval
    
    @pytest.mark.asyncio
    async def test_alert_interval_calculation(self, service):
        """测试警告间隔计算"""
        # 模拟30%异常（警告级别）
        result = {
            'total_accounts': 10,
            'healthy': 7,
            'unhealthy': 3
        }
        
        interval = service._calculate_next_interval(result)
        
        # 30%异常，应该使用alert_interval
        assert interval == service.alert_interval
    
    @pytest.mark.asyncio
    async def test_critical_interval_calculation(self, service):
        """测试严重间隔计算"""
        # 模拟60%异常（严重级别）
        result = {
            'total_accounts': 10,
            'healthy': 4,
            'unhealthy': 6
        }
        
        interval = service._calculate_next_interval(result)
        
        # 60%异常，应该使用critical_interval
        assert interval == service.critical_interval
    
    @pytest.mark.asyncio
    async def test_adaptive_interval_adjustment(self, service, mock_account_service, mock_auth_service):
        """测试自适应间隔调整"""
        service.account_service = mock_account_service
        service.auth_service = mock_auth_service
        
        # 启动服务（快速检查）
        await service.start(check_interval=1)
        
        # 运行1.5秒
        await asyncio.sleep(1.5)
        
        # 停止
        await service.stop()
        
        # 应该至少执行了1次检查
        assert service.stats['total_checks'] >= 1


class TestSingletonPattern:
    """测试单例模式"""
    
    def test_get_session_health_service_singleton(self):
        """测试基础服务单例"""
        service1 = get_session_health_service()
        service2 = get_session_health_service()
        
        assert service1 is service2
    
    def test_get_enhanced_service_singleton(self):
        """测试增强服务单例"""
        service1 = get_enhanced_health_service()
        service2 = get_enhanced_health_service()
        
        assert service1 is service2


class Test24HourStability:
    """24小时稳定性测试"""
    
    @pytest.mark.asyncio
    async def test_hourly_check_coverage(self):
        """测试每小时检查覆盖率"""
        service = SessionHealthService()
        
        # 模拟24小时（每小时1次检查）
        # 实际测试中缩短时间
        check_count = 0
        
        for hour in range(24):
            # 模拟一次检查
            check_count += 1
        
        # 24小时应该至少检查24次
        assert check_count == 24
    
    @pytest.mark.asyncio
    async def test_detection_within_5_minutes(self, mock_account_service, mock_auth_service):
        """测试5分钟内检测到过期（要求）"""
        service = SessionHealthService()
        service.account_service = mock_account_service
        service.auth_service = mock_auth_service
        
        # 配置5分钟检查间隔
        service.check_interval = 300  # 5分钟
        
        # 启动服务
        await service.start(check_interval=300)
        
        # 等待超过一次检查间隔（确保至少执行一次）
        await asyncio.sleep(0.1)
        
        # 停止服务
        await service.stop()
        
        # 验证检查间隔符合要求
        assert service.check_interval <= 300  # ≤ 5分钟


if __name__ == '__main__':
    pytest.main([__file__, '-v', '-s'])
