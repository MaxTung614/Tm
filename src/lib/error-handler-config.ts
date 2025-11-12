/**
 * 错误处理器配置常量
 * 集中管理所有魔法数字和硬编码值
 */

/**
 * 错误存储配置
 */
export const ERROR_STORAGE_CONFIG = {
  /** localStorage 存储键名 */
  key: 'app_errors',
  
  /** 内存中最多保存的错误数量 */
  maxSize: 100,
  
  /** 持久化到 localStorage 的错误数量 */
  maxPersistSize: 50,
  
  /** 持久化防抖延迟（毫秒） */
  debounceDelay: 1000,
} as const;

/**
 * 错误通知配置
 */
export const ERROR_NOTIFICATION_CONFIG = {
  /** 普通错误通知持续时间（毫秒） */
  defaultDuration: 5000,
  
  /** 严重错误通知持续时间（毫秒） */
  criticalDuration: 8000,
} as const;

/**
 * 错误ID生成配置
 */
export const ERROR_ID_CONFIG = {
  /** 错误ID前缀 */
  prefix: 'ERR',
  
  /** 随机字符串长度 */
  randomLength: 9,
  
  /** 随机字符串基数（36进制：0-9a-z） */
  randomRadix: 36,
} as const;

/**
 * 会话存储配置
 */
export const STORAGE_INFO_CONFIG = {
  /** 需要过滤的敏感键名关键词 */
  sensitiveKeywords: ['password', 'token', 'cookie', 'secret', 'key'] as const,
} as const;

/**
 * 环境配置
 */
export const ENVIRONMENT_CONFIG = {
  /** 是否为生产环境 */
  isProduction: typeof process !== 'undefined' && process.env?.NODE_ENV === 'production',
  
  /** 是否启用调试模式 */
  isDebug: typeof process !== 'undefined' && process.env?.NODE_ENV === 'development',
} as const;

/**
 * 错误消息模板
 */
export const ERROR_MESSAGES = {
  // 网络错误
  network: '网络连接异常，请检查网络设置',
  
  // 认证错误
  authentication: '登录状态已过期，请重新登录',
  authorization: '您没有权限执行此操作',
  
  // 验证错误
  validation: '输入信息有误，请检查后重试',
  
  // 数据操作错误
  dataFetching: '数据加载失败，请刷新页面重试',
  dataSave: '数据保存失败，请重试',
  dataRefresh: '数据刷新失败，请稍后重试',
  dataOperation: '数据操作失败，请重试',
  dataValidation: '数据验证失败，请检查输入',
  
  // 业务操作错误
  businessLogic: '业务处理失败，请重试',
  giftOperation: '礼包操作失败，请重试',
  taskOperation: '任务操作失败，请重试',
  batchOperation: '批量操作失败，请重试',
  
  // 资源错误
  resourceNotFound: '请求的资源不存在',
  resourceConflict: '资源冲突，请刷新后重试',
  
  // 系统错误
  system: '系统错误，请稍后重试或联系管理员',
  rateLimit: '操作过于频繁，请稍后再试',
  
  // 浏览器API错误
  clipboardAccess: '剪贴板访问失败，请手动复制',
  
  // 默认错误
  default: '操作失败，请重试',
} as const;
