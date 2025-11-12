/**
 * 前端异常处理和日志系统
 * 提供统一的错误捕获、报告和日志记录功能
 */

import { toast } from 'sonner';
import {
  ERROR_STORAGE_CONFIG,
  ERROR_NOTIFICATION_CONFIG,
  ERROR_ID_CONFIG,
  STORAGE_INFO_CONFIG,
  ENVIRONMENT_CONFIG,
  ERROR_MESSAGES,
} from './error-handler-config';

// 错误级别枚举
export enum ErrorLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

// 错误分类枚举
export enum ErrorCategory {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  BUSINESS_LOGIC = 'business_logic',
  RENDER = 'render',
  UNKNOWN = 'unknown',
  // 数据相关错误
  DATA_FETCHING = 'data_fetching',
  DATA_SAVE = 'data_save',
  DATA_REFRESH = 'data_refresh',
  DATA_OPERATION = 'data_operation',
  DATA_VALIDATION = 'data_validation',
  // 业务操作错误
  GIFT_OPERATION = 'gift_operation',
  TASK_OPERATION = 'task_operation',
  BATCH_OPERATION = 'batch_operation',
  // 资源相关错误
  RESOURCE_NOT_FOUND = 'resource_not_found',
  RESOURCE_CONFLICT = 'resource_conflict',
  // 系统错误
  SYSTEM = 'system',
  RATE_LIMIT = 'rate_limit',
  // 浏览器API错误
  CLIPBOARD_ACCESS = 'clipboard_access',
}

// 错误信息接口
export interface ErrorInfo {
  id: string;
  timestamp: Date;
  level: ErrorLevel;
  category: ErrorCategory;
  message: string;
  details?: Record<string, any>;
  stackTrace?: string;
  userId?: string;
  requestId?: string;
  context?: Record<string, any>;
  url?: string;
  userAgent?: string;
  userIdFromStorage?: string;
}

// 错误存储配置
const ERROR_STORAGE_KEY = ERROR_STORAGE_CONFIG.key;
const MAX_STORAGE_SIZE = ERROR_STORAGE_CONFIG.maxSize;

// 全局错误处理器类
export class FrontendErrorHandler {
  private errors: ErrorInfo[] = [];
  private errorCallbacks: ((error: ErrorInfo) => void)[] = [];
  private listeners: Array<{
    target: EventTarget;
    event: string;
    handler: EventListener;
    options?: boolean | AddEventListenerOptions;
  }> = [];
  
  // 持久化优化：防抖定时器
  private persistTimer: number | null = null;
  private isDirty = false;
  private readonly PERSIST_DEBOUNCE_DELAY = ERROR_STORAGE_CONFIG.debounceDelay; // 1秒防抖延迟

  constructor() {
    this.initializeErrorHandlers();
    this.loadPersistedErrors();
  }

  /**
   * 注册错误回调函数
   */
  public registerCallback(callback: (error: ErrorInfo) => void): void {
    this.errorCallbacks.push(callback);
  }

  /**
   * 清理所有事件监听器（防止内存泄漏）
   */
  public cleanup(): void {
    // 移除所有注册的监听器
    this.listeners.forEach(({ target, event, handler, options }) => {
      target.removeEventListener(event, handler, options);
    });
    
    // 清空监听器列表
    this.listeners = [];
    
    // 清空错误回调
    this.errorCallbacks = [];
    
    console.info('[ErrorHandler] 清理完成：已移除所有事件监听器');
  }

