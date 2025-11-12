/**
 * API客户端
 * 统一的HTTP请求封装
 */

import { API_BASE_URL, API_TIMEOUT, API_RETRY_CONFIG } from './api-config';
import { logError, logWarning, logInfo, ErrorCategory, ErrorLevel } from './error-handler';
import { mockApi, checkBackendAvailable } from './api-mock';

// 请求配置接口
interface RequestConfig extends RequestInit {
  params?: Record<string, any>;
  timeout?: number;
  retry?: boolean;
  retryCount?: number;
}

// API响应接口
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 重试配置
interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier: number;
  maxDelay: number;
}

// 默认重试配置
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: API_RETRY_CONFIG.maxRetries || 3,
  retryDelay: API_RETRY_CONFIG.retryDelay || 1000,
  backoffMultiplier: 1.5,
  maxDelay: 10000,
};

// 重试队列项接口
interface RetryQueueItem {
  requestKey: string;
  startTime: number;
  retryCount: number;
}

class ApiClient {
  private baseURL: string;
  private defaultTimeout: number;
  private useMockData: boolean = false;
  private backendCheckPromise: Promise<boolean> | null = null;
  
  // 待处理请求映射（用于请求去重和取消）
  private pendingRequests = new Map<string, AbortController>();
  
  // 重试队列（用于限流）
  private retryQueue = new Map<string, RetryQueueItem>();
  
  // 重试队列配置
  private readonly MAX_CONCURRENT_RETRIES = 3; // 最大并发重试数
  private readonly RETRY_QUEUE_TIMEOUT = 30000; // 重试队列项超时时间（30秒）

  constructor(baseURL: string = API_BASE_URL, timeout: number = API_TIMEOUT) {
    this.baseURL = baseURL;
    this.defaultTimeout = timeout;
    
    // 检查是否在演示模式或后端不可用
    this.checkBackendStatus();
    
    // 启动重试队列清理任务
    this.startRetryQueueCleanup();
  }
  
  /**
   * 检查后端状态
   */
  private async checkBackendStatus() {
    // 如果在Figma预览环境，直接使用Mock
    if (window.location.hostname.includes('figma')) {
      this.useMockData = true;
      logInfo('运行在演示模式，使用Mock数据', {
        hostname: window.location.hostname,
      });
      return;
    }
    
    // 避免重复检查
    if (this.backendCheckPromise) {
      return this.backendCheckPromise;
    }
    
    this.backendCheckPromise = checkBackendAvailable().then(available => {
      this.useMockData = !available;
      if (this.useMockData) {
        logWarning('后端服务不可用，切换到演示模式', {
          baseURL: this.baseURL,
        });
      } else {
        logInfo('后端服务可用', {
          baseURL: this.baseURL,
        });
      }
      return available;
    });
    
    return this.backendCheckPromise;
  }

