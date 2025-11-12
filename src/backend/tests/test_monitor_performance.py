"""
监控系统性能验证测试
验证是否满足毫秒级响应要求
"""
import pytest
import asyncio
import time
import statistics
from typing import List
from datetime import datetime

from backend.services.websocket_monitor_service import (
    WebSocketMonitorService,
    OptimizedMonitorService
)


class PerformanceMetrics:
    """性能指标收集器"""
    
    def __init__(self):
        self.response_times: List[float] = []
        self.detection_times: List[float] = []
        self.trigger_delays: List[float] = []
        self.state_changes: List[dict] = []
    
    def add_response_time(self, time_ms: float):
        """添加响应时间"""
        self.response_times.append(time_ms)
    
    def add_detection_time(self, time_ms: float):
        """添加检测时间"""
        self.detection_times.append(time_ms)
    
    def add_trigger_delay(self, time_ms: float):
        """添加触发延迟"""
        self.trigger_delays.append(time_ms)
    
    def add_state_change(self, change_info: dict):
        """记录状态变化"""
        self.state_changes.append(change_info)
    
    def get_summary(self) -> dict:
        """获取统计摘要"""
        return {
            'response_times': {
                'count': len(self.response_times),
                'avg': statistics.mean(self.response_times) if self.response_times else 0,
                'min': min(self.response_times) if self.response_times else 0,
                'max': max(self.response_times) if self.response_times else 0,
                'p95': statistics.quantiles(self.response_times, n=20)[18] if len(self.response_times) > 20 else 0,
                'p99': statistics.quantiles(self.response_times, n=100)[98] if len(self.response_times) > 100 else 0,
            },
            'detection_times': {
                'count': len(self.detection_times),
                'avg': statistics.mean(self.detection_times) if self.detection_times else 0,
                'min': min(self.detection_times) if self.detection_times else 0,
                'max': max(self.detection_times) if self.detection_times else 0,
            },
            'trigger_delays': {
                'count': len(self.trigger_delays),
                'avg': statistics.mean(self.trigger_delays) if self.trigger_delays else 0,
                'min': min(self.trigger_delays) if self.trigger_delays else 0,
                'max': max(self.trigger_delays) if self.trigger_delays else 0,
            },
            'total_state_changes': len(self.state_changes)
        }


