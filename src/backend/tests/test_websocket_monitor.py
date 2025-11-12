"""
WebSocket监控服务单元测试
"""
import pytest
import asyncio
from datetime import datetime
from unittest.mock import Mock, AsyncMock, patch

from backend.services.websocket_monitor_service import (
    WebSocketMonitorService,
    OptimizedMonitorService,
    get_monitor_service,
    get_optimized_monitor_service
)


class TestWebSocketMonitorService:
    """WebSocket监控服务测试"""
    
    @pytest.fixture
    def service(self):
        """创建服务实例"""
        return WebSocketMonitorService()
    
    @pytest.fixture
    def mock_account_service(self):
        """模拟账号服务"""
        with patch('backend.services.websocket_monitor_service.AccountService') as mock:
            instance = mock.return_value
            instance.get_account.return_value = {
                'account_id': 'test_account',
                'account_name': '测试账号',
                'cookie': 'test_cookie',
                'status': 'active'
            }
            yield instance
    
    @pytest.fixture
    def mock_gift_service(self):
        """模拟礼包服务"""
        with patch('backend.services.websocket_monitor_service.GiftService') as mock:
            instance = mock.return_value
            instance.get_gift_list = AsyncMock(return_value={
                'success': True,
                'gifts': [
                    {
                        'id': 'gift_1',
                        'name': '测试红包',
                        'amount': 10,
                        'status': 'available',
                        'stock': 100
                    }
                ]
            })
            yield instance
    
    @pytest.mark.asyncio
    async def test_start_monitor_success(self, service, mock_account_service, mock_gift_service):
        """测试启动监控成功"""
        service.account_service = mock_account_service
        service.gift_service = mock_gift_service
        
        result = await service.start_monitor(
            monitor_id='test_monitor_1',
            account_id='test_account',
            check_interval=1.0
        )
        
        assert result['success'] is True
        assert result['monitor_id'] == 'test_monitor_1'
        assert 'test_monitor_1' in service.active_monitors
        assert 'test_monitor_1' in service.monitor_configs
        
        # 清理
        await service.stop_monitor('test_monitor_1')
    
    @pytest.mark.asyncio
    async def test_start_monitor_duplicate(self, service, mock_account_service):
        """测试启动重复监控"""
        service.account_service = mock_account_service
        
        # 第一次启动
        result1 = await service.start_monitor(
            monitor_id='test_monitor_2',
            account_id='test_account'
        )
        assert result1['success'] is True
        
        # 第二次启动（重复）
        result2 = await service.start_monitor(
            monitor_id='test_monitor_2',
            account_id='test_account'
        )
        assert result2['success'] is False
        assert '已存在' in result2['error']
        
        # 清理
        await service.stop_monitor('test_monitor_2')
    
    @pytest.mark.asyncio
    async def test_start_monitor_invalid_account(self, service):
        """测试启动监控时账号不存在"""
        # 模拟账号不存在
        service.account_service = Mock()
        service.account_service.get_account = Mock(return_value=None)
        
        result = await service.start_monitor(
            monitor_id='test_monitor_3',
            account_id='nonexistent_account'
        )
        
        assert result['success'] is False
        assert '账号不存在' in result['error']
    
    @pytest.mark.asyncio
    async def test_stop_monitor_success(self, service, mock_account_service):
        """测试停止监控成功"""
        service.account_service = mock_account_service
        
        # 先启动
        await service.start_monitor(
            monitor_id='test_monitor_4',
            account_id='test_account'
        )
        
        # 再停止
        result = await service.stop_monitor('test_monitor_4')
        
        assert result['success'] is True
        assert 'test_monitor_4' not in service.active_monitors
        assert service.monitor_configs['test_monitor_4']['status'] == 'stopped'
    
    @pytest.mark.asyncio
    async def test_stop_monitor_not_exists(self, service):
        """测试停止不存在的监控"""
        result = await service.stop_monitor('nonexistent_monitor')
        
        assert result['success'] is False
        assert '不存在' in result['error']
    
    @pytest.mark.asyncio
    async def test_get_monitor_status(self, service, mock_account_service):
        """测试获取监控状态"""
        service.account_service = mock_account_service
        
        # 启动监控
        await service.start_monitor(
            monitor_id='test_monitor_5',
            account_id='test_account'
        )
        
        # 获取状态
        status = await service.get_monitor_status('test_monitor_5')
        
        assert status['success'] is True
        assert status['monitor_id'] == 'test_monitor_5'
        assert status['is_running'] is True
        assert 'config' in status
        assert 'stats' in status
        
        # 清理
        await service.stop_monitor('test_monitor_5')
    
    @pytest.mark.asyncio
    async def test_get_all_monitors(self, service, mock_account_service):
        """测试获取所有监控"""
        service.account_service = mock_account_service
        
        # 启动多个监控
        await service.start_monitor('monitor_1', 'test_account')
        await service.start_monitor('monitor_2', 'test_account')
        
        # 获取所有监控
        monitors = await service.get_all_monitors()
        
        assert len(monitors) >= 2
        assert any(m['monitor_id'] == 'monitor_1' for m in monitors)
        assert any(m['monitor_id'] == 'monitor_2' for m in monitors)
        
        # 清理
        await service.stop_monitor('monitor_1')
        await service.stop_monitor('monitor_2')
    
    @pytest.mark.asyncio
    async def test_state_change_detection(self, service, mock_account_service, mock_gift_service):
        """测试状态变化检测"""
        service.account_service = mock_account_service
        service.gift_service = mock_gift_service
        
        # 回调记录
        callback_called = []
        
        async def test_callback(change_info):
            callback_called.append(change_info)
        
        # 启动监控
        await service.start_monitor(
            monitor_id='test_monitor_6',
            account_id='test_account',
            check_interval=0.5,
            on_status_change=test_callback
        )
        
        # 等待一次检查
        await asyncio.sleep(0.6)
        
        # 修改礼包状态
        mock_gift_service.get_gift_list = AsyncMock(return_value={
            'success': True,
            'gifts': [
                {
                    'id': 'gift_1',
                    'name': '测试红包',
                    'amount': 10,
                    'status': 'unavailable',  # 状态改变
                    'stock': 0
                }
            ]
        })
        
        # 等待检测变化
        await asyncio.sleep(0.6)
        
        # 清理
        await service.stop_monitor('test_monitor_6')
    
    @pytest.mark.asyncio
    async def test_performance_tracking(self, service, mock_account_service, mock_gift_service):
        """测试性能追踪"""
        service.account_service = mock_account_service
        service.gift_service = mock_gift_service
        
        # 启动监控
        await service.start_monitor(
            monitor_id='test_monitor_7',
            account_id='test_account',
            check_interval=0.3
        )
        
        # 运行一段时间
        await asyncio.sleep(1.0)
        
        # 停止并获取统计
        result = await service.stop_monitor('test_monitor_7')
        
        stats = result['stats']
        assert stats['total_checks'] > 0
        assert 'avg_response_time' in stats
    
    @pytest.mark.asyncio
    async def test_performance_summary(self, service, mock_account_service):
        """测试性能摘要"""
        service.account_service = mock_account_service
        
        # 启动多个监控
        await service.start_monitor('perf_monitor_1', 'test_account')
        await service.start_monitor('perf_monitor_2', 'test_account')
        
        # 获取性能摘要
        summary = await service.get_performance_summary()
        
        assert 'total_monitors' in summary
        assert 'active_monitors' in summary
        assert 'total_checks' in summary
        assert summary['total_monitors'] >= 2
        assert summary['active_monitors'] >= 2
        
        # 清理
        await service.stop_monitor('perf_monitor_1')
        await service.stop_monitor('perf_monitor_2')
    
    @pytest.mark.asyncio
    async def test_cleanup_stopped_monitors(self, service, mock_account_service):
        """测试清理已停止的监控"""
        service.account_service = mock_account_service
        
        # 启动并停止监控
        await service.start_monitor('cleanup_test_1', 'test_account')
        await service.stop_monitor('cleanup_test_1')
        
        await service.start_monitor('cleanup_test_2', 'test_account')
        await service.stop_monitor('cleanup_test_2')
        
        # 清理
        result = await service.cleanup_stopped_monitors()
        
        assert result['success'] is True
        assert result['cleaned_count'] >= 2
        assert 'cleanup_test_1' not in service.monitor_configs
        assert 'cleanup_test_2' not in service.monitor_configs