  /**
   * 生成错误ID
   */
  private generateErrorId(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '_');
    const random = Math.random()
      .toString(ERROR_ID_CONFIG.randomRadix)
      .substr(2, ERROR_ID_CONFIG.randomLength);
    return `${ERROR_ID_CONFIG.prefix}_${timestamp}_${random}`;
  }

  /**
   * 创建错误信息
   */
  private createErrorInfo(
    message: string,
    level: ErrorLevel = ErrorLevel.ERROR,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    details?: Record<string, any>,
    error?: Error
  ): ErrorInfo {
    const errorInfo: ErrorInfo = {
      id: this.generateErrorId(),
      timestamp: new Date(),
      level,
      category,
      message,
      details,
      stackTrace: error?.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      userIdFromStorage: this.getUserId(),
      context: {
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        sessionStorage: this.getSessionStorageInfo(),
        localStorage: this.getLocalStorageInfo()
      }
    };

    return errorInfo;
  }

  /**
   * 获取用户ID（从localStorage或其他存储）
   */
  private getUserId(): string | undefined {
    try {
      const authContext = localStorage.getItem('auth_context');
      if (authContext) {
        const context = JSON.parse(authContext);
        return context.user?.id;
      }
    } catch (e) {
      // 忽略解析错误
    }
    return undefined;
  }

  /**
   * 获取会话存储信息
   */
  private getSessionStorageInfo(): Record<string, any> {
    try {
      const info: Record<string, any> = {};
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) {
          const value = sessionStorage.getItem(key);
          // 只记录键名，不记录敏感值
          info[key] = value ? `${value.length} chars` : null;
        }
      }
      return info;
    } catch (e) {
      return { error: 'Cannot access sessionStorage' };
    }
  }

  /**
   * 获取本地存储信息
   */
  private getLocalStorageInfo(): Record<string, any> {
    try {
      const info: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !key.includes('password') && !key.includes('token') && !key.includes('cookie')) {
          const value = localStorage.getItem(key);
          info[key] = value ? `${value.length} chars` : null;
        }
      }
      return info;
    } catch (e) {
      return { error: 'Cannot access localStorage' };
    }
  }

  /**
   * 记录错误
   */
  private logError(errorInfo: ErrorInfo): void {
    // 添加到内存存储
    this.errors.push(errorInfo);
    
    // 限制存储大小
    if (this.errors.length > MAX_STORAGE_SIZE) {
      this.errors.shift();
    }

    // 设置持久化标志
    this.isDirty = true;
    this.schedulePersist();

    // 调用回调函数
    this.errorCallbacks.forEach(callback => {
      try {
        callback(errorInfo);
      } catch (e) {
        console.error('Error in error callback:', e);
      }
    });

    // 控制台输出
    const logMethod = this.getConsoleLogMethod(errorInfo.level);
    const categoryStr = typeof errorInfo.category === 'string' 
      ? errorInfo.category.toUpperCase() 
      : String(errorInfo.category).toUpperCase();
    logMethod(`[${categoryStr}] ${errorInfo.message}`, errorInfo);

    // 显示用户提示（仅对用户相关的错误）
    if (this.shouldShowUserNotification(errorInfo)) {
      this.showUserNotification(errorInfo);
    }
  }

  /**
   * 获取控制台输出方法
   */
  private getConsoleLogMethod(level: ErrorLevel): (...args: any[]) => void {
    switch (level) {
      case ErrorLevel.CRITICAL:
        return console.error;
      case ErrorLevel.ERROR:
        return console.error;
      case ErrorLevel.WARNING:
        return console.warn;
      default:
        return console.info;
    }
  }

  /**
   * 判断是否应该显示用户通知
   */
  private shouldShowUserNotification(errorInfo: ErrorInfo): boolean {
    // 定义需要通知用户的错误类别
    const notifyCategories = [
      ErrorCategory.NETWORK,
      ErrorCategory.AUTHENTICATION,
      ErrorCategory.AUTHORIZATION,
      ErrorCategory.VALIDATION,
      ErrorCategory.BUSINESS_LOGIC,
      ErrorCategory.DATA_FETCHING,
      ErrorCategory.DATA_SAVE,
      ErrorCategory.DATA_REFRESH,
      ErrorCategory.DATA_OPERATION,
      ErrorCategory.DATA_VALIDATION,
      ErrorCategory.GIFT_OPERATION,
      ErrorCategory.TASK_OPERATION,
      ErrorCategory.BATCH_OPERATION,
      ErrorCategory.RESOURCE_NOT_FOUND,
      ErrorCategory.RESOURCE_CONFLICT,
      ErrorCategory.SYSTEM,
      ErrorCategory.RATE_LIMIT,
      ErrorCategory.CLIPBOARD_ACCESS,
    ];
    
    // 定义不需要通知的错误类别（静默错误）
    const silentCategories = [
      ErrorCategory.UNKNOWN,
      ErrorCategory.RENDER, // 渲染错误通常已经有ErrorBoundary处理
    ];
    
    // 如果是静默类别，不显示通知
    if (silentCategories.includes(errorInfo.category)) {
      return false;
    }
    
    // 如果是INFO级别的日志，不显示通知
    if (errorInfo.level === ErrorLevel.INFO) {
      return false;
    }
    
    // 如明确标记为不显示通知
    if (errorInfo.details?.silentNotification === true) {
      return false;
    }
    
    // 其他需要通知的类别
    return notifyCategories.includes(errorInfo.category);
  }

  /**
   * 显示用户通知
   */
  private showUserNotification(errorInfo: ErrorInfo): void {
    let message = '操作失败，请重试';

    // 根据错误类别生成用户友好的消息
    switch (errorInfo.category) {
      case ErrorCategory.NETWORK:
        message = '网络连接异常，请检查网络设置';
        break;
      case ErrorCategory.AUTHENTICATION:
        message = '登录状态已过期，请重新登录';
        break;
      case ErrorCategory.AUTHORIZATION:
        message = '您没有权限执行此操作';
        break;
      case ErrorCategory.VALIDATION:
      case ErrorCategory.DATA_VALIDATION:
        message = errorInfo.message || '输入信息有误，请检查后重试';
        break;
      case ErrorCategory.BUSINESS_LOGIC:
        message = errorInfo.message || '业务处理失败，请重试';
        break;
      case ErrorCategory.DATA_FETCHING:
        message = '数据加载失败，请刷新页面重试';
        break;
      case ErrorCategory.DATA_SAVE:
        message = '数据保存失败，请重试';
        break;
      case ErrorCategory.DATA_REFRESH:
        message = '数据刷新失败，请稍后重试';
        break;
      case ErrorCategory.DATA_OPERATION:
        message = errorInfo.message || '数据操作失败，请重试';
        break;
      case ErrorCategory.GIFT_OPERATION:
        message = errorInfo.message || '礼包操作失败，请重试';
        break;
      case ErrorCategory.TASK_OPERATION:
        message = errorInfo.message || '任务操作失败，请重试';
        break;
      case ErrorCategory.BATCH_OPERATION:
        message = errorInfo.message || '批量操作失败，请重试';
        break;
      case ErrorCategory.RESOURCE_NOT_FOUND:
        message = '请求的资源不存在';
        break;
      case ErrorCategory.RESOURCE_CONFLICT:
        message = errorInfo.message || '资源冲突，请刷新后重试';
        break;
      case ErrorCategory.SYSTEM:
        message = '系统错误，请稍后重试或联系管理员';
        break;
      case ErrorCategory.RATE_LIMIT:
        message = '操作过于频繁，请稍后再试';
        break;
      case ErrorCategory.CLIPBOARD_ACCESS:
        message = '剪贴板访问失败，请手动复制';
        break;
      default:
        message = errorInfo.message || '操作失败，请重试';
    }

    // 根据错误级别选择 Toast 类型
    const toastFn = errorInfo.level === ErrorLevel.CRITICAL || errorInfo.level === ErrorLevel.ERROR
      ? toast.error
      : toast.warning;

    toastFn(message, {
      description: `错误ID: ${errorInfo.id}`,
      duration: errorInfo.level === ErrorLevel.CRITICAL 
        ? ERROR_NOTIFICATION_CONFIG.criticalDuration 
        : ERROR_NOTIFICATION_CONFIG.defaultDuration,
    });
  }

  /**
   * 持久化错误到localStorage
   */
  private persistErrors(): void {
    try {
      const errorsToPersist = this.errors.slice(-ERROR_STORAGE_CONFIG.maxPersistSize);
      localStorage.setItem(ERROR_STORAGE_KEY, JSON.stringify(errorsToPersist));
      this.isDirty = false;
    } catch (e) {
      console.warn('Failed to persist errors to localStorage:', e);
    }
  }

  /**
   * 从localStorage加载错误
   */
  private loadPersistedErrors(): void {
    try {
      const stored = localStorage.getItem(ERROR_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.errors = parsed.map((error: any) => ({
          ...error,
          timestamp: new Date(error.timestamp)
        }));
      }
    } catch (e) {
      console.warn('Failed to load persisted errors:', e);
    }
  }

  /**
   * 处理JavaScript错误
   */
  public handleError(
    error: Error | string,
    level: ErrorLevel = ErrorLevel.ERROR,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    details?: Record<string, any>
  ): ErrorInfo {
    const message = typeof error === 'string' ? error : error.message;
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    
    const errorInfo = this.createErrorInfo(message, level, category, details, errorObj);
    this.logError(errorInfo);
    
    return errorInfo;
  }

  /**
   * 处理网络请求错误
   */
  public handleNetworkError(
    error: any,
    request: ApiRequestInfo,
    response?: Response
  ): ErrorInfo {
    let category = ErrorCategory.NETWORK;
    let level = ErrorLevel.ERROR;
    let message = '网络请求失败';

    if (response) {
      if (response.status === 401) {
        category = ErrorCategory.AUTHENTICATION;
        level = ErrorLevel.WARNING;
        message = '认证失败，请重新登录';
      } else if (response.status === 403) {
        category = ErrorCategory.AUTHORIZATION;
        level = ErrorLevel.WARNING;
        message = '权限不足';
      } else if (response.status >= 500) {
        category = ErrorCategory.SYSTEM;
        level = ErrorLevel.CRITICAL;
        message = '服务器错误';
      } else if (response.status >= 400) {
        category = ErrorCategory.VALIDATION;
        level = ErrorLevel.WARNING;
        message = '请求参数有误';
      }
    }

    const details = {
      request: {
        url: request.url,
        method: request.method,
        headers: request.headers
      },
      response: response ? {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      } : null,
      error: error?.message || String(error)
    };

    return this.handleError(error, level, category, details);
  }

  /**
   * 处理React组件错误
   */
  public handleReactError(
    error: Error,
    errorInfo: React.ErrorInfo,
    componentStack?: string
  ): ErrorInfo {
    const details = {
      componentStack: componentStack || errorInfo.componentStack,
      errorBoundary: true
    };

    return this.handleError(error, ErrorLevel.ERROR, ErrorCategory.RENDER, details);
  }

  /**
   * 获取最近的错误
   */
  public getRecentErrors(limit: number = 50): ErrorInfo[] {
    return this.errors.slice(-limit);
  }

  /**
   * 按分类获取错误
   */
  public getErrorsByCategory(category: ErrorCategory): ErrorInfo[] {
    return this.errors.filter(error => error.category === category);
  }

  /**
   * 按级别获取错误
   */
  public getErrorsByLevel(level: ErrorLevel): ErrorInfo[] {
    return this.errors.filter(error => error.level === level);
  }

  /**
   * 清除错误记录
   */
  public clearErrors(): void {
    this.errors = [];
    localStorage.removeItem(ERROR_STORAGE_KEY);
  }

  /**
   * 导出错误报告
   */
  public exportErrorReport(): string {
    const report = {
      generatedAt: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      errors: this.errors,
      summary: {
        total: this.errors.length,
        byLevel: this.getErrorsByLevelSummary(),
        byCategory: this.getErrorsByCategorySummary()
      }
    };

    return JSON.stringify(report, null, 2);
  }

  /**
   * 按级别统计错误
   */
  private getErrorsByLevelSummary(): Record<string, number> {
    const summary: Record<string, number> = {};
    Object.values(ErrorLevel).forEach(level => {
      summary[level] = this.getErrorsByLevel(level).length;
    });
    return summary;
  }

  /**
   * 按分类统计错误
   */
  private getErrorsByCategorySummary(): Record<string, number> {
    const summary: Record<string, number> = {};
    Object.values(ErrorCategory).forEach(category => {
      summary[category] = this.getErrorsByCategory(category).length;
    });
    return summary;
  }

  /**
   * 初始化全局错误处理器
   */
  private initializeErrorHandlers(): void {
    // JavaScript运行时错误
    const handleRuntimeError = (event: ErrorEvent) => {
      this.handleError(
        new Error(event.message),
        ErrorLevel.ERROR,
        ErrorCategory.UNKNOWN,
        {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error
        }
      );
    };
    window.addEventListener('error', handleRuntimeError);
    this.listeners.push({ target: window, event: 'error', handler: handleRuntimeError });

    // Promise拒绝（未处理的Promise错误）
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      this.handleError(
        new Error(`Unhandled promise rejection: ${event.reason}`),
        ErrorLevel.ERROR,
        ErrorCategory.UNKNOWN,
        {
          reason: event.reason,
          promise: event.promise
        }
      );
    };
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    this.listeners.push({ target: window, event: 'unhandledrejection', handler: handleUnhandledRejection });

    // 资源加载错误
    const handleResourceError = (event: ErrorEvent) => {
      if (event.target !== window) {
        const target = event.target as HTMLElement;
        const tagName = target.tagName;
        if (['IMG', 'SCRIPT', 'LINK', 'IFRAME'].includes(tagName)) {
          this.handleError(
            new Error(`Failed to load resource: ${target.src || target.href}`),
            ErrorLevel.WARNING,
            ErrorCategory.UNKNOWN,
            {
              resource: target.src || target.href,
              tagName
            }
          );
        }
      }
    };
    window.addEventListener('error', handleResourceError, true);
    this.listeners.push({ target: window, event: 'error', handler: handleResourceError, options: true });
  }

  /**
   * 安排持久化操作
   */
  private schedulePersist(): void {
    if (this.persistTimer !== null) {
      clearTimeout(this.persistTimer);
    }
    this.persistTimer = window.setTimeout(() => {
      if (this.isDirty) {
        this.persistErrors();
      }
    }, this.PERSIST_DEBOUNCE_DELAY);
  }
}

