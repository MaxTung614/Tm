/**
 * API配置文件
 * 所有API端点的集中管理
 */

// 安全地获取环境变量
const getEnvVar = (key: string, defaultValue: string): string => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env[key] || defaultValue;
    }
  } catch (error) {
    console.warn(`Failed to read environment variable ${key}, using default:`, defaultValue);
  }
  return defaultValue;
};

// API基础URL - 从环境变量读取或使用默认值
export const API_BASE_URL = getEnvVar('VITE_API_BASE_URL', 'http://localhost:8000');

// API端点配置
export const API_ENDPOINTS = {
  // 认证相关
  auth: {
    qrcode: {
      generate: '/api/auth/qrcode/generate',
      check: '/api/auth/qrcode/check',
    },
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    userInfo: '/api/auth/user',
  },
  
  // 红包相关
  gifts: {
    list: '/api/gifts/list',
    grab: '/api/gifts/grab',
    batchGrab: '/api/gifts/batch-grab',
    status: '/api/gifts/status',
  },
  
  // 任务相关
  tasks: {
    list: '/api/tasks/list',
    create: '/api/tasks/create',
    update: '/api/tasks/update',
    delete: '/api/tasks/delete',
    start: '/api/tasks/start',
    stop: '/api/tasks/stop',
    logs: '/api/tasks/logs',
  },
  
  // 设置相关
  settings: {
    get: '/api/settings/get',
    update: '/api/settings/update',
    updateCookie: '/api/settings/cookie',
    export: '/api/settings/export',
  },
  
  // 统计相关
  stats: {
    overview: '/api/stats/overview',  // 统计概览
    dashboard: '/api/stats/dashboard',
    history: '/api/stats/history',
    earnings: '/api/stats/earnings',  // 收益统计
  },
};

// 请求超时配置
export const API_TIMEOUT = 30000; // 30秒

// 请求重试配置
export const API_RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1秒
};