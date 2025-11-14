/**
 * Supabase 连接状态显示组件
 * 在页面顶部显示 Supabase 连接状态
 */

import { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Loader2, 
  Database,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { testSupabaseConnection } from '../lib/supabase-test';

interface ConnectionStatus {
  configured: boolean;
  connected: boolean;
  tablesExist: boolean;
  canWrite: boolean;
  canRead: boolean;
  errors: string[];
}

export function SupabaseConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  // 自动检查连接状态
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setIsLoading(true);
    try {
      const results = await testSupabaseConnection();
      setStatus(results);
      setLastChecked(new Date());
    } catch (error) {
      console.error('连接检查失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!status && !isLoading) {
    return null;
  }

  const isFullyConnected = status?.configured && 
                          status?.connected && 
                          status?.tablesExist && 
                          status?.canWrite && 
                          status?.canRead;

  const hasPartialConnection = status?.configured && status?.connected;

  return (
    <Card className={`mb-4 ${
      isFullyConnected ? 'border-green-200 bg-green-50' :
      hasPartialConnection ? 'border-yellow-200 bg-yellow-50' :
      'border-red-200 bg-red-50'
    }`}>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between">
          {/* 左侧状态信息 */}
          <div className="flex items-center gap-3">
            <Database className={`w-5 h-5 ${
              isFullyConnected ? 'text-green-600' :
              hasPartialConnection ? 'text-yellow-600' :
              'text-red-600'
            }`} />
            
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {isLoading ? 'Supabase 检测中...' :
                   isFullyConnected ? 'Supabase 已连接' :
                   hasPartialConnection ? 'Supabase 部分连接' :
                   'Supabase 未配置'}
                </span>
                
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                ) : isFullyConnected ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                ) : hasPartialConnection ? (
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
              </div>
              
              {lastChecked && (
                <span className="text-xs text-gray-500">
                  最后检查: {lastChecked.toLocaleTimeString('zh-CN')}
                </span>
              )}
            </div>
          </div>

          {/* 右侧操作按钮 */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={checkConnection}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              刷新
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* 展开的详细信息 */}
        {isExpanded && status && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <StatusItem
                label="配置"
                status={status.configured}
                loading={isLoading}
              />
              <StatusItem
                label="连接"
                status={status.connected}
                loading={isLoading}
              />
              <StatusItem
                label="数据表"
                status={status.tablesExist}
                loading={isLoading}
              />
              <StatusItem
                label="写入"
                status={status.canWrite}
                loading={isLoading}
              />
              <StatusItem
                label="读取"
                status={status.canRead}
                loading={isLoading}
              />
            </div>

            {/* 错误信息 */}
            {status.errors && status.errors.length > 0 && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-red-800 mb-1">检测到以下问题：</p>
                    <ul className="list-disc list-inside space-y-1 text-red-700">
                      {status.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                    <p className="mt-2 text-red-600">
                      💡 请参考 <a href="/docs/SUPABASE-SETUP-GUIDE.md" className="underline">Supabase 设置指南</a>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 成功提示 */}
            {isFullyConnected && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center gap-2 text-sm text-green-800">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>🎉 Supabase 后端运行正常！所有功能可用。</span>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// 状态项组件
function StatusItem({ label, status, loading }: { 
  label: string; 
  status: boolean; 
  loading: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-2 bg-white rounded-md border border-gray-200">
      <div className="text-xs text-gray-600 mb-1">{label}</div>
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
      ) : (
        <Badge 
          variant={status ? 'default' : 'destructive'}
          className="text-xs"
        >
          {status ? '✓' : '✗'}
        </Badge>
      )}
    </div>
  );
}