// 自定义API请求信息接口（避免与内置 RequestInfo 冲突）
export interface ApiRequestInfo {
  url: string;
  method: string;
  headers?: Record<string, string>;
}

// 创建全局错误处理器实例
export const errorHandler = new FrontendErrorHandler();

// 导出便利函数 - 重新设计签名以支持模块名称和错误分类
export const logError = (
  moduleOrError: string | Error,
  errorOrDetails?: string | Error | Record<string, any>,
  categoryOrDetails?: ErrorCategory | Record<string, any>,
  details?: Record<string, any>
): ErrorInfo => {
  // 解析参数：支持多种调用方式
  let module: string | undefined;
  let error: Error | string;
  let category: ErrorCategory = ErrorCategory.UNKNOWN;
  let finalDetails: Record<string, any> = {};

  // 模式1: logError(error, details) - 原有简单模式
  if ((typeof moduleOrError !== 'string' || moduleOrError instanceof Error) && !categoryOrDetails) {
    error = moduleOrError;
    finalDetails = (errorOrDetails as Record<string, any>) || {};
  }
  // 模式2: logError('Module', 'message', ErrorCategory.XXX, details) - 完整模式
  else if (typeof moduleOrError === 'string' && typeof errorOrDetails === 'string') {
    module = moduleOrError;
    error = errorOrDetails;
    category = (categoryOrDetails as ErrorCategory) || ErrorCategory.UNKNOWN;
    finalDetails = details || {};
  }
  // 模式3: logError('Module', error, ErrorCategory.XXX, details)
  else if (typeof moduleOrError === 'string' && errorOrDetails instanceof Error) {
    module = moduleOrError;
    error = errorOrDetails;
    category = (categoryOrDetails as ErrorCategory) || ErrorCategory.UNKNOWN;
    finalDetails = details || {};
  }
  // 兜底：按原有模式处理
  else {
    error = moduleOrError;
    finalDetails = (errorOrDetails as Record<string, any>) || {};
  }

  // 将模块名添加到详情中
  if (module) {
    finalDetails = { ...finalDetails, module };
  }

  return errorHandler.handleError(error, ErrorLevel.ERROR, category, finalDetails);
};

