/**
 * 网络请求拦截器和错误处理
 * 为fetch和XMLHttpRequest添加统一的错误处理和重试机制
 */

import { errorHandler, ErrorCategory, ErrorLevel, RequestInfo } from './error-handler';

interface RetryConfig {
  maxRetries: number;
  backoffMultiplier: number;
  initialDelay: number;
  maxDelay: number;
  retryableStatuses: number[];
}

interface RequestConfig extends RequestInit {
  retryConfig?: Partial<RetryConfig>;
  timeout?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

// 默认重试配置
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  backoffMultiplier: 2,
  initialDelay: 1000,
  maxDelay: 10000,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};

class NetworkError extends Error {
  public status?: number;
  public response?: Response;
  public request?: RequestInfo;

  constructor(message: string, status?: number, response?: Response, request?: RequestInfo) {
    super(message);
    this.name = 'NetworkError';
    this.status = status;
    this.response = response;
    this.request = request;
  }
}

/**
 * 创建可重试的fetch请求
 */
export async function fetchWithRetry(
  url: string,
  config: RequestConfig = {}
): Promise<Response> {
  const requestInfo: RequestInfo = {
    url,
    method: config.method || 'GET',
    headers: config.headers as Record<string, string> || {}
  };

  const finalConfig = { ...config };
  finalConfig.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config.retryConfig };
  finalConfig.timeout = config.timeout || 30000;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= finalConfig.retryConfig!.maxRetries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, finalConfig);
      
      // 如果响应成功，直接返回
      if (response.ok) {
        return response;
      }

      // 如果是不可重试的状态码，直接抛出错误
      if (!finalConfig.retryConfig!.retryableStatuses.includes(response.status)) {
        const networkError = new NetworkError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          response,
          requestInfo
        );
        
        errorHandler.handleNetworkError(networkError, requestInfo, response);
        throw networkError;
      }

      // 可重试的状态码，进入重试逻辑
      lastError = new NetworkError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        response,
        requestInfo
      );

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // 如果是最后一次尝试，记录错误并抛出
      if (attempt === finalConfig.retryConfig!.maxRetries) {
        errorHandler.handleNetworkError(lastError, requestInfo);
        throw lastError;
      }

      // 记录重试
      if (finalConfig.onRetry) {
        finalConfig.onRetry(attempt + 1, lastError);
      }

      // 等待重试延迟
      const delay = calculateBackoffDelay(
        attempt,
        finalConfig.retryConfig!.initialDelay,
        finalConfig.retryConfig!.backoffMultiplier,
        finalConfig.retryConfig!.maxDelay
      );

      await sleep(delay);
    }
  }

  // 如果到达这里，说明重试耗尽
  if (lastError) {
    errorHandler.handleNetworkError(lastError, requestInfo);
    throw lastError;
  }

  throw new Error('Unexpected error in fetchWithRetry');
}

/**
 * 带超时的fetch请求
 */
