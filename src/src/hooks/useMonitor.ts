/**
 * 监控系统前端集成 Hook
 * 提供完整的监控管理功能
 */
import { useState, useEffect, useCallback, useRef } from 'react';

// ==================== 类型定义 ====================

export interface MonitorConfig {
  monitor_id: string;
  account_id: string;
  gift_ids: string[] | null;
  check_interval: number;
  started_at: string;
  status: 'running' | 'stopped';
}

export interface MonitorStats {
  total_checks: number;
  state_changes: number;
  avg_response_time: number;
  min_response_time: number;
  max_response_time: number;
  total_response_time?: number;
}

export interface MonitorStatus {
  success: boolean;
  monitor_id: string;
  config: MonitorConfig;
  stats: MonitorStats;
  is_running: boolean;
  gift_count: number;
  current_interval?: number;
}

export interface StartMonitorRequest {
  account_id: string;
  gift_ids?: string[];
  check_interval?: number;
  use_adaptive?: boolean;
}

export interface PerformanceStats {
  total_monitors: number;
  active_monitors: number;
  total_checks: number;
  total_state_changes: number;
  overall_avg_response_ms: number;
  min_response_ms: number;
  max_response_ms: number;
  basic_service?: any;
  optimized_service?: any;
  timestamp?: string;
}

// ==================== API 工具函数 ====================

const API_BASE = '/api/monitor';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '请求失败' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// ==================== 主Hook: useMonitor ====================

/**
 * 监控管理 Hook
 * 提供监控的启动、停止、查询等完整功能
 */
