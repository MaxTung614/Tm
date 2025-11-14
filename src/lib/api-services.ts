/**
 * API Services - 统一入口
 * 根据环境变量自动选择 Mock 或 Real 服务
 * 
 * 环境变量配置:
 * - VITE_USE_MOCK_API=true  -> 使用 Mock 服务（开发/测试）
 * - VITE_USE_MOCK_API=false -> 使用 Real 服务（生产）
 * - 未设置                  -> 默认使用 Real 服务（已部署）
 */

import * as mockServices from './api-services.mock';
import * as realServices from './api-services.real';

// 读取环境变量（默认使用 Real 模式）
const USE_MOCK_API = import.meta.env?.VITE_USE_MOCK_API === 'true';

// 根据环境变量选择服务
let services;
if (USE_MOCK_API) {
  console.warn('🔶 使用 Mock API 服务（开发/测试模式）');
  console.warn('🔶 如需使用真实 API，请移除 VITE_USE_MOCK_API 环境变量或设置为 false');
  services = mockServices;
} else {
  console.info('✅ 使用 Real API 服务（生产模式）');
  console.info('📋 请先在"账号管理"中添加淘宝账号（扫码登录）');
  services = realServices;
}

// 导出服务
export const authService = services.authService;
export const giftService = services.giftService;
export const statService = services.statService;
export const taskService = services.taskService;
export const settingsService = services.settingsService;

// 导出 Supabase 服务（直接从 supabase.ts 导入）
export { 
  accountService, 
  riskParamsService, 
  purchaseTaskService, 
  logService,
  supabase
} from './supabase';

// 导出环境标识（方便其他模块判断）
export const IS_MOCK_MODE = USE_MOCK_API;

// 导出类型定义（与具体实现无关）
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}