async function fetchWithTimeout(
  url: string,
  config: RequestConfig
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeout);

  try {
    const finalConfig: RequestInit = {
      ...config,
      signal: controller.signal,
    };

    return await fetch(url, finalConfig);
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * 计算退避延迟
 */
function calculateBackoffDelay(
  attempt: number,
  initialDelay: number,
  backoffMultiplier: number,
  maxDelay: number
): number {
  const delay = initialDelay * Math.pow(backoffMultiplier, attempt);
  return Math.min(delay, maxDelay);
}

/**
 * 等待函数
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * XMLHttpRequest拦截器包装器
 */
export class XHRInterceptor {
  private static originalXHR: typeof XMLHttpRequest;
  private static activeRequests = new Set<XMLHttpRequest>();

  static initialize() {
    if (this.originalXHR) {
      return; // 已经初始化过
    }

    this.originalXHR = window.XMLHttpRequest;

    const proxyXHR = () => {
      const xhr = new this.originalXHR();
      const originalOpen = xhr.open;
      const originalSend = xhr.send;
      const originalAbort = xhr.abort;
      const originalSetRequestHeader = xhr.setRequestHeader;

      let requestInfo: RequestInfo | null = null;

      const wrappedOpen = (method: string, url: string, ...args: any[]) => {
        requestInfo = {
          url: url.startsWith('http') ? url : new URL(url, window.location.origin).href,
          method: method.toUpperCase(),
        };
        return originalOpen.apply(xhr, [method, url, ...args]);
      };

      const wrappedSend = (body?: any) => {
        this.activeRequests.add(xhr);

        xhr.addEventListener('loadend', () => {
          this.activeRequests.delete(xhr);
        });

        xhr.addEventListener('error', () => {
          this.activeRequests.delete(xhr);
          if (requestInfo) {
            errorHandler.handleNetworkError(
              new Error('Network request failed'),
              requestInfo
            );
          }
        });

        xhr.addEventListener('timeout', () => {
          this.activeRequests.delete(xhr);
          if (requestInfo) {
            errorHandler.handleNetworkError(
              new Error('Network request timeout'),
              requestInfo
            );
          }
        });

        xhr.addEventListener('load', () => {
          if (requestInfo && xhr.status >= 400) {
            const networkError = new NetworkError(
              `HTTP ${xhr.status}: ${xhr.statusText}`,
              xhr.status,
              undefined,
              requestInfo
            );
            errorHandler.handleNetworkError(networkError, requestInfo);
          }
        });

        return originalSend.apply(xhr, [body]);
      };

      const wrappedAbort = () => {
        this.activeRequests.delete(xhr);
        return originalAbort.apply(xhr);
      };

      const wrappedSetRequestHeader = (header: string, value: string) => {
        if (requestInfo && requestInfo.headers) {
          requestInfo.headers[header] = value;
        }
        return originalSetRequestHeader.apply(xhr, [header, value]);
      };

      xhr.open = wrappedOpen;
      xhr.send = wrappedSend;
      xhr.abort = wrappedAbort;
      xhr.setRequestHeader = wrappedSetRequestHeader;

      return xhr;
    };

    // 替换全局XMLHttpRequest
    window.XMLHttpRequest = proxyXHR as any;
  }

  static restore() {
    if (this.originalXHR) {
      window.XMLHttpRequest = this.originalXHR;
      this.originalXHR = null;
    }
  }

  static getActiveRequests(): number {
    return this.activeRequests.size;
  }
}

/**
 * 初始化网络请求拦截器
 */
export function initializeNetworkInterceptors() {
  XHRInterceptor.initialize();
  
  // 注册错误处理器回调
  errorHandler.registerCallback((error) => {
    // 可以在这里添加额外的网络错误处理逻辑
    if (error.category === ErrorCategory.NETWORK) {
      console.warn('Network error detected:', error.message);
    }
  });
}

/**
 * 取消所有活动的网络请求
 */
export function abortAllRequests() {
  XHRInterceptor.getActiveRequests();
  // 注意：这里需要额外实现具体的取消逻辑
}

/**
 * 网络状态监听
 */
export class NetworkStatusMonitor {
  private static listeners: Array<(isOnline: boolean) => void> = [];
  private static isOnline = navigator.onLine;

  static initialize() {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  static cleanup() {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    this.listeners = [];
  }

  private static handleOnline = () => {
    this.isOnline = true;
    this.notifyListeners(true);
    errorHandler.handleError(
      'Network connection restored',
      ErrorLevel.INFO,
      ErrorCategory.NETWORK,
      { event: 'online' }
    );
  };

  private static handleOffline = () => {
    this.isOnline = false;
    this.notifyListeners(false);
    errorHandler.handleError(
      'Network connection lost',
      ErrorLevel.WARNING,
      ErrorCategory.NETWORK,
      { event: 'offline' }
    );
  };

  private static notifyListeners(isOnline: boolean) {
    this.listeners.forEach(listener => {
      try {
        listener(isOnline);
      } catch (error) {
        console.error('Error in network status listener:', error);
      }
    });
  }

  static subscribe(listener: (isOnline: boolean) => void): () => void {
    this.listeners.push(listener);
    
    // 返回取消订阅函数
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  static getIsOnline(): boolean {
    return this.isOnline;
  }
}

/**
 * 请求性能监控
 */
export class RequestPerformanceMonitor {
  private static metrics = new Map<string, PerformanceEntry[]>();

  static initialize() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name.startsWith('fetch') || entry.name.startsWith('xhr')) {
            const entries = this.metrics.get(entry.name) || [];
            entries.push(entry);
            this.metrics.set(entry.name, entries);
            
            // 记录慢请求
            if (entry.duration > 5000) { // 超过5秒的请求
              errorHandler.handleError(
                `Slow request detected: ${entry.name} took ${entry.duration.toFixed(2)}ms`,
                ErrorLevel.WARNING,
                ErrorCategory.NETWORK,
                {
                  duration: entry.duration,
                  entryType: entry.entryType,
                  startTime: entry.startTime
                }
              );
            }
          }
        }
      });
      
      observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] });
    }
  }

  static getMetrics(url: string): PerformanceEntry[] {
    return this.metrics.get(url) || [];
  }

  static getAverageResponseTime(url: string): number {
    const metrics = this.getMetrics(url);
    if (metrics.length === 0) return 0;
    
    const totalDuration = metrics.reduce((sum, entry) => sum + entry.duration, 0);
    return totalDuration / metrics.length;
  }
}

// 导出便利函数
export const safeFetch = fetchWithRetry;
export const isNetworkAvailable = () => NetworkStatusMonitor.getIsOnline();
export const subscribeToNetworkChanges = (callback: (isOnline: boolean) => void) =>
  NetworkStatusMonitor.subscribe(callback);

export default {
  fetchWithRetry,
  initializeNetworkInterceptors,
  NetworkStatusMonitor,
  RequestPerformanceMonitor,
  XHRInterceptor
};