/**
 * 监控页面 - 实时监控和会话健康
 */
import { useState } from 'react';
import { toast } from 'sonner';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Activity, Zap, Heart, TrendingUp, Clock, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

// ==================== 性能统计卡片 ====================

function PerformanceCard() {
  const { performance, loading } = usePerformancePolling(5000);

  if (!performance) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </Card>
    );
  }

  const getResponseColor = (ms: number) => {
    if (ms < 50) return 'text-green-600';
    if (ms < 100) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">系统性能</CardTitle>
          <Activity className="w-5 h-5 text-blue-500" />
        </div>
        <CardDescription>实时性能监控数据</CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">活跃监控</p>
            <p className="text-2xl font-bold text-blue-600">{performance.active_monitors}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              / {performance.total_monitors} 总计
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1">平均响应</p>
            <p className={`text-2xl font-bold ${getResponseColor(performance.overall_avg_response_ms)}`}>
              {performance.overall_avg_response_ms.toFixed(1)}
              <span className="text-sm ml-1">ms</span>
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              最小 {performance.min_response_ms.toFixed(1)}ms
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1">总检查</p>
            <p className="text-2xl font-bold text-purple-600">{performance.total_checks.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-0.5">次</p>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1">状态变化</p>
            <p className="text-2xl font-bold text-orange-600">
              {performance.total_state_changes}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">次检测</p>
          </div>
        </div>

        {loading && (
          <div className="mt-3 text-xs text-gray-400 flex items-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-2"></div>
            实时更新中...
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ==================== 监控列表组件 ====================

function MonitorList() {
  const { monitors, stopMonitor, loading } = useMonitor();
  const [selectedMonitor, setSelectedMonitor] = useState<string | null>(null);

  const handleStop = async (monitorId: string) => {
    try {
      await stopMonitor(monitorId);
      toast.success('监控已停止');
    } catch (err) {
      toast.error('停止失败: ' + (err instanceof Error ? err.message : '未知错误'));
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg">活跃监控</CardTitle>
            <CardDescription>当前运行的监控任务</CardDescription>
          </div>
          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
            {monitors.length} 个任务
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        {monitors.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-1">暂无活跃监控</p>
            <p className="text-xs text-gray-400">在下方启动新的监控任务</p>
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
      </CardContent>
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

  const getResponseColor = (level: string) => {
    switch (level) {
      case 'excellent': return 'bg-green-100 text-green-700';
      case 'good': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-red-100 text-red-700';
    }
  };

  return (
    <div
      className={`
        p-3 border rounded-lg cursor-pointer transition-all
        ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}
      `}
      onClick={onSelect}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <p className="font-medium text-sm">{monitor.config.account_id}</p>
            <Badge variant={monitor.is_running ? 'default' : 'secondary'} className="text-xs">
              {monitor.is_running ? '运行中' : '已停止'}
            </Badge>
            {responseLevel && (
              <Badge className={`text-xs ${getResponseColor(responseLevel.level)}`}>
                {responseLevel.text}
              </Badge>
            )}
          </div>

          {stats && (
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="flex items-center">
                <Clock className="w-3 h-3 mr-1 text-gray-400" />
                <span className="text-gray-500">检查: </span>
                <span className="font-medium ml-1">{stats.total_checks}</span>
              </div>
              <div className="flex items-center">
                <TrendingUp className="w-3 h-3 mr-1 text-gray-400" />
                <span className="text-gray-500">变化: </span>
                <span className="font-medium ml-1">{stats.state_changes}</span>
              </div>
              <div className="flex items-center">
                <Zap className="w-3 h-3 mr-1 text-gray-400" />
                <span className="text-gray-500">响应: </span>
                <span className={`font-medium ml-1 ${responseLevel ? 'text-' + responseLevel.color + '-600' : ''}`}>
                  {stats.avg_response_time.toFixed(1)}ms
                </span>
              </div>
            </div>
          )}

          {monitor.current_interval && (
            <p className="mt-1.5 text-xs text-gray-500">
              当前间隔: {monitor.current_interval}s (自适应)
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

function HealthCheckCard() {
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
      toast.success('健康检查已启动');
    } catch (err) {
      toast.error('启动失败: ' + (err instanceof Error ? err.message : '未知错误'));
    }
  };

  const handleStop = async () => {
    try {
      await stopHealthCheck();
      toast.success('健康检查已停止');
    } catch (err) {
      toast.error('停止失败: ' + (err instanceof Error ? err.message : '未知错误'));
    }
  };

  const handleCheckAll = async () => {
    try {
      const result = await checkAllAccounts();
      if (result) {
        toast.success(`检查完成！健康: ${result.healthy} | 异常: ${result.unhealthy}`, {
          description: `耗时: ${result.check_duration.toFixed(2)}秒`,
        });
      }
    } catch (err) {
      toast.error('检查失败: ' + (err instanceof Error ? err.message : '未知错误'));
    }
  };

  const isRunning = status?.is_running || false;

  const getHealthColor = (rate: number) => {
    if (rate >= 90) return 'bg-green-500';
    if (rate >= 70) return 'bg-yellow-500';
    if (rate >= 50) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            <CardTitle className="text-lg">会话健康</CardTitle>
          </div>
          <Badge variant={isRunning ? 'default' : 'secondary'} className={isRunning ? 'bg-green-500' : ''}>
            {isRunning ? '运行中' : '未启动'}
          </Badge>
        </div>
        <CardDescription>24小时Cookie健康监控</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {activeService && (
          <>
            {/* 健康度进度条 */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">系统健康度</span>
                <span className={`font-bold text-${healthLevel?.color}-600`}>
                  {healthRate}%
                </span>
              </div>
              <div className="relative">
                <Progress value={healthRate} className="h-3" />
                <div 
                  className={`absolute top-0 left-0 h-3 rounded-full transition-all ${getHealthColor(healthRate)}`}
                  style={{ width: `${healthRate}%` }}
                />
              </div>
              {healthLevel && (
                <p className="text-xs text-gray-500 mt-1.5 flex items-center">
                  {healthRate >= 90 ? (
                    <CheckCircle2 className="w-3 h-3 mr-1 text-green-500" />
                  ) : (
                    <AlertCircle className="w-3 h-3 mr-1 text-yellow-500" />
                  )}
                  状态: {healthLevel.text}
                </p>
              )}
            </div>

            {/* 账号统计 */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-2 bg-gray-50 rounded">
                <p className="text-xl font-bold text-gray-700">
                  {activeService.current_status.total_accounts}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">总账号</p>
              </div>
              <div className="text-center p-2 bg-green-50 rounded">
                <p className="text-xl font-bold text-green-600">
                  {activeService.current_status.healthy_accounts}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">健康</p>
              </div>
              <div className="text-center p-2 bg-red-50 rounded">
                <p className="text-xl font-bold text-red-600">
                  {activeService.current_status.unhealthy_accounts}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">异常</p>
              </div>
            </div>

            {/* 检查信息 */}
            <div className="text-xs text-gray-500 space-y-1 bg-gray-50 p-3 rounded">
              <div className="flex justify-between">
                <span>总检查次数:</span>
                <span className="font-medium">{activeService.total_checks}</span>
              </div>
              <div className="flex justify-between">
                <span>检查间隔:</span>
                <span className="font-medium">{activeService.check_interval}秒</span>
              </div>
              {activeService.last_check && (
                <div className="flex justify-between">
                  <span>上次检查:</span>
                  <span className="font-medium">{new Date(activeService.last_check).toLocaleString('zh-CN')}</span>
                </div>
              )}
            </div>
          </>
        )}

        {/* 控制按钮 */}
        <div className="space-y-2 pt-2">
          {!isRunning ? (
            <Button 
              onClick={handleStart} 
              disabled={loading}
              className="w-full"
            >
              <Heart className="w-4 h-4 mr-2" />
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
            <Activity className="w-4 h-4 mr-2" />
            立即检查所有账号
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ==================== 主页面组件 ====================

export default function Monitor() {
  const { startMonitor, loading } = useMonitor();
  const [accountId, setAccountId] = useState('');

  const handleStartMonitor = async () => {
    if (!accountId.trim()) {
      toast.error('请输入账号ID');
      return;
    }

    try {
      await startMonitor({
        account_id: accountId,
        use_adaptive: true,
      });
      toast.success('监控已启动');
      setAccountId('');
    } catch (err) {
      toast.error('启动失败: ' + (err instanceof Error ? err.message : '未知错误'));
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">📊 实时监控中心</h1>
        <p className="text-sm text-gray-600 mt-1">
          WebSocket实时监控 + 会话健康检查 - 响应速度提升125倍
        </p>
      </div>

      {/* 性能统计 */}
      <PerformanceCard />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：监控列表 */}
        <div className="lg:col-span-2 space-y-6">
          <MonitorList />

          {/* 启动新监控 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">启动新监控</CardTitle>
              <CardDescription>为账号启动实时礼包监控</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  账号ID
                </label>
                <input
                  type="text"
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  placeholder="输入账号ID"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleStartMonitor()}
                />
                <p className="text-xs text-gray-500 mt-1">
                  自动使用自适应监控（300ms-2s智能调整）
                </p>
              </div>

              <Button
                onClick={handleStartMonitor}
                disabled={loading || !accountId.trim()}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    启动中...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    启动监控
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* 右侧：健康检查 */}
        <div>
          <HealthCheckCard />
        </div>
      </div>
    </div>
  );
}