export const logWarning = (
  moduleOrMessage: string,
  messageOrDetails?: string | Record<string, any>,
  categoryOrDetails?: ErrorCategory | Record<string, any>,
  details?: Record<string, any>
): ErrorInfo => {
  let module: string | undefined;
  let message: string;
  let category: ErrorCategory = ErrorCategory.UNKNOWN;
  let finalDetails: Record<string, any> = {};

  // 模式1: logWarning('message', details)
  if (!messageOrDetails || typeof messageOrDetails === 'object') {
    message = moduleOrMessage;
    finalDetails = (messageOrDetails as Record<string, any>) || {};
  }
  // 模式2: logWarning('Module', 'message', category, details)
  else if (typeof messageOrDetails === 'string') {
    module = moduleOrMessage;
    message = messageOrDetails;
    category = (categoryOrDetails as ErrorCategory) || ErrorCategory.UNKNOWN;
    finalDetails = details || {};
  }
  // 兜底
  else {
    message = moduleOrMessage;
  }

  if (module) {
    finalDetails = { ...finalDetails, module };
  }

  return errorHandler.handleError(message, ErrorLevel.WARNING, category, finalDetails);
};

export const logInfo = (
  moduleOrMessage: string,
  messageOrDetails?: string | Record<string, any>,
  categoryOrDetails?: ErrorCategory | Record<string, any>,
  details?: Record<string, any>
): ErrorInfo => {
  let module: string | undefined;
  let message: string;
  let category: ErrorCategory = ErrorCategory.UNKNOWN;
  let finalDetails: Record<string, any> = {};

  // 模式1: logInfo('message', details)
  if (!messageOrDetails || typeof messageOrDetails === 'object') {
    message = moduleOrMessage;
    finalDetails = (messageOrDetails as Record<string, any>) || {};
  }
  // 模式2: logInfo('Module', 'message', category, details)
  else if (typeof messageOrDetails === 'string') {
    module = moduleOrMessage;
    message = messageOrDetails;
    category = (categoryOrDetails as ErrorCategory) || ErrorCategory.UNKNOWN;
    finalDetails = details || {};
  }
  // 兜底
  else {
    message = moduleOrMessage;
  }

  if (module) {
    finalDetails = { ...finalDetails, module };
  }

  return errorHandler.handleError(message, ErrorLevel.INFO, category, finalDetails);
};

