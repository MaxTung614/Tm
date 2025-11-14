import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Activity, CheckCircle, XCircle, Clock } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'error' | 'warning';
  message: string;
  details?: string;
}

export default function Monitor() {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    // 模拟日志数据
    const sampleLogs: LogEntry[] = [
      {
        id: '1',
        timestamp: new Date().toISOString(),
        level: 'info',
        message: '系统启动',
        details: '监控系统已启动'
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 60000).toISOString(),
        level: 'success',
        message: '抢购成功',
        details: '账号: test@example.com, 礼品: 10元红包'
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 120000).toISOString(),
        level: 'warning',
        message: 'Cookie 即将过期',
        details: '请及时更新账号 Cookie'
      }
    ];
    setLogs(sampleLogs);
  }, []);

  const getLevelIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'success':
        return <CheckCircle className="size-4 text-green-500" />;
      case 'error':
        return <XCircle className="size-4 text-red-500" />;
      case 'warning':
        return <Activity className="size-4 text-yellow-500" />;
      default:
        return <Clock className="size-4 text-blue-500" />;
    }
  };

  const getLevelBadgeVariant = (level: LogEntry['level']) => {
    switch (level) {
      case 'success':
        return 'default';
      case 'error':
        return 'destructive';
      case 'warning':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1>实时监控</h1>
        <p className="text-muted-foreground">
          查看系统运行日志和状态
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>运行状态</CardTitle>
            <Activity className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-green-500 animate-pulse" />
              <span>正常运行</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>今日成功</CardTitle>
            <CheckCircle className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div>0 次</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>今日失败</CardTitle>
            <XCircle className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div>0 次</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>系统日志</CardTitle>
          <CardDescription>最近的系统活动记录</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                暂无日志记录
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="mt-1">{getLevelIcon(log.level)}</div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span>{log.message}</span>
                      <Badge variant={getLevelBadgeVariant(log.level)}>
                        {log.level}
                      </Badge>
                    </div>
                    {log.details && (
                      <p className="text-muted-foreground">{log.details}</p>
                    )}
                    <p className="text-muted-foreground">
                      {new Date(log.timestamp).toLocaleString('zh-CN')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
