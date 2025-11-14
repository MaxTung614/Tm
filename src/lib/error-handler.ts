// Error Handler - 统一错误处理

export enum ErrorCategory {
  NETWORK = 'network',
  NETWORK_TIMEOUT = 'network_timeout',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  DATA_FETCHING = 'data_fetching',
  DATA_REFRESH = 'data_refresh',
  DATA_OPERATION = 'data_operation',
  DATA_SAVE = 'data_save',
  DATA_VALIDATION = 'data_validation',
  DATA_EXPORT = 'data_export',
  GIFT_OPERATION = 'gift_operation',
  RESOURCE_CONFLICT = 'resource_conflict',
  RESOURCE_NOT_FOUND = 'resource_not_found',
  RATE_LIMIT = 'rate_limit',
  BATCH_OPERATION = 'batch_operation',
  TASK_OPERATION = 'task_operation',
  BUSINESS_LOGIC = 'business_logic',
  UNKNOWN = 'unknown'
}

export enum ErrorLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// 日志函数
export function logInfo(message: string, data?: any) {
  console.log(`[INFO] ${message}`, data || '');
}

export function logWarning(message: string, data?: any) {
  console.warn(`[WARNING] ${message}`, data || '');
}

export function logError(error: any, data?: any) {
  console.error(`[ERROR]`, error, data || '');
}

// 生成错误ID
export function generateErrorId(): string {
  return `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// 获取错误消息
export function getErrorMessage(error: any): string {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  return '未知错误';
}

// 创建用户友好的错误消息
export function createUserFriendlyMessage(
  error: any,
  category: ErrorCategory,
  errorId: string,
  operation?: string
): string {
  const errorMessage = getErrorMessage(error);
  
  const categoryMessages: Record<ErrorCategory, string> = {
    [ErrorCategory.NETWORK]: '网络连接失败，请检查网络设置',
    [ErrorCategory.NETWORK_TIMEOUT]: '请求超时，请稍后重试',
    [ErrorCategory.AUTHENTICATION]: '身份验证失败，请重新登录',
    [ErrorCategory.AUTHORIZATION]: '权限不足，请联系管理员',
    [ErrorCategory.DATA_FETCHING]: '数据加载失败',
    [ErrorCategory.DATA_REFRESH]: '数据刷新失败',
    [ErrorCategory.DATA_OPERATION]: '数据操作失败',
    [ErrorCategory.DATA_SAVE]: '数据保存失败',
    [ErrorCategory.DATA_VALIDATION]: '数据验证失败',
    [ErrorCategory.DATA_EXPORT]: '数据导出失败',
    [ErrorCategory.GIFT_OPERATION]: '红包操作失败',
    [ErrorCategory.RESOURCE_CONFLICT]: '该红包已被抢购',
    [ErrorCategory.RESOURCE_NOT_FOUND]: '资源未找到',
    [ErrorCategory.RATE_LIMIT]: '操作过于频繁，请稍后再试',
    [ErrorCategory.BATCH_OPERATION]: '批量操作失败',
    [ErrorCategory.TASK_OPERATION]: '任务操作失败',
    [ErrorCategory.BUSINESS_LOGIC]: '业务逻辑错误',
    [ErrorCategory.UNKNOWN]: '操作失败，请重试'
  };

  return categoryMessages[category] || errorMessage;
}

// 错误处理器
export function errorHandler(error: any, context?: any) {
  const errorId = generateErrorId();
  logError(error, { errorId, ...context });
  return errorId;
}