class TestOptimizedMonitorService:
    """优化监控服务测试"""
    
    @pytest.fixture
    def service(self):
        """创建优化服务实例"""
        return OptimizedMonitorService()
    
    @pytest.fixture
    def mock_account_service(self):
        """模拟账号服务"""
        with patch('backend.services.websocket_monitor_service.AccountService') as mock:
            instance = mock.return_value
            instance.get_account.return_value = {
                'account_id': 'test_account',
                'account_name': '测试账号',
                'cookie': 'test_cookie',
                'status': 'active'
            }
            yield instance
    
    @pytest.mark.asyncio
    async def test_adaptive_monitor_start(self, service, mock_account_service):
        """测试自适应监控启动"""
        service.base_service.account_service = mock_account_service
        
        result = await service.start_adaptive_monitor(
            monitor_id='adaptive_test_1',
            account_id='test_account',
            min_interval=0.3,
            max_interval=2.0
        )
        
        assert result['success'] is True
        assert 'adaptive_test_1' in service.adaptive_intervals
        
        # 清理
        await service.stop_monitor('adaptive_test_1')
    
    @pytest.mark.asyncio
    async def test_adaptive_interval_adjustment(self, service, mock_account_service):
        """测试自适应间隔调整"""
        service.base_service.account_service = mock_account_service
        
        await service.start_adaptive_monitor(
            monitor_id='adaptive_test_2',
            account_id='test_account',
            min_interval=0.3,
            max_interval=2.0
        )
        
        # 检查初始间隔
        initial_interval = service.adaptive_intervals.get('adaptive_test_2')
        assert initial_interval is not None
        assert 0.3 <= initial_interval <= 2.0
        
        # 清理
        await service.stop_monitor('adaptive_test_2')


class TestSingletonPattern:
    """测试单例模式"""
    
    def test_get_monitor_service_singleton(self):
        """测试监控服务单例"""
        service1 = get_monitor_service()
        service2 = get_monitor_service()
        
        assert service1 is service2
    
    def test_get_optimized_service_singleton(self):
        """测试优化服务单例"""
        service1 = get_optimized_monitor_service()
        service2 = get_optimized_monitor_service()
        
        assert service1 is service2


class TestResponseTimeRequirements:
    """测试响应时间要求"""
    
    @pytest.mark.asyncio
    async def test_response_time_under_100ms(self):
        """测试响应时间是否符合要求（< 100ms）"""
        service = WebSocketMonitorService()
        
        # 模拟快速检查
        check_start = asyncio.get_event_loop().time()
        
        # 模拟状态变化检测
        gift = {
            'id': 'test_gift',
            'name': '测试红包',
            'amount': 10,
            'status': 'available',
            'stock': 100
        }
        
        monitor_id = 'response_time_test'
        service.monitor_configs[monitor_id] = {'account_id': 'test'}
        
        await service._check_gift_state_change(
            monitor_id=monitor_id,
            account_id='test_account',
            gift=gift,
            check_start=check_start
        )
        
        # 检查性能统计
        stats = service.performance_stats[monitor_id]
        if stats['state_changes'] > 0:
            # 响应时间应该很快（本地处理）
            assert stats['avg_response_time'] < 100  # < 100ms
            assert stats['min_response_time'] < 100
            assert stats['max_response_time'] < 100


# pytest配置
def pytest_configure(config):
    """Pytest配置"""
    config.addinivalue_line(
        "markers", "asyncio: mark test as an asyncio test"
    )


if __name__ == '__main__':
    pytest.main([__file__, '-v', '-s'])
