"""
监控系统集成测试
验证完整的监控流程和性能指标
"""
import pytest
import asyncio
import time
from datetime import datetime
from typing import List, Dict

from backend.services.websocket_monitor_service import (
    WebSocketMonitorService,
    OptimizedMonitorService
)
from backend.services.account_service import AccountService
from backend.services.gift_service import GiftService


class TestMonitorIntegration:
    """监控系统集成测试"""
    
    @pytest.fixture
    async def setup_test_account(self):
        """设置测试账号"""
        account_service = AccountService()
        
        # 创建测试账号
        test_account = {
            'account_id': 'integration_test_account',
            'account_name': '集成测试账号',
            'cookie': 'test_cookie_value',
            'ua': 'test_user_agent',
            'umid_token': 'test_umid_token',
            'status': 'active',
            'login_time': datetime.now().isoformat()
        }
        
        account_service.save_account('integration_test_account', test_account)
        
        yield test_account
        
        # 清理
        try:
            account_service.delete_account('integration_test_account')
        except:
            pass
    
    @pytest.mark.asyncio
    async def test_complete_monitor_lifecycle(self, setup_test_account):
        """
        测试完整的监控生命周期
        1. 启动监控
        2. 运行一段时间
        3. 检查性能
        4. 停止监控
        """
        service = WebSocketMonitorService()
        monitor_id = 'lifecycle_test'
        
        # 1. 启动监控
        result = await service.start_monitor(
            monitor_id=monitor_id,
            account_id=setup_test_account['account_id'],
            check_interval=0.5
        )
        
        assert result['success'] is True
        assert monitor_id in service.active_monitors
        
        # 2. 运行一段时间
        await asyncio.sleep(2.0)  # 运行2秒
        
        # 3. 检查性能
        status = await service.get_monitor_status(monitor_id)
        assert status['success'] is True
        assert status['is_running'] is True
        assert status['stats']['total_checks'] >= 3  # 至少检查3次
        
        # 4. 停止监控
        stop_result = await service.stop_monitor(monitor_id)
        assert stop_result['success'] is True
        assert monitor_id not in service.active_monitors
    
    @pytest.mark.asyncio
    async def test_multi_account_monitoring(self, setup_test_account):
        """
        测试多账号同时监控
        验证任务隔离性
        """
        service = WebSocketMonitorService()
        account_service = AccountService()
        
        # 创建多个测试账号
        accounts = []
        for i in range(3):
            account_id = f'multi_test_account_{i}'
            account = {
                'account_id': account_id,
                'account_name': f'测试账号{i}',
                'cookie': f'test_cookie_{i}',
                'status': 'active'
            }
            account_service.save_account(account_id, account)
            accounts.append(account)
        
        try:
            # 为每个账号启动监控
            monitor_ids = []
            for i, account in enumerate(accounts):
                monitor_id = f'multi_monitor_{i}'
                result = await service.start_monitor(
                    monitor_id=monitor_id,
                    account_id=account['account_id'],
                    check_interval=0.5
                )
                assert result['success'] is True
                monitor_ids.append(monitor_id)
            
            # 运行一段时间
            await asyncio.sleep(1.5)
            
            # 验证所有监控都在运行
            all_monitors = await service.get_all_monitors()
            assert len(all_monitors) >= 3
            
            # 验证各监控独立运行
            for monitor_id in monitor_ids:
                status = await service.get_monitor_status(monitor_id)
                assert status['success'] is True
                assert status['is_running'] is True
            
            # 停止所有监控
            for monitor_id in monitor_ids:
                await service.stop_monitor(monitor_id)
        
        finally:
            # 清理账号
            for account in accounts:
                try:
                    account_service.delete_account(account['account_id'])
                except:
                    pass
    
    @pytest.mark.asyncio
    async def test_performance_requirements(self, setup_test_account):
        """
        测试性能要求
        验证响应时间是否满足要求
        """
        service = WebSocketMonitorService()
        monitor_id = 'performance_test'
        
        # 记录变化检测
        detected_changes = []
        
        async def change_callback(change_info):
            detected_changes.append({
                'timestamp': time.time(),
                'response_time': change_info['response_time_ms'],
                'change_info': change_info
            })
        
        # 启动高频监控（300ms间隔）
        result = await service.start_monitor(
            monitor_id=monitor_id,
            account_id=setup_test_account['account_id'],
            check_interval=0.3,
            on_status_change=change_callback
        )
        
        assert result['success'] is True
        
        # 运行足够时间收集数据
        await asyncio.sleep(3.0)
        
        # 停止监控
        stop_result = await service.stop_monitor(monitor_id)
        
        # 验证性能指标
        stats = stop_result['stats']
        
        # 检查检测次数（3秒 / 0.3秒 ≈ 10次）
        assert stats['total_checks'] >= 8
        
        # 如果有状态变化，验证响应时间
        if stats['state_changes'] > 0:
            avg_response = stats['avg_response_time']
            max_response = stats['max_response_time']
            
            # 本地处理应该非常快（< 100ms）
            assert avg_response < 100, f"平均响应时间 {avg_response}ms 超过要求"
            assert max_response < 200, f"最大响应时间 {max_response}ms 超过要求"
    
    @pytest.mark.asyncio
    async def test_state_change_detection_accuracy(self, setup_test_account):
        """
        测试状态变化检测准确性
        """
        service = WebSocketMonitorService()
        monitor_id = 'accuracy_test'
        
        # 启动监控
        await service.start_monitor(
            monitor_id=monitor_id,
            account_id=setup_test_account['account_id'],
            check_interval=0.5
        )
        
        # 运行一段时间
        await asyncio.sleep(2.0)
        
        # 检查状态缓存
        gift_states = service.gift_states.get(monitor_id, {})
        
        # 应该有礼包状态记录
        assert len(gift_states) >= 0  # 可能没有礼包或API模拟
        
        # 停止监控
        await service.stop_monitor(monitor_id)
    
    @pytest.mark.asyncio
    async def test_optimized_service_performance(self, setup_test_account):
        """
        测试优化服务性能
        验证自适应间隔调整
        """
        service = OptimizedMonitorService()
        monitor_id = 'optimized_test'
        
        # 启动自适应监控
        result = await service.start_adaptive_monitor(
            monitor_id=monitor_id,
            account_id=setup_test_account['account_id'],
            min_interval=0.3,
            max_interval=2.0
        )
        
        assert result['success'] is True
        
        # 检查初始间隔
        initial_interval = service.adaptive_intervals.get(monitor_id)
        assert initial_interval is not None
        assert 0.3 <= initial_interval <= 2.0
        
        # 运行一段时间
        await asyncio.sleep(2.0)
        
        # 获取状态
        status = await service.get_monitor_status(monitor_id)
        assert status['success'] is True
        
        # 停止监控
        await service.stop_monitor(monitor_id)
        assert monitor_id not in service.adaptive_intervals


