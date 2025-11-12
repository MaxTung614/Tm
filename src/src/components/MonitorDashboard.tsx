/**
 * 监控仪表板组件
 * 集成监控系统和会话健康检查的完整UI
 */
import React, { useState } from 'react';
import {
  useMonitor,
  usePerformancePolling,
  useMonitorStats,
} from '../hooks/useMonitor';
import {
  useSessionHealth,
  useHealthStatusPolling,
  useHealthMetrics,
} from '../hooks/useSessionHealth';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';

// ==================== 性能统计卡片 ====================

export function PerformanceCard() {
  const { performance, loading } = usePerformancePolling(5000);

  if (!performance) {
    return <Card className="p-4">加载中...</Card>;
  }

  const getResponseColor = (ms: number) => {
    if (ms < 50) return 'text-green-600';
    if (ms < 100) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">系统性能</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-sm text-gray-500">活跃监控</p>
          <p className="text-2xl font-bold">{performance.active_monitors}</p>
          <p className="text-xs text-gray-400">
            / {performance.total_monitors} 总计
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-500">平均响应</p>
          <p className={`text-2xl font-bold ${getResponseColor(performance.overall_avg_response_ms)}`}>
            {performance.overall_avg_response_ms.toFixed(1)}
            <span className="text-sm ml-1">ms</span>
          </p>
          <p className="text-xs text-gray-400">
            最小 {performance.min_response_ms.toFixed(1)}ms
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-500">总检查</p>
          <p className="text-2xl font-bold">{performance.total_checks.toLocaleString()}</p>
          <p className="text-xs text-gray-400">次</p>
        </div>

        <div>
          <p className="text-sm text-gray-500">状态变化</p>
          <p className="text-2xl font-bold text-blue-600">
            {performance.total_state_changes}
          </p>
          <p className="text-xs text-gray-400">次检测</p>
        </div>
      </div>

      {loading && (
        <div className="mt-2 text-xs text-gray-400">更新中...</div>
      )}
    </Card>
  );
}

// ==================== 监控列表组件 ====================