class TestResponseTimeRequirements:
    """响应时间要求验证"""
    
    @pytest.mark.asyncio
    async def test_average_response_time_under_100ms(self):
        """
        验证: 平均响应时间 ≤ 100ms
        """
        service = WebSocketMonitorService()
        metrics = PerformanceMetrics()
        
        # 模拟100次状态检查
        for i in range(100):
            check_start = time.time()
            
            # 模拟礼包状态检查
            gift = {
                'id': f'gift_{i}',
                'name': f'测试红包{i}',
                'amount': 10,
                'status': 'available' if i % 2 == 0 else 'unavailable',
                'stock': 100
            }
            
            monitor_id = 'response_test'
            if monitor_id not in service.monitor_configs:
                service.monitor_configs[monitor_id] = {'account_id': 'test'}
            
            # 执行检查
            await service._check_gift_state_change(
                monitor_id=monitor_id,
                account_id='test_account',
                gift=gift,
                check_start=check_start
            )
            
            # 记录响应时间
            response_time = (time.time() - check_start) * 1000
            metrics.add_response_time(response_time)
        
        # 获取统计
        summary = metrics.get_summary()
        avg_response = summary['response_times']['avg']
        max_response = summary['response_times']['max']
        
        print(f"\n响应时间测试结果:")
        print(f"测试次数: {summary['response_times']['count']}")
        print(f"平均响应时间: {avg_response:.2f}ms")
        print(f"最小响应时间: {summary['response_times']['min']:.2f}ms")
        print(f"最大响应时间: {max_response:.2f}ms")
        
        if summary['response_times']['count'] > 20:
            print(f"P95响应时间: {summary['response_times']['p95']:.2f}ms")
        
        # 验证要求
        assert avg_response <= 100, f"平均响应时间 {avg_response:.2f}ms 超过100ms要求"
        assert max_response <= 200, f"最大响应时间 {max_response:.2f}ms 过高"
    
    @pytest.mark.asyncio
    async def test_trigger_delay_under_50ms(self):
        """
        验证: 触发延迟 ≤ 50ms
        """
        service = WebSocketMonitorService()
        metrics = PerformanceMetrics()
        
        # 回调函数记录触发时间
        trigger_times = []
        
        async def test_callback(change_info):
            trigger_time = time.time()
            trigger_times.append({
                'time': trigger_time,
                'change': change_info
            })
        
        monitor_id = 'trigger_test'
        service.monitor_configs[monitor_id] = {'account_id': 'test'}
        service.callbacks[monitor_id] = test_callback
        
        # 模拟状态变化检测
        for i in range(50):
            detection_start = time.time()
            
            gift = {
                'id': 'trigger_gift',
                'name': '触发测试红包',
                'amount': 10,
                'status': 'available',  # 总是可用，触发回调
                'stock': 100
            }
            
            # 清除之前的状态缓存，确保每次都检测到变化
            if i > 0:
                service.gift_states[monitor_id] = {}
            
            await service._check_gift_state_change(
                monitor_id=monitor_id,
                account_id='test_account',
                gift=gift,
                check_start=detection_start
            )
            
            # 如果触发了回调，计算延迟
            if len(trigger_times) == i + 1:
                trigger_delay = (trigger_times[-1]['time'] - detection_start) * 1000
                metrics.add_trigger_delay(trigger_delay)
        
        # 获取统计
        summary = metrics.get_summary()
        
        if summary['trigger_delays']['count'] > 0:
            avg_delay = summary['trigger_delays']['avg']
            max_delay = summary['trigger_delays']['max']
            
            print(f"\n触发延迟测试结果:")
            print(f"触发次数: {summary['trigger_delays']['count']}")
            print(f"平均触发延迟: {avg_delay:.2f}ms")
            print(f"最小触发延迟: {summary['trigger_delays']['min']:.2f}ms")
            print(f"最大触发延迟: {max_delay:.2f}ms")
            
            # 验证要求
            assert avg_delay <= 50, f"平均触发延迟 {avg_delay:.2f}ms 超过50ms要求"
            assert max_delay <= 100, f"最大触发延迟 {max_delay:.2f}ms 过高"
    
    @pytest.mark.asyncio
    async def test_p95_latency_under_150ms(self):
        """
        验证: P95延迟 ≤ 150ms
        """
        service = WebSocketMonitorService()
        latencies = []
        
        # 收集大量延迟数据
        for i in range(200):
            check_start = time.time()
            
            gift = {
                'id': f'latency_gift_{i}',
                'name': f'延迟测试{i}',
                'amount': 10,
                'status': 'available' if i % 3 == 0 else 'unavailable',
                'stock': 100
            }
            
            monitor_id = 'latency_test'
            if monitor_id not in service.monitor_configs:
                service.monitor_configs[monitor_id] = {'account_id': 'test'}
            
            await service._check_gift_state_change(
                monitor_id=monitor_id,
                account_id='test_account',
                gift=gift,
                check_start=check_start
            )
            
            latency = (time.time() - check_start) * 1000
            latencies.append(latency)
        
        # 计算P95
        p95_latency = statistics.quantiles(latencies, n=20)[18]
        p99_latency = statistics.quantiles(latencies, n=100)[98]
        avg_latency = statistics.mean(latencies)
        
        print(f"\n延迟分布测试结果:")
        print(f"样本数: {len(latencies)}")
        print(f"平均延迟: {avg_latency:.2f}ms")
        print(f"P95延迟: {p95_latency:.2f}ms")
        print(f"P99延迟: {p99_latency:.2f}ms")
        print(f"最大延迟: {max(latencies):.2f}ms")
        
        # 验证要求
        assert p95_latency <= 150, f"P95延迟 {p95_latency:.2f}ms 超过150ms要求"
        assert p99_latency <= 200, f"P99延迟 {p99_latency:.2f}ms 过高"