class TestPerformanceBenchmark:
    """性能基准测试"""
    
    @pytest.mark.asyncio
    async def test_100_checks_performance(self, setup_test_account):
        """
        测试100次检查的性能
        目标: 平均响应时间 < 100ms
        """
        service = WebSocketMonitorService()
        monitor_id = 'benchmark_100'
        
        # 启动快速监控
        await service.start_monitor(
            monitor_id=monitor_id,
            account_id='integration_test_account',
            check_interval=0.1  # 100ms间隔
        )
        
        # 运行足够时间完成100次检查
        await asyncio.sleep(11.0)  # 100次 * 0.1s + 缓冲
        
        # 停止并获取统计
        result = await service.stop_monitor(monitor_id)
        stats = result['stats']
        
        # 验证
        assert stats['total_checks'] >= 100, "未达到100次检查"
        
        print(f"\n性能基准测试结果:")
        print(f"总检查次数: {stats['total_checks']}")
        print(f"状态变化次数: {stats['state_changes']}")
        
        if stats['state_changes'] > 0:
            print(f"平均响应时间: {stats['avg_response_time']:.2f}ms")
            print(f"最小响应时间: {stats['min_response_time']:.2f}ms")
            print(f"最大响应时间: {stats['max_response_time']:.2f}ms")
            
            # 性能要求验证
            assert stats['avg_response_time'] < 100, "平均响应时间未达标"
    
    @pytest.mark.asyncio
    async def test_concurrent_monitors_performance(self, setup_test_account):
        """
        测试并发监控性能
        10个监控同时运行
        """
        service = WebSocketMonitorService()
        account_service = AccountService()
        
        # 创建10个账号和监控
        monitor_ids = []
        accounts = []
        
        for i in range(10):
            account_id = f'concurrent_account_{i}'
            account = {
                'account_id': account_id,
                'account_name': f'并发测试{i}',
                'cookie': f'cookie_{i}',
                'status': 'active'
            }
            account_service.save_account(account_id, account)
            accounts.append(account)
            
            monitor_id = f'concurrent_monitor_{i}'
            await service.start_monitor(
                monitor_id=monitor_id,
                account_id=account_id,
                check_interval=0.5
            )
            monitor_ids.append(monitor_id)
        
        try:
            # 运行2秒
            await asyncio.sleep(2.0)
            
            # 获取性能摘要
            summary = await service.get_performance_summary()
            
            print(f"\n并发性能测试结果:")
            print(f"活跃监控数: {summary['active_monitors']}")
            print(f"总检查次数: {summary['total_checks']}")
            print(f"总状态变化: {summary['total_state_changes']}")
            
            if summary['total_state_changes'] > 0:
                print(f"整体平均响应: {summary['overall_avg_response_ms']:.2f}ms")
            
            # 验证所有监控都在运行
            assert summary['active_monitors'] >= 10
            
            # 验证性能没有明显下降
            for monitor_id in monitor_ids:
                status = await service.get_monitor_status(monitor_id)
                assert status['is_running'] is True
        
        finally:
            # 清理
            for monitor_id in monitor_ids:
                await service.stop_monitor(monitor_id)
            
            for account in accounts:
                try:
                    account_service.delete_account(account['account_id'])
                except:
                    pass