export function MonitorList() {
  const { monitors, stopMonitor, loading } = useMonitor();
  const [selectedMonitor, setSelectedMonitor] = useState<string | null>(null);

  const handleStop = async (monitorId: string) => {
    if (confirm('确定要停止这个监控任务吗？')) {
      try {
        await stopMonitor(monitorId);
      } catch (err) {
        alert('停止失败: ' + (err instanceof Error ? err.message : '未知错误'));
      }
    }
  };

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">活跃监控</h3>
        <Badge variant="secondary">{monitors.length} 个任务</Badge>
      </div>

      {monitors.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>暂无活跃监控</p>
          <p className="text-sm mt-2">点击"启动监控"开始监控礼包</p>
        </div>
      ) : (
        <div className="space-y-2">
          {monitors.map((monitor) => (
            <MonitorItem
              key={monitor.monitor_id}
              monitor={monitor}
              isSelected={selectedMonitor === monitor.monitor_id}
              onSelect={() => setSelectedMonitor(monitor.monitor_id)}
              onStop={() => handleStop(monitor.monitor_id)}
              disabled={loading}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

function MonitorItem({
  monitor,
  isSelected,
  onSelect,
  onStop,
  disabled,
}: {
  monitor: any;
  isSelected: boolean;
  onSelect: () => void;
  onStop: () => void;
  disabled: boolean;
}) {
  const { stats, responseLevel } = useMonitorStats(monitor.monitor_id);

  return (
    <div
      className={`
        p-3 border rounded-lg cursor-pointer transition-colors
        ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
      `}
      onClick={onSelect}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium">{monitor.config.account_id}</p>
            <Badge variant={monitor.is_running ? 'success' : 'secondary'}>
              {monitor.is_running ? '运行中' : '已停止'}
            </Badge>
            {responseLevel && (
              <Badge
                variant={responseLevel.level === 'excellent' ? 'success' : 'warning'}
              >
                {responseLevel.text}
              </Badge>
            )}
          </div>

          {stats && (
            <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
              <div>
                <span className="text-gray-500">检查: </span>
                <span className="font-medium">{stats.total_checks}</span>
              </div>
              <div>
                <span className="text-gray-500">变化: </span>
                <span className="font-medium">{stats.state_changes}</span>
              </div>
              <div>
                <span className="text-gray-500">响应: </span>
                <span className={`font-medium text-${responseLevel?.color}-600`}>
                  {stats.avg_response_time.toFixed(1)}ms
                </span>
              </div>
            </div>
          )}

          {monitor.current_interval && (
            <p className="mt-1 text-xs text-gray-500">
              当前间隔: {monitor.current_interval}s
            </p>
          )}
        </div>

        <Button
          onClick={(e) => {
            e.stopPropagation();
            onStop();
          }}
          variant="destructive"
          size="sm"
          disabled={disabled}
        >
          停止
        </Button>
      </div>
    </div>
  );
}

// ==================== 会话健康卡片 ====================

export function HealthCheckCard() {
  const {
    startHealthCheck,
    stopHealthCheck,
    checkAllAccounts,
    loading,
  } = useSessionHealth();
  
  const { status } = useHealthStatusPolling(10000);
  const { healthRate, healthLevel, activeService } = useHealthMetrics(status);

  const handleStart = async () => {
    try {
      await startHealthCheck({
        check_interval: 3600,
        use_enhanced: true,
      });
    } catch (err) {
      alert('启动失败: ' + (err instanceof Error ? err.message : '未知错误'));
    }
  };

  const handleStop = async () => {
    if (confirm('确定要停止健康检查服务吗？')) {
      try {
        await stopHealthCheck();
      } catch (err) {
        alert('停止失败: ' + (err instanceof Error ? err.message : '未知错误'));
      }
    }
  };

  const handleCheckAll = async () => {
    try {
      const result = await checkAllAccounts();
      if (result) {
        alert(`检查完成！
健康账号: ${result.healthy}
异常账号: ${result.unhealthy}
耗时: ${result.check_duration.toFixed(2)}秒`);
      }
    } catch (err) {
      alert('检查失败: ' + (err instanceof Error ? err.message : '未知错误'));
    }
  };

  const isRunning = status?.is_running || false;

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">会话健康</h3>
        <Badge variant={isRunning ? 'success' : 'secondary'}>
          {isRunning ? '运行中' : '未启动'}
        </Badge>
      </div>

      {activeService && (
        <>
          {/* 健康度进度条 */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-500">系统健康度</span>
              <span className={`font-bold text-${healthLevel?.color}-600`}>
                {healthRate}%
              </span>
            </div>
            <Progress value={healthRate} className="h-2" />
            {healthLevel && (
              <p className="text-xs text-gray-500 mt-1">
                状态: {healthLevel.text}
              </p>
            )}
          </div>

          {/* 账号统计 */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold">
                {activeService.current_status.total_accounts}
              </p>
              <p className="text-xs text-gray-500">总账号</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {activeService.current_status.healthy_accounts}
              </p>
              <p className="text-xs text-gray-500">健康</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {activeService.current_status.unhealthy_accounts}
              </p>
              <p className="text-xs text-gray-500">异常</p>
            </div>
          </div>

          {/* 检查信息 */}
          <div className="text-xs text-gray-500 space-y-1 mb-4">
            <p>总检查次数: {activeService.total_checks}</p>
            <p>检查间隔: {activeService.check_interval}秒</p>
            {activeService.last_check && (
              <p>上次检查: {new Date(activeService.last_check).toLocaleString('zh-CN')}</p>
            )}
          </div>
        </>
      )}

      {/* 控制按钮 */}
      <div className="space-y-2">
        {!isRunning ? (
          <Button 
            onClick={handleStart} 
            disabled={loading}
            className="w-full"
          >
            启动健康检查
          </Button>
        ) : (
          <Button 
            onClick={handleStop} 
            variant="destructive" 
            disabled={loading}
            className="w-full"
          >
            停止健康检查
          </Button>
        )}
        
        <Button 
          onClick={handleCheckAll} 
          variant="outline" 
          disabled={loading}
          className="w-full"
        >
          立即检查所有账号
        </Button>
      </div>
    </Card>
  );
}

// ==================== 启动监控对话框 ====================

export function StartMonitorDialog({ accountId }: { accountId: string }) {
  const { startMonitor, loading } = useMonitor();
  const [useAdaptive, setUseAdaptive] = useState(true);
  const [interval, setInterval] = useState(0.5);

  const handleStart = async () => {
    try {
      await startMonitor({
        account_id: accountId,
        check_interval: interval,
        use_adaptive: useAdaptive,
      });
      alert('监控已启动！');
    } catch (err) {
      alert('启动失败: ' + (err instanceof Error ? err.message : '未知错误'));
    }
  };

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">启动监控</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            账号ID
          </label>
          <input
            type="text"
            value={accountId}
            disabled
            className="w-full px-3 py-2 border rounded-md bg-gray-50"
          />
        </div>

        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={useAdaptive}
              onChange={(e) => setUseAdaptive(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">使用自适应监控</span>
          </label>
          <p className="text-xs text-gray-500 mt-1">
            自动调整检查频率（300ms-2s）
          </p>
        </div>

        {!useAdaptive && (
          <div>
            <label className="block text-sm font-medium mb-1">
              检查间隔（秒）
            </label>
            <input
              type="number"
              value={interval}
              onChange={(e) => setInterval(parseFloat(e.target.value))}
              min="0.1"
              max="10"
              step="0.1"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        )}

        <Button
          onClick={handleStart}
          disabled={loading}
          className="w-full"
        >
          {loading ? '启动中...' : '启动监控'}
        </Button>
      </div>
    </Card>
  );
}

// ==================== 完整仪表板 ====================

export function MonitorDashboard() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">监控仪表板</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：性能和健康 */}
        <div className="lg:col-span-2 space-y-6">
          <PerformanceCard />
          <MonitorList />
        </div>

        {/* 右侧：控制面板 */}
        <div className="space-y-6">
          <HealthCheckCard />
        </div>
      </div>
    </div>
  );
}

export default MonitorDashboard;