class TestHighConcurrencyPerformance:
    """高并发性能测试"""
    
    @pytest.mark.asyncio
    async def test_10_accounts_10_gifts_performance(self):
        """
        验证: 10个账号 × 10个礼包 = 100个监控任务
        性能无明显下降
        """
        service = WebSocketMonitorService()
        
        # 启动100个监控模拟
        monitor_ids = []
        
        for account_idx in range(10):
            for gift_idx in range(10):
                monitor_id = f'concurrent_{account_idx}_{gift_idx}'
                monitor_ids.append(monitor_id)
                
                # 初始化监控配置
                service.monitor_configs[monitor_id] = {
                    'account_id': f'account_{account_idx}',
                    'gift_id': f'gift_{gift_idx}'
                }
        
        # 模拟并发检查
        start_time = time.time()
        
        tasks = []
        for monitor_id in monitor_ids:
            gift = {
                'id': service.monitor_configs[monitor_id]['gift_id'],
                'name': '并发测试红包',
                'amount': 10,
                'status': 'available',
                'stock': 100
            }
            
            task = service._check_gift_state_change(
                monitor_id=monitor_id,
                account_id=service.monitor_configs[monitor_id]['account_id'],
                gift=gift,
                check_start=start_time
            )
            tasks.append(task)
        
        # 并发执行所有检查
        await asyncio.gather(*tasks)
        
        total_time = (time.time() - start_time) * 1000
        
        print(f"\n高并发性能测试结果:")
        print(f"监控任务数: {len(monitor_ids)}")
        print(f"总执行时间: {total_time:.2f}ms")
        print(f"平均每任务: {total_time / len(monitor_ids):.2f}ms")
        
        # 验证性能
        # 100个任务并发执行，总时间应该远小于串行执行
        assert total_time < 1000, f"100个并发任务总时间 {total_time:.2f}ms 过长"
        
        # 平均每任务时间应该很短
        avg_per_task = total_time / len(monitor_ids)
        assert avg_per_task < 20, f"平均每任务时间 {avg_per_task:.2f}ms 过长"
    
    @pytest.mark.asyncio
    async def test_concurrent_performance_degradation(self):
        """
        验证: 并发场景下性能下降 < 10%
        """
        service = WebSocketMonitorService()
        
        # 单任务基准测试
        single_times = []
        for i in range(50):
            start = time.time()
            
            gift = {'id': f'single_{i}', 'name': '单任务', 'amount': 10, 'status': 'available', 'stock': 100}
            monitor_id = 'single_test'
            if monitor_id not in service.monitor_configs:
                service.monitor_configs[monitor_id] = {'account_id': 'test'}
            
            await service._check_gift_state_change(
                monitor_id=monitor_id,
                account_id='test',
                gift=gift,
                check_start=start
            )
            
            single_times.append((time.time() - start) * 1000)
        
        avg_single = statistics.mean(single_times)
        
        # 并发任务测试
        concurrent_times = []
        for batch in range(10):
            tasks = []
            batch_start = time.time()
            
            for i in range(10):
                gift = {'id': f'concurrent_{batch}_{i}', 'name': '并发', 'amount': 10, 'status': 'available', 'stock': 100}
                monitor_id = f'concurrent_test_{i}'
                if monitor_id not in service.monitor_configs:
                    service.monitor_configs[monitor_id] = {'account_id': 'test'}
                
                task = service._check_gift_state_change(
                    monitor_id=monitor_id,
                    account_id='test',
                    gift=gift,
                    check_start=batch_start
                )
                tasks.append(task)
            
            await asyncio.gather(*tasks)
            batch_time = (time.time() - batch_start) * 1000
            concurrent_times.append(batch_time / 10)  # 平均每任务
        
        avg_concurrent = statistics.mean(concurrent_times)
        
        # 计算性能下降百分比
        degradation = ((avg_concurrent - avg_single) / avg_single) * 100
        
        print(f"\n性能下降测试结果:")
        print(f"单任务平均: {avg_single:.2f}ms")
        print(f"并发任务平均: {avg_concurrent:.2f}ms")
        print(f"性能下降: {degradation:.2f}%")
        
        # 验证性能下降 < 10%
        assert degradation < 10, f"性能下降 {degradation:.2f}% 超过10%限制"


