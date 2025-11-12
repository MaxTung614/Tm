/**
 * 会话健康检查前端集成 Hook
 * 提供完整的会话健康管理功能
 */
import { useState, useEffect, useCallback, useRef } from 'react';

// ==================== 类型定义 ====================

export interface HealthCheckConfig {
  check_interval: number;
  use_enhanced: boolean;
}

export interface HealthStats {
  total_checks: number;
  expired_detected: number;
  renewed_detected: number;
  last_check_time: string | null;
  accounts_checked: number;
  healthy_accounts: number;
  unhealthy_accounts: number;
}

export interface ServiceHealthStatus {
  is_running: boolean;
  check_interval: number;
  last_check: string | null;
  total_checks: number;
  current_status: {
    healthy_accounts: number;
    unhealthy_accounts: number;
    total_accounts: number;
  };
}

export interface HealthStatusResponse {
  success: boolean;
  basic_service: ServiceHealthStatus;
  enhanced_service: ServiceHealthStatus;
  is_running: boolean;
}

export interface HealthStatsResponse {
  success: boolean;
  basic_service: {
    is_running: boolean;
    check_interval: number;
    stats: HealthStats;
  };
  enhanced_service: {
    is_running: boolean;
    check_interval: number;
    stats: HealthStats;
  };
  timestamp: string;
}

export interface AccountHealthResult {
  success: boolean;
  cookie_valid: boolean;
  account_id: string;
  account_name: string;
  reason?: string;
  message?: string;
  expired_at?: string;
  last_check?: string;
}

export interface CheckAllResult {
  success: boolean;
  total_accounts: number;
  healthy: number;
  unhealthy: number;
  expired_accounts: string[];
  renewed_accounts: string[];
  check_duration: number;
}

// ==================== API 工具函数 ====================

const API_BASE = '/api/session-health';

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

// ==================== 主Hook: useSessionHealth ====================

/**
 * 会话健康检查管理 Hook
 * 提供健康检查的启动、停止、查询等完整功能
 */
export function useSessionHealth() {
  const [healthStatus, setHealthStatus] = useState<HealthStatusResponse | null>(null);
  const [healthStats, setHealthStats] = useState<HealthStatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 启动健康检查
   */
  const startHealthCheck = useCallback(async (config?: HealthCheckConfig) => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchJson<any>(`${API_BASE}/start`, {
        method: 'POST',
        body: JSON.stringify(config || {
          check_interval: 3600,
          use_enhanced: true,
        }),
      });

      if (data.success) {
        // 刷新状态
        await fetchHealthStatus();
        return data;
      } else {
        throw new Error(data.error || '启动健康检查失败');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '启动健康检查失败';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 停止健康检查
   */
  const stopHealthCheck = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchJson<any>(`${API_BASE}/stop`, {
        method: 'POST',
      });

      if (data.success) {
        // 刷新状态
        await fetchHealthStatus();
        return data;
      } else {
        throw new Error(data.error || '停止健康检查失败');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '停止健康检查失败';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 获取健康状态
   */
  const fetchHealthStatus = useCallback(async () => {
    try {
      const data = await fetchJson<HealthStatusResponse>(`${API_BASE}/status`);

      if (data.success) {
        setHealthStatus(data);
      }
    } catch (err) {
      console.error('获取健康状态失败:', err);
    }
  }, []);

  /**
   * 获取统计数据
   */
  const fetchHealthStats = useCallback(async () => {
    try {
      const data = await fetchJson<HealthStatsResponse>(`${API_BASE}/stats`);

      if (data.success) {
        setHealthStats(data);
      }
    } catch (err) {
      console.error('获取统计数据失败:', err);
    }
  }, []);

  /**
   * 立即检查所有账号
   */
  const checkAllAccounts = useCallback(async (): Promise<CheckAllResult | null> => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchJson<any>(`${API_BASE}/check-all`, {
        method: 'POST',
      });

      if (data.success) {
        // 刷新统计数据
        await fetchHealthStats();
        return data.result;
      }
      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '检查所有账号失败';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchHealthStats]);

  /**
   * 检查单个账号
   */
  const checkSingleAccount = useCallback(async (accountId: string): Promise<AccountHealthResult | null> => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchJson<any>(`${API_BASE}/check-account/${accountId}`, {
        method: 'POST',
      });

      if (data.success) {
        return data.result;
      }
      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '检查账号失败';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 初始化时加载状态和统计
   */
  useEffect(() => {
    fetchHealthStatus();
    fetchHealthStats();
  }, [fetchHealthStatus, fetchHealthStats]);

  return {
    healthStatus,
    healthStats,
    loading,
    error,
    startHealthCheck,
    stopHealthCheck,
    fetchHealthStatus,
    fetchHealthStats,
    checkAllAccounts,
    checkSingleAccount,
  };
}

// ==================== 轮询Hook ====================

/**
 * 健康状态轮询 Hook
 * 用于实时更新健康检查状态
 * 
 * @param interval 轮询间隔（毫秒），默认10000ms (10秒)
 */
export function useHealthStatusPolling(interval: number = 10000) {
  const [status, setStatus] = useState<HealthStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchJson<HealthStatusResponse>(`${API_BASE}/status`);

      if (data.success) {
        setStatus(data);
      }
    } catch (err) {
      console.error('轮询健康状态失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
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
  }, [interval, fetchStatus]);

  return { status, loading, refresh: fetchStatus };
}

/**
 * 健康度计算 Hook
 * 提供系统健康度的计算和分析
 */
export function useHealthMetrics(status: HealthStatusResponse | null) {
  // 计算健康率
  const getHealthRate = useCallback((currentStatus: ServiceHealthStatus['current_status']) => {
    const { total_accounts, healthy_accounts } = currentStatus;
    
    if (total_accounts === 0) return 100;
    
    return Math.round((healthy_accounts / total_accounts) * 100);
  }, []);

  // 获取健康等级
  const getHealthLevel = useCallback((rate: number) => {
    if (rate >= 90) return { level: 'excellent', color: 'green', text: '优秀' };
    if (rate >= 70) return { level: 'good', color: 'yellow', text: '良好' };
    if (rate >= 50) return { level: 'warning', color: 'orange', text: '警告' };
    return { level: 'critical', color: 'red', text: '严重' };
  }, []);

  if (!status) {
    return {
      healthRate: 0,
      healthLevel: null,
      activeService: null,
    };
  }

  // 确定使用哪个服务的数据
  const activeService = status.enhanced_service.is_running 
    ? status.enhanced_service 
    : status.basic_service;

  const healthRate = getHealthRate(activeService.current_status);
  const healthLevel = getHealthLevel(healthRate);

  return {
    healthRate,
    healthLevel,
    activeService,
  };
}