  /**
   * 构建完整URL
   */
  private buildURL(endpoint: string, params?: Record<string, any>): string {
    const url = new URL(endpoint, this.baseURL);
    
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.append(key, String(params[key]));
        }
      });
    }
    
    return url.toString();
  }

  /**
   * 执行HTTP请求的通用方法（带重试机制）
   */
  private async request<T>(endpoint: string, config: RequestConfig = {}): Promise<ApiResponse<T>> {
    const { 
      params, 
      timeout = API_TIMEOUT,
      retry = true,
      retryCount = 0,
      ...requestConfig 
    } = config;

    const url = new URL(endpoint, this.baseURL);
    
    // 添加查询参数
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    // 生成请求唯一标识
    const requestKey = this.generateRequestKey(
      requestConfig.method || 'GET',
      url.toString(),
      requestConfig.body
    );

    // 检查是否有相同的请求正在进行
    if (this.pendingRequests.has(requestKey)) {
      logWarning('ApiClient', '检测到重复请求，取消前一个请求', ErrorCategory.NETWORK, {
        requestKey,
        url: url.toString(),
        method: requestConfig.method || 'GET'
      });
      
      // 取消前一个相同的请求
      const oldController = this.pendingRequests.get(requestKey)!;
      oldController.abort();
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // 注册当前请求
    this.pendingRequests.set(requestKey, controller);

    try {
      const startTime = Date.now();
      
      // 构建请求头
      const headers = {
        'Content-Type': 'application/json',
        ...requestConfig.headers,
      };

      // 添加认证令牌（如果存在）
      const token = localStorage.getItem('auth_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url.toString(), {
        ...requestConfig,
        headers,
        signal: controller.signal,
      });

      const duration = Date.now() - startTime;
      logInfo('ApiClient', `HTTP ${requestConfig.method || 'GET'} ${url.pathname} - ${response.status} (${duration}ms)`, ErrorCategory.UNKNOWN, {
        operation: 'api_request',
        url: url.toString(),
        status: response.status,
        duration,
        hasRetry: retry,
        retryCount
      });

      clearTimeout(timeoutId);

      // 处理HTTP错误状态
      if (!response.ok) {
        const errorData = await this.parseErrorResponse(response);
        
        // 检查是否应该重试
        const shouldRetry = retry && retryCount < DEFAULT_RETRY_CONFIG.maxRetries && 
                          this.shouldRetryRequest(response.status, errorData);
        
        if (shouldRetry) {
          // 检查重试队列是否已满
          if (!this.canAddToRetryQueue(requestKey, retryCount)) {
            logWarning('ApiClient', '重试队列已满，跳过重试', ErrorCategory.RATE_LIMIT, {
              requestKey,
              url: url.toString(),
              queueSize: this.retryQueue.size,
              maxSize: this.MAX_CONCURRENT_RETRIES
            });
            
            return {
              success: false,
              data: undefined,
              message: '系统繁忙，请稍后重试',
              error: 'RETRY_QUEUE_FULL',
            };
          }
          
          logWarning('ApiClient', `请求失败，准备重试 (${retryCount + 1}/${DEFAULT_RETRY_CONFIG.maxRetries})`, ErrorCategory.NETWORK, {
            operation: 'api_request_retry',
            url: url.toString(),
            status: response.status,
            retryCount,
            error: errorData.message
          });
          
          // 添加到重试队列
          this.addToRetryQueue(requestKey, retryCount + 1);
          
          try {
            // 延迟重试
            const delay = this.calculateRetryDelay(retryCount);
            await this.delay(delay);
            
            // 递归重试
            return await this.request<T>(endpoint, {
              ...config,
              retryCount: retryCount + 1
            });
          } finally {
            // 从重试队列移除
            this.removeFromRetryQueue(requestKey);
          }
        }
        
        if (response.status === 401) {
          // 认证失败，清除令牌并重定向到登录页
          this.handleUnauthorized();
        }
        
        return {
          success: false,
          data: undefined,
          message: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          error: errorData.error || response.statusText,
        };
      }

      // 解析响应数据
      const data = await this.parseResponse(response);
      
      return {
        success: true,
        data,
        message: 'success',
      };

    } catch (error: any) {
      clearTimeout(timeoutId);
      
      // 检查是否应该重试
      const shouldRetry = retry && retryCount < DEFAULT_RETRY_CONFIG.maxRetries &&
                        this.isRetryableError(error);
      
      if (shouldRetry) {
        // 检查重试队列是否已满
        if (!this.canAddToRetryQueue(requestKey, retryCount)) {
          logWarning('ApiClient', '重试队列已满，跳过重试', ErrorCategory.RATE_LIMIT, {
            requestKey,
            url: url.toString(),
            queueSize: this.retryQueue.size,
            maxSize: this.MAX_CONCURRENT_RETRIES
          });
          
          return {
            success: false,
            message: '系统繁忙，请稍后重试',
            error: 'RETRY_QUEUE_FULL',
          };
        }
        
        logWarning('ApiClient', `网络错误，准备重试 (${retryCount + 1}/${DEFAULT_RETRY_CONFIG.maxRetries})`, ErrorCategory.NETWORK, {
          operation: 'api_request_retry',
          url: url.toString(),
          error: error.message,
          retryCount
        });
        
        // 添加到重试队列
        this.addToRetryQueue(requestKey, retryCount + 1);
        
        try {
          // 延迟重试
          const delay = this.calculateRetryDelay(retryCount);
          await this.delay(delay);
          
          // 递归重试
          return await this.request<T>(endpoint, {
            ...config,
            retryCount: retryCount + 1
          });
        } finally {
          // 从重试队列移除
          this.removeFromRetryQueue(requestKey);
        }
      }
      
      // 处理超时
      if (error.name === 'AbortError') {
        logError('ApiClient', '请求超时', ErrorCategory.NETWORK, {
          operation: 'api_request',
          url: url.toString(),
          timeout,
          retryAttempt: retryCount,
          component: 'ApiClient'
        });
        
        return {
          success: false,
          message: '请求超时，请检查网络连接',
          error: 'REQUEST_TIMEOUT',
        };
      }

      // 处理网络错误
      if (!navigator.onLine) {
        logWarning('ApiClient', '网络连接不可用', ErrorCategory.NETWORK, {
          operation: 'api_request',
          url: url.toString(),
          retryAttempt: retryCount,
          component: 'ApiClient'
        });
        
        return {
          success: false,
          message: '网络连接不可用，请检查网络设置',
          error: 'NETWORK_OFFLINE',
        };
      }

      logError('ApiClient', '网络请求失败', ErrorCategory.NETWORK, {
        operation: 'api_request',
        url: url.toString(),
        error: error.message,
        retryAttempt: retryCount,
        component: 'ApiClient'
      });
      
      return {
        success: false,
        message: '网络请求失败，请稍后重试',
        error: error.message || 'NETWORK_ERROR',
      };

    } finally {
      this.removePendingRequest(requestKey);
    }
  }

  /**
   * 判断是否应该重试请求
   */
  private shouldRetryRequest(status: number, errorData: any): boolean {
    // 服务器内部错误或服务不可用时重试
    if (status >= 500) return true;
    
    // 429 (Too Many Requests) 应该重试
    if (status === 429) return true;
    
    // 408 (Request Timeout) 应该重试
    if (status === 408) return true;
    
    // 检查错误信息中的可重试标志
    if (errorData.retryable) return true;
    
    return false;
  }

  /**
   * 判断是否为可重试的网络错误
   */
  private isRetryableError(error: any): boolean {
    // 超时错误可重试
    if (error.name === 'AbortError') return true;
    
    // 网络中断可重试
    if (!navigator.onLine) return true;
    
    // TypeError 通常是网络相关错误，可能可重试
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return true;
    }
    
    return false;
  }

  /**
   * 计算重试延迟时间（指数退避）
   */
  private calculateRetryDelay(attempt: number): number {
    const baseDelay = DEFAULT_RETRY_CONFIG.retryDelay;
    const delay = baseDelay * Math.pow(DEFAULT_RETRY_CONFIG.backoffMultiplier, attempt);
    return Math.min(delay, DEFAULT_RETRY_CONFIG.maxDelay);
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 处理401未授权错误
   */
  private handleUnauthorized(): void {
    // 清除本地存储的认证信息
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_info');
    
    logWarning('ApiClient', '认证令牌已过期或无效，清除本地认证信息', ErrorCategory.AUTHENTICATION, {
      operation: 'handle_unauthorized',
      component: 'ApiClient'
    });
    
    // 可以在这里添加重定向到登录页的逻辑
    // window.location.href = '/login';
  }

  /**
   * 解析错误响应
   */
  private async parseErrorResponse(response: Response): Promise<any> {
    try {
      const data = await response.json();
      return {
        message: data.message || data.error || `HTTP ${response.status}`,
        error: data.error || data.message || response.statusText
      };
    } catch {
      return {
        message: `HTTP ${response.status}: ${response.statusText}`,
        error: response.statusText
      };
    }
  }

  /**
   * 解析成功响应
   */
  private async parseResponse(response: Response): Promise<any> {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  /**
   * 移除待处理的请求
   */
  private removePendingRequest(requestKey: string): void {
    if (this.pendingRequests.has(requestKey)) {
      this.pendingRequests.delete(requestKey);
    }
  }

  /**
   * 启动重试队列清理任务
   */
  private startRetryQueueCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      this.retryQueue.forEach((item, key) => {
        if (now - item.startTime > this.RETRY_QUEUE_TIMEOUT) {
          this.retryQueue.delete(key);
          logWarning(`重试队列项超时: ${key}`, {
            operation: 'retry_queue_cleanup',
            key,
            component: 'ApiClient'
          });
        }
      });
    }, 10000); // 每10秒检查一次
  }

  /**
   * 生成请求唯一标识
   */
  private generateRequestKey(method: string, url: string, body?: any): string {
    return `${method}-${url}-${body ? JSON.stringify(body) : ''}`;
  }

  /**
   * 检查是否可以添加到重试队列
   */
  private canAddToRetryQueue(requestKey: string, retryCount: number): boolean {
    // 检查重试队列是否已满
    if (this.retryQueue.size >= this.MAX_CONCURRENT_RETRIES) {
      return false;
    }
    
    // 检查请求是否已经在重试队列中
    if (this.retryQueue.has(requestKey)) {
      return false;
    }
    
    return true;
  }

  /**
   * 添加到重试队列
   */
  private addToRetryQueue(requestKey: string, retryCount: number): void {
    const item: RetryQueueItem = {
      requestKey,
      startTime: Date.now(),
      retryCount
    };
    this.retryQueue.set(requestKey, item);
  }

  /**
   * 从重试队列移除
   */
  private removeFromRetryQueue(requestKey: string): void {
    this.retryQueue.delete(requestKey);
  }

  /**
   * GET请求
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    // 先检查后端状态
    await this.checkBackendStatus();
    
    // 如果使用Mock数据，尝试从mockApi获取
    if (this.useMockData) {
      return this.getMockResponse<T>(endpoint, 'GET', params);
    }
    
    return this.request<T>(endpoint, {
      method: 'GET',
      params,
    });
  }

  /**
   * POST请求
   */
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    // 先检查后端状态
    await this.checkBackendStatus();
    
    // 如果使用Mock数据，尝试从mockApi获取
    if (this.useMockData) {
      return this.getMockResponse<T>(endpoint, 'POST', data);
    }
    
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT请求
   */
  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE请求
   */
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }

  /**
   * PATCH请求
   */
  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * 获取Mock响应
   */
  private async getMockResponse<T>(endpoint: string, method: 'GET' | 'POST', data?: any): Promise<ApiResponse<T>> {
    try {
      // 解析端点路径
      logInfo('使用Mock数据响应', {
        endpoint,
        method,
        module: 'ApiClient'
      });
      
      // 根据端点路由到对应的mock方法
      if (endpoint.includes('/api/auth/qrcode/generate')) {
        return await mockApi.auth.generateQRCode();
      }
      
      if (endpoint.includes('/api/auth/qrcode/check')) {
        return await mockApi.auth.checkQRCode(data?.qr_id || '');
      }
      
      if (endpoint.includes('/api/auth/login')) {
        return await mockApi.auth.login(data?.cookie || '');
      }
      
      if (endpoint.includes('/api/auth/logout')) {
        return await mockApi.auth.logout();
      }
      
      if (endpoint.includes('/api/auth/user')) {
        return await mockApi.auth.getUserInfo();
      }
      
      if (endpoint.includes('/api/gifts/list')) {
        return await mockApi.gifts.getList(data);
      }
      
      if (endpoint.includes('/api/gifts/batch-grab')) {
        return await mockApi.gifts.batchGrab(data?.gift_ids || []);
      }
      
      if (endpoint.includes('/api/gifts/grab')) {
        return await mockApi.gifts.grab(data?.gift_id || '');
      }
      
      if (endpoint.includes('/api/stats/overview')) {
        return await mockApi.stats.getOverview();
      }
      
      if (endpoint.includes('/api/tasks/list')) {
        return await mockApi.tasks.getList();
      }
      
      if (endpoint.includes('/api/settings/get')) {
        return await mockApi.settings.get();
      }
      
      if (endpoint.includes('/api/settings/update')) {
        return await mockApi.settings.update(data);
      }
      
      if (endpoint.includes('/api/settings/cookie')) {
        return await mockApi.settings.updateCookie(data?.cookie || '');
      }
      
      if (endpoint.includes('/api/settings/export')) {
        return await mockApi.settings.export();
      }
      
      if (endpoint.includes('/api/monitor/list')) {
        return await mockApi.monitor.getList();
      }
      
      if (endpoint.includes('/api/monitor/performance')) {
        return await mockApi.monitor.getPerformance();
      }
      
      if (endpoint.includes('/api/monitor/start')) {
        return await mockApi.monitor.start(data);
      }
      
      if (endpoint.includes('/api/session-health/status')) {
        return await mockApi.sessionHealth.getStatus();
      }
      
      if (endpoint.includes('/api/session-health/start')) {
        return await mockApi.sessionHealth.start(data);
      }
      
      if (endpoint.includes('/api/session-health/stop')) {
        return await mockApi.sessionHealth.stop();
      }
      
      // 默认返回成功但无数据
      logWarning('未找到对应的Mock端点', {
        endpoint,
        method,
        module: 'ApiClient'
      });
      
      return {
        success: true,
        data: {} as T,
        message: '演示模式：此功能需要后端支持',
      };
    } catch (error: any) {
      logError('ApiClient', `Mock数据获取失败: ${error.message}`, ErrorCategory.UNKNOWN, {
        endpoint,
        method,
        error: error.message
      });
      
      return {
        success: false,
        message: 'Mock数据加载失败',
        error: error.message,
      };
    }
  }
}

// 导出单例
export const apiClient = new ApiClient();

// 导出类型
export type { ApiResponse, RequestConfig };