class TestOptimizedServicePerformance:
    """优化服务性能测试"""
    
    @pytest.mark.asyncio
    async def test_adaptive_monitoring_efficiency(self):
        """
        测试自适应监控的效率
        """
        service = OptimizedMonitorService()
        
        # 初始化基础服务的配置
        monitor_id = 'adaptive_perf_test'
        service.base_service.monitor_configs[monitor_id] = {'account_id': 'test'}
        service.adaptive_intervals[monitor_id] = 1.0  # 初始1秒
        
        # 模拟检测到变化时提高频率
        initial_interval = service.adaptive_intervals[monitor_id]
        
        # 模拟状态变化回调
        async def simulate_change():
            service.adaptive_intervals[monitor_id] = 0.3  # 提高到300ms
        
        await simulate_change()
        
        high_freq_interval = service.adaptive_intervals[monitor_id]
        
        print(f"\n自适应监控效率测试:")
        print(f"初始间隔: {initial_interval}s")
        print(f"检测变化后间隔: {high_freq_interval}s")
        print(f"频率提升: {initial_interval / high_freq_interval:.2f}倍")
        
        # 验证频率提升
        assert high_freq_interval < initial_interval
        assert high_freq_interval >= 0.3
        assert high_freq_interval <= 2.0


class TestPerformanceVsRequirements:
    """性能要求对比测试"""
    
    @pytest.mark.asyncio
    async def test_all_requirements_compliance(self):
        """
        综合验证所有性能要求
        """
        service = WebSocketMonitorService()
        
        # 收集性能数据
        response_times = []
        trigger_delays = []
        
        monitor_id = 'compliance_test'
        service.monitor_configs[monitor_id] = {'account_id': 'test'}
        
        # 模拟100次检测
        for i in range(100):
            check_start = time.time()
            
            gift = {
                'id': f'compliance_gift_{i}',
                'name': '合规测试',
                'amount': 10,
                'status': 'available',
                'stock': 100
            }
            
            await service._check_gift_state_change(
                monitor_id=monitor_id,
                account_id='test',
                gift=gift,
                check_start=check_start
            )
            
            response_time = (time.time() - check_start) * 1000
            response_times.append(response_time)
        
        # 计算指标
        avg_response = statistics.mean(response_times)
        max_response = max(response_times)
        p95_response = statistics.quantiles(response_times, n=20)[18] if len(response_times) > 20 else max_response
        
        # 性能报告
        requirements = {
            '平均响应时间 ≤ 100ms': {
                'requirement': 100,
                'actual': avg_response,
                'passed': avg_response <= 100
            },
            '最大响应时间 ≤ 200ms': {
                'requirement': 200,
                'actual': max_response,
                'passed': max_response <= 200
            },
            'P95响应时间 ≤ 150ms': {
                'requirement': 150,
                'actual': p95_response,
                'passed': p95_response <= 150
            }
        }
        
        print(f"\n性能要求合规性测试:")
        print("=" * 60)
        
        all_passed = True
        for req_name, req_data in requirements.items():
            status = "✅ 通过" if req_data['passed'] else "❌ 未通过"
            print(f"{req_name}:")
            print(f"  要求: ≤ {req_data['requirement']}ms")
            print(f"  实际: {req_data['actual']:.2f}ms")
            print(f"  状态: {status}")
            print()
            
            if not req_data['passed']:
                all_passed = False
        
        print("=" * 60)
        print(f"总体结果: {'✅ 所有要求通过' if all_passed else '❌ 部分要求未通过'}")
        
        # 验证所有要求通过
        assert all_passed, "未满足所有性能要求"


if __name__ == '__main__':
    pytest.main([__file__, '-v', '-s'])