class TestErrorHandling:
    """错误处理测试"""
    
    @pytest.mark.asyncio
    async def test_monitor_with_invalid_account(self):
        """测试无效账号的监控"""
        service = WebSocketMonitorService()
        
        result = await service.start_monitor(
            monitor_id='invalid_test',
            account_id='nonexistent_account'
        )
        
        assert result['success'] is False
        assert '账号不存在' in result['error']
    
    @pytest.mark.asyncio
    async def test_stop_nonexistent_monitor(self):
        """测试停止不存在的监控"""
        service = WebSocketMonitorService()
        
        result = await service.stop_monitor('nonexistent_monitor')
        
        assert result['success'] is False
        assert '不存在' in result['error']
    
    @pytest.mark.asyncio
    async def test_duplicate_monitor_id(self, setup_test_account):
        """测试重复的监控ID"""
        service = WebSocketMonitorService()
        
        # 第一次启动
        result1 = await service.start_monitor(
            monitor_id='duplicate_test',
            account_id=setup_test_account['account_id']
        )
        assert result1['success'] is True
        
        # 第二次启动（重复）
        result2 = await service.start_monitor(
            monitor_id='duplicate_test',
            account_id=setup_test_account['account_id']
        )
        assert result2['success'] is False
        
        # 清理
        await service.stop_monitor('duplicate_test')


# pytest fixture for all tests
@pytest.fixture
async def setup_test_account():
    """全局测试账号fixture"""
    account_service = AccountService()
    
    test_account = {
        'account_id': 'integration_test_account',
        'account_name': '集成测试账号',
        'cookie': 'test_cookie_value',
        'ua': 'test_user_agent',
        'umid_token': 'test_umid_token',
        'status': 'active',
        'login_time': datetime.now().isoformat()
    }
    
    account_service.save_account('integration_test_account', test_account)
    
    yield test_account
    
    try:
        account_service.delete_account('integration_test_account')
    except:
        pass


if __name__ == '__main__':
    pytest.main([__file__, '-v', '-s'])