export function useMonitor() {
  const [monitors, setMonitors] = useState<MonitorStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 启动监控
   */
  const startMonitor = useCallback(async (request: StartMonitorRequest) => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchJson<any>(`${API_BASE}/start`, {
        method: 'POST',
        body: JSON.stringify(request),
      });

      if (data.success) {
        // 刷新监控列表
        await fetchMonitors();
        return data;
      } else {
        throw new Error(data.error || '启动监控失败');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '启动监控失败';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 停止监控
   */
  const stopMonitor = useCallback(async (monitorId: string) => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchJson<any>(`${API_BASE}/stop/${monitorId}`, {
        method: 'POST',
      });

      if (data.success) {
        // 刷新监控列表
        await fetchMonitors();
        return data;
      } else {
        throw new Error(data.error || '停止监控失败');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '停止监控失败';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 获取监控列表
   */
  const fetchMonitors = useCallback(async () => {
    try {
      const data = await fetchJson<any>(`${API_BASE}/list`);

      if (data.success) {
        setMonitors(data.monitors || []);
      }
    } catch (err) {
      console.error('获取监控列表失败:', err);
    }
  }, []);

  /**
   * 获取单个监控状态
   */
  const fetchMonitorStatus = useCallback(async (monitorId: string): Promise<MonitorStatus | null> => {
    try {
      const data = await fetchJson<MonitorStatus>(`${API_BASE}/status/${monitorId}`);

      if (data.success) {
        return data;
      }
      return null;
    } catch (err) {
      console.error('获取监控状态失败:', err);
      return null;
    }
  }, []);

  /**
   * 获取性能统计
   */
  const fetchPerformance = useCallback(async (): Promise<PerformanceStats | null> => {
    try {
      const data = await fetchJson<any>(`${API_BASE}/performance`);

      if (data.success) {
        return data.stats;
      }
      return null;
    } catch (err) {
      console.error('获取性能统计失败:', err);
      return null;
    }
  }, []);

  /**
   * 清理已停止的监控
   */
  const cleanupMonitors = useCallback(async () => {
    try {
      const data = await fetchJson<any>(`${API_BASE}/cleanup`, {
        method: 'POST',
      });

      if (data.success) {
        await fetchMonitors();
        return data;
      }
    } catch (err) {
      console.error('清理监控失败:', err);
    }
  }, [fetchMonitors]);

  /**
   * 初始化时加载监控列表
   */
  useEffect(() => {
    fetchMonitors();
  }, [fetchMonitors]);

  return {
    monitors,
    loading,
    error,
    startMonitor,
    stopMonitor,
    fetchMonitors,
    fetchMonitorStatus,
    fetchPerformance,
    cleanupMonitors,
  };
}

// ==================== 轮询Hook ====================

/**
 * 监控状态轮询 Hook
 * 用于实时更新单个监控的状态
 * 
 * @param monitorId 监控ID
 * @param interval 轮询间隔（毫秒），默认2000ms
 */
export function useMonitorPolling(monitorId: string | null, interval: number = 2000) {
  const [status, setStatus] = useState<MonitorStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();

  const fetchStatus = useCallback(async () => {
    if (!monitorId) return;

    setLoading(true);
    try {
      const data = await fetchJson<MonitorStatus>(`${API_BASE}/status/${monitorId}`);

      if (data.success) {
        setStatus(data);
      }
    } catch (err) {
      console.error('轮询监控状态失败:', err);
    } finally {
      setLoading(false);
    }
  }, [monitorId]);

  useEffect(() => {
    if (!monitorId) {
      setStatus(null);
      return;
    }

    // 立即获取一次
    fetchStatus();

    // 开始轮询
    intervalRef.current = setInterval(fetchStatus, interval);

    // 清理
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [monitorId, interval, fetchStatus]);

  return { status, loading, refresh: fetchStatus };
}

/**
 * 性能统计轮询 Hook
 * 用于实时更新系统整体性能统计
 * 
 * @param interval 轮询间隔（毫秒），默认5000ms
 */
export function usePerformancePolling(interval: number = 5000) {
  const [performance, setPerformance] = useState<PerformanceStats | null>(null);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();

  const fetchPerformance = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchJson<any>(`${API_BASE}/performance`);

      if (data.success) {
        setPerformance(data.stats);
      }
    } catch (err) {
      console.error('轮询性能统计失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // 立即获取一次
    fetchPerformance();

    // 开始轮询
    intervalRef.current = setInterval(fetchPerformance, interval);

    // 清理
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [interval, fetchPerformance]);

  return { performance, loading, refresh: fetchPerformance };
}

// ==================== 自��应轮询Hook ====================

/**
 * 自适应轮询 Hook
 * 根据数据变化智能调整轮询频率
 * 
 * @param monitorId 监控ID
 */
export function useAdaptiveMonitorPolling(monitorId: string | null) {
  const [interval, setInterval] = useState(5000); // 默认5秒
  const prevChangeCount = useRef(0);
  
  const { status, loading, refresh } = useMonitorPolling(monitorId, interval);

  // 根据状态变化调整轮询频率
  useEffect(() => {
    if (!status) return;

    const currentChangeCount = status.stats.state_changes;
    const changesDiff = currentChangeCount - prevChangeCount.current;

    if (changesDiff > 10) {
      // 高频变化：1秒轮询
      setInterval(1000);
    } else if (changesDiff > 0) {
      // 有变化：2秒轮询
      setInterval(2000);
    } else {
      // 无变化：5秒轮询
      setInterval(5000);
    }

    prevChangeCount.current = currentChangeCount;
  }, [status]);

  return { status, loading, refresh, currentInterval: interval };
}

// ==================== 工具Hook ====================

/**
 * 监控统计Hook
 * 提供监控的统计和分析数据
 */
export function useMonitorStats(monitorId: string | null) {
  const { status } = useMonitorPolling(monitorId, 2000);

  const stats = status?.stats;

  // 计算响应速度等级
  const getResponseLevel = useCallback((avgTime: number) => {
    if (avgTime < 50) return { level: 'excellent', color: 'green', text: '优秀' };
    if (avgTime < 100) return { level: 'good', color: 'yellow', text: '良好' };
    return { level: 'poor', color: 'red', text: '需优化' };
  }, []);

  // 计算效率分数
  const getEfficiencyScore = useCallback((stats: MonitorStats) => {
    const responseScore = Math.max(0, 100 - stats.avg_response_time);
    const changeRate = stats.total_checks > 0 
      ? (stats.state_changes / stats.total_checks) * 100 
      : 0;
    
    return Math.round((responseScore + changeRate) / 2);
  }, []);

  return {
    stats,
    responseLevel: stats ? getResponseLevel(stats.avg_response_time) : null,
    efficiencyScore: stats ? getEfficiencyScore(stats) : 0,
  };
}
