/**
 * 监控系统前端集成 Hook
 */
import { useState, useEffect, useCallback, useRef } from 'react';

// 类型定义
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
}

// API 基础路径
const API_BASE = '/api/monitor';

/**
 * 监控管理 Hook
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
      const response = await fetch(`${API_BASE}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '启动监控失败');
      }

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
      const response = await fetch(`${API_BASE}/stop/${monitorId}`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '停止监控失败');
      }

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
      const response = await fetch(`${API_BASE}/list`);
      const data = await response.json();

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
      const response = await fetch(`${API_BASE}/status/${monitorId}`);
      const data = await response.json();

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
      const response = await fetch(`${API_BASE}/performance`);
      const data = await response.json();

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
  };
}

/**
 * 监控状态轮询 Hook
 * 用于实时更新监控状态
 */
export function useMonitorPolling(monitorId: string | null, interval: number = 2000) {
  const [status, setStatus] = useState<MonitorStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();

  const fetchStatus = useCallback(async () => {
    if (!monitorId) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/status/${monitorId}`);
      const data = await response.json();

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
 */
export function usePerformancePolling(interval: number = 5000) {
  const [performance, setPerformance] = useState<PerformanceStats | null>(null);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();

  const fetchPerformance = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/performance`);
      const data = await response.json();

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