export const logNetworkError = (error: any, request: any, response?: Response) => 
  errorHandler.handleNetworkError(error, request, response);

/**
 * 生成错误ID - 公开函数
 */
export const generateErrorId = (): string => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '_');
  const random = Math.random().toString(36).substr(2, 9);
  return `ERR_${timestamp}_${random}`;
};

/**
 * 从错误对象中提取错误消息
 */
export const getErrorMessage = (error: any): string => {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error?.response?.data?.error) {
    return error.response.data.error;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  return '未知错误';
};

/**
 * 创建用户友好的错误消息
 */
export const createUserFriendlyMessage = (
  error: any,
  category: ErrorCategory,
  errorId: string,
  context?: string
): string => {
  const baseMessage = getErrorMessage(error);
  let userMessage = '';

  // 根据错误分类生成用户友好的消息
  switch (category) {
    case ErrorCategory.NETWORK:
      userMessage = '网络连接失败，请检查网络设置后重试';
      break;
    case ErrorCategory.AUTHENTICATION:
      userMessage = '登录状态已过期，请重新登录';
      break;
    case ErrorCategory.AUTHORIZATION:
      userMessage = '您没有权限执行此操作';
      break;
    case ErrorCategory.VALIDATION:
    case ErrorCategory.DATA_VALIDATION:
      userMessage = baseMessage || '输入信息有误，请检查后重试';
      break;
    case ErrorCategory.BUSINESS_LOGIC:
      userMessage = baseMessage || '操作失败，请稍后重试';
      break;
    case ErrorCategory.DATA_FETCHING:
      userMessage = '数据加载失败，请刷新页面重试';
      break;
    case ErrorCategory.DATA_SAVE:
      userMessage = '数据保存失败，请重试';
      break;
    case ErrorCategory.DATA_REFRESH:
      userMessage = '数据刷新失败，请稍后重试';
      break;
    case ErrorCategory.DATA_OPERATION:
      userMessage = baseMessage || '数据操作失败，请重试';
      break;
    case ErrorCategory.GIFT_OPERATION:
      userMessage = baseMessage || '礼包操作失败，请重试';
      break;
    case ErrorCategory.TASK_OPERATION:
      userMessage = baseMessage || '任务操作失败，请重试';
      break;
    case ErrorCategory.BATCH_OPERATION:
      userMessage = baseMessage || '批量操作失败，请重试';
      break;
    case ErrorCategory.RESOURCE_NOT_FOUND:
      userMessage = '请求的资源不存在';
      break;
    case ErrorCategory.RESOURCE_CONFLICT:
      userMessage = baseMessage || '资源冲突，请刷新后重试';
      break;
    case ErrorCategory.SYSTEM:
      userMessage = '系统错误，请稍后重试或联系管理员';
      break;
    case ErrorCategory.RATE_LIMIT:
      userMessage = '操作过于频繁，请稍后再试';
      break;
    case ErrorCategory.CLIPBOARD_ACCESS:
      userMessage = '剪贴板访问失败，请手动复制';
      break;
    case ErrorCategory.RENDER:
      userMessage = '页面渲染错误，请刷新页面';
      break;
    default:
      userMessage = baseMessage || '操作失败，请重试';
  }

  // 如果有上下文信息，添加到消息中
  if (context) {
    userMessage = `${userMessage} (${context})`;
  }

  // 添加错误ID用于追踪
  return `${userMessage}\n错误ID: ${errorId}`;
};

export default errorHandler;