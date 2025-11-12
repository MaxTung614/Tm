/**
 * API服务层
 * 封装所有业务API调用
 */

import { apiClient } from './api-client';
import { API_ENDPOINTS } from './api-config';
import { 
  logError, 
  logWarning, 
  logInfo,
  ErrorCategory, 
  ErrorLevel,
  getErrorMessage,
  createUserFriendlyMessage
} from './error-handler';

// ==================== 认证服务 ====================

export const authService = {
  /**
   * 生成二维码
   */
  async generateQRCode() {
    try {
      logInfo('AuthService', '开始生成登录二维码');
      const response = await apiClient.post(API_ENDPOINTS.auth.qrcode.generate);
      logInfo('AuthService', '二维码生成成功');
      return response;
    } catch (error: any) {
      const errorId = Date.now().toString(36);
      logError('AuthService', `二维码生成失败 [${errorId}]: ${getErrorMessage(error)}`, ErrorCategory.AUTHENTICATION, error);
      throw new Error(`二维码生成失败: ${getErrorMessage(error)} (错误ID: ${errorId})`);
    }
  },

  /**
   * 检查二维码扫码状态
   */
  async checkQRCode(qrCodeId: string) {
    try {
      logInfo('AuthService', `检查二维码状态: ${qrCodeId}`);
      const response = await apiClient.get(API_ENDPOINTS.auth.qrcode.check, { qr_id: qrCodeId });
      logInfo('AuthService', '二维码状态检查成功');
      return response;
    } catch (error: any) {
      const errorId = Date.now().toString(36);
      logError('AuthService', `二维码状态检查失败 [${errorId}]: ${getErrorMessage(error)}`, ErrorCategory.AUTHENTICATION, error);
      throw new Error(`二维码状态检查失败: ${getErrorMessage(error)} (错误ID: ${errorId})`);
    }
  },

  /**
   * Cookie登录
   */
  async loginWithCookie(cookie: string) {
    try {
      logInfo('AuthService', '开始Cookie登录');
      const response = await apiClient.post(API_ENDPOINTS.auth.login, { cookie });
      logInfo('AuthService', 'Cookie登录请求完成');
      return response;
    } catch (error: any) {
      const errorId = Date.now().toString(36);
      logError('AuthService', `Cookie登录失败 [${errorId}]: ${getErrorMessage(error)}`, ErrorCategory.AUTHENTICATION, error);
      throw new Error(`登录失败: ${getErrorMessage(error)} (错误ID: ${errorId})`);
    }
  },

  /**
   * 退出登录
   */
  async logout() {
    try {
      logInfo('AuthService', '开始退出登录');
      const response = await apiClient.post(API_ENDPOINTS.auth.logout);
      logInfo('AuthService', '退出登录成功');
      return response;
    } catch (error: any) {
      const errorId = Date.now().toString(36);
      logError('AuthService', `退出登录失败 [${errorId}]: ${getErrorMessage(error)}`, ErrorCategory.AUTHENTICATION, error);
      // 退出登录失败不抛出错误，避免影响用户体验
      return { success: false, message: '退出登录时发生错误' };
    }
  },

  /**
   * 获取用户信息
   */
  async getUserInfo() {
    try {
      logInfo('AuthService', '获取用户信息');
      const response = await apiClient.get(API_ENDPOINTS.auth.userInfo);
      logInfo('AuthService', '用户信息获取成功');
      return response;
    } catch (error: any) {
      const errorId = Date.now().toString(36);
      logError('AuthService', `用户信息获取失败 [${errorId}]: ${getErrorMessage(error)}`, ErrorCategory.AUTHENTICATION, error);
      throw new Error(`获取用户信息失败: ${getErrorMessage(error)} (错误ID: ${errorId})`);
    }
  },
};

// ==================== 红包服务 ====================

export const giftService = {
  /**
   * 获取红包列表
   */
  async getGiftList(params?: { status?: string; page?: number; limit?: number }) {
    try {
      logInfo('GiftService', '开始获取红包列表', params);
      const response = await apiClient.get(API_ENDPOINTS.gifts.list, params);
      logInfo('GiftService', '红包列表获取成功');
      return response;
    } catch (error: any) {
      const errorId = Date.now().toString(36);
      logError('GiftService', `红包列表获取失败 [${errorId}]: ${getErrorMessage(error)}`, ErrorCategory.DATA_FETCHING, error);
      throw new Error(`获取红包列表失败: ${getErrorMessage(error)} (错误ID: ${errorId})`);
    }
  },

  /**
   * 抢购单个红包
   */
  async grabGift(giftId: string) {
    try {
      logInfo('GiftService', `开始抢购红包: ${giftId}`);
      const response = await apiClient.post(API_ENDPOINTS.gifts.grab, { gift_id: giftId });
      logInfo('GiftService', '红包抢购请求完成');
      return response;
    } catch (error: any) {
      const errorId = Date.now().toString(36);
      logError('GiftService', `红包抢购失败 [${errorId}]: ${getErrorMessage(error)}`, ErrorCategory.BUSINESS_LOGIC, error);
      throw new Error(`红包抢购失败: ${getErrorMessage(error)} (错误ID: ${errorId})`);
    }
  },

  /**
   * 批量抢购红包
   */
  async batchGrabGifts(giftIds: string[]) {
    try {
      logInfo('GiftService', `开始批量抢购红包，数量: ${giftIds.length}`);
      const response = await apiClient.post(API_ENDPOINTS.gifts.batchGrab, { gift_ids: giftIds });
      logInfo('GiftService', '批量抢购请求完成');
      return response;
    } catch (error: any) {
      const errorId = Date.now().toString(36);
      logError('GiftService', `批量抢购失败 [${errorId}]: ${getErrorMessage(error)}`, ErrorCategory.BUSINESS_LOGIC, error);
      throw new Error(`批量抢购失败: ${getErrorMessage(error)} (错误ID: ${errorId})`);
    }
  },

  /**
   * 获取红包状态
   */
  async getGiftStatus(giftId: string) {
    try {
      logInfo('GiftService', `获取红包状态: ${giftId}`);
      const response = await apiClient.get(API_ENDPOINTS.gifts.status, { gift_id: giftId });
      logInfo('GiftService', '红包状态获取成功');
      return response;
    } catch (error: any) {
      const errorId = Date.now().toString(36);
      logError('GiftService', `红包状态获取失败 [${errorId}]: ${getErrorMessage(error)}`, ErrorCategory.DATA_FETCHING, error);
      throw new Error(`获取红包状态失败: ${getErrorMessage(error)} (错误ID: ${errorId})`);
    }
  },
};

// ==================== 任务服务 ====================

export const taskService = {
  /**
   * 获取任务列表
   */
  async getTaskList() {
    try {
      logInfo('TaskService', '开始获取任务列表');
      const response = await apiClient.get(API_ENDPOINTS.tasks.list);
      logInfo('TaskService', '任务列表获取成功');
      return response;
    } catch (error: any) {
      const errorId = Date.now().toString(36);
      logError('TaskService', `任务列表获取失败 [${errorId}]: ${getErrorMessage(error)}`, ErrorCategory.DATA_FETCHING, error);
      throw new Error(`获取任务列表失败: ${getErrorMessage(error)} (错误ID: ${errorId})`);
    }
  },

  /**
   * 创建任务
   */
  async createTask(task: {
    name: string;
    giftId: string;
    scheduledTime: string;
    repeatType?: string;
  }) {
    try {
      logInfo('TaskService', '开始创建任务', task);
      const response = await apiClient.post(API_ENDPOINTS.tasks.create, task);
      logInfo('TaskService', '任务创建成功');
      return response;
    } catch (error: any) {
      const errorId = Date.now().toString(36);
      logError('TaskService', `任务创建失败 [${errorId}]: ${getErrorMessage(error)}`, ErrorCategory.BUSINESS_LOGIC, error);
      throw new Error(`创建任务失败: ${getErrorMessage(error)} (错误ID: ${errorId})`);
    }
  },

  /**
   * 更新任务
   */
  async updateTask(taskId: string, updates: any) {
    try {
      logInfo('TaskService', `开始更新任务: ${taskId}`);
      const response = await apiClient.put(API_ENDPOINTS.tasks.update, { task_id: taskId, ...updates });
      logInfo('TaskService', '任务更新成功');
      return response;
    } catch (error: any) {
      const errorId = Date.now().toString(36);
      logError('TaskService', `任务更新失败 [${errorId}]: ${getErrorMessage(error)}`, ErrorCategory.BUSINESS_LOGIC, error);
      throw new Error(`更新任务失败: ${getErrorMessage(error)} (错误ID: ${errorId})`);
    }
  },

  /**
   * 删除任务
   */
  async deleteTask(taskId: string) {
    try {
      logInfo('TaskService', `开始删除任务: ${taskId}`);
      const response = await apiClient.delete(`${API_ENDPOINTS.tasks.delete}?task_id=${taskId}`);
      logInfo('TaskService', '任务删除成功');
      return response;
    } catch (error: any) {
      const errorId = Date.now().toString(36);
      logError('TaskService', `任务删除失败 [${errorId}]: ${getErrorMessage(error)}`, ErrorCategory.BUSINESS_LOGIC, error);
      throw new Error(`删除任务失败: ${getErrorMessage(error)} (错误ID: ${errorId})`);
    }
  },

  /**
   * 启动任务
   */
  async startTask(taskId: string) {
    try {
      logInfo('TaskService', `开始启动任务: ${taskId}`);
      const response = await apiClient.post(API_ENDPOINTS.tasks.start, { task_id: taskId });
      logInfo('TaskService', '任务启动成功');
      return response;
    } catch (error: any) {
      const errorId = Date.now().toString(36);
      logError('TaskService', `任务启动失败 [${errorId}]: ${getErrorMessage(error)}`, ErrorCategory.BUSINESS_LOGIC, error);
      throw new Error(`启动任务失败: ${getErrorMessage(error)} (错误ID: ${errorId})`);
    }
  },

  /**
   * 停止任务
   */
  async stopTask(taskId: string) {
    try {
      logInfo('TaskService', `开始停止任务: ${taskId}`);
      const response = await apiClient.post(API_ENDPOINTS.tasks.stop, { task_id: taskId });
      logInfo('TaskService', '任务停止成功');
      return response;
    } catch (error: any) {
      const errorId = Date.now().toString(36);
      logError('TaskService', `任务停止失败 [${errorId}]: ${getErrorMessage(error)}`, ErrorCategory.BUSINESS_LOGIC, error);
      throw new Error(`停止任务失败: ${getErrorMessage(error)} (错误ID: ${errorId})`);
    }
  },

  /**
   * 获取任务日志
   */
  async getTaskLogs(taskId: string, params?: { limit?: number; offset?: number }) {
    try {
      logInfo('TaskService', `获取任务日志: ${taskId}`);
      const response = await apiClient.get(API_ENDPOINTS.tasks.logs, { task_id: taskId, ...params });
      logInfo('TaskService', '任务日志获取成功');
      return response;
    } catch (error: any) {
      const errorId = Date.now().toString(36);
      logError('TaskService', `任务日志获取失败 [${errorId}]: ${getErrorMessage(error)}`, ErrorCategory.DATA_FETCHING, error);
      throw new Error(`获取任务日志失败: ${getErrorMessage(error)} (错误ID: ${errorId})`);
    }
  },
};

// ==================== 设置服务 ====================

export const settingsService = {
  /**
   * 获取设置
   */
  async getSettings() {
    try {
      logInfo('SettingsService', '开始获取用户设置');
      const response = await apiClient.get(API_ENDPOINTS.settings.get);
      logInfo('SettingsService', '用户设置获取成功');
      return response;
    } catch (error: any) {
      const errorId = Date.now().toString(36);
      logError('SettingsService', `用户设置获取失败 [${errorId}]: ${getErrorMessage(error)}`, ErrorCategory.DATA_FETCHING, error);
      throw new Error(`获取设置失败: ${getErrorMessage(error)} (错误ID: ${errorId})`);
    }
  },

  /**
   * 更新设置
   */
  async updateSettings(settings: any) {
    try {
      logInfo('SettingsService', '开始更新用户设置');
      const response = await apiClient.put(API_ENDPOINTS.settings.update, settings);
      logInfo('SettingsService', '用户设置更新成功');
      return response;
    } catch (error: any) {
      const errorId = Date.now().toString(36);
      logError('SettingsService', `用户设置更新失败 [${errorId}]: ${getErrorMessage(error)}`, ErrorCategory.DATA_VALIDATION, error);
      throw new Error(`更新设置失败: ${getErrorMessage(error)} (错误ID: ${errorId})`);
    }
  },

  /**
   * 更新Cookie
   */
  async updateCookie(cookie: string) {
    try {
      logInfo('SettingsService', '开始更新用户Cookie');
      const response = await apiClient.put(API_ENDPOINTS.settings.updateCookie, { cookie });
      logInfo('SettingsService', '用户Cookie更新成功');
      return response;
    } catch (error: any) {
      const errorId = Date.now().toString(36);
      logError('SettingsService', `用户Cookie更新失败 [${errorId}]: ${getErrorMessage(error)}`, ErrorCategory.AUTHENTICATION, error);
      throw new Error(`更新Cookie失败: ${getErrorMessage(error)} (错误ID: ${errorId})`);
    }
  },

  /**
   * 导出数据
   */
  async exportData() {
    try {
      logInfo('SettingsService', '开始导出用户数据');
      const response = await apiClient.get(API_ENDPOINTS.settings.export);
      logInfo('SettingsService', '用户数据导出成功');
      return response;
    } catch (error: any) {
      const errorId = Date.now().toString(36);
      logError('SettingsService', `用户数据导出失败 [${errorId}]: ${getErrorMessage(error)}`, ErrorCategory.DATA_EXPORT, error);
      throw new Error(`导出数据失败: ${getErrorMessage(error)} (错误ID: ${errorId})`);
    }
  },
};

// ==================== 统计服务 ====================

export const statService = {
  /**
   * 获取统计概览
   */
  async getStatsOverview() {
    try {
      logInfo('StatService', '开始获取统计概览');
      const response = await apiClient.get(API_ENDPOINTS.stats.overview);
      logInfo('StatService', '统计概览获取成功');
      return response;
    } catch (error: any) {
      const errorId = Date.now().toString(36);
      logError('StatService', `统计概览获取失败 [${errorId}]: ${getErrorMessage(error)}`, ErrorCategory.DATA_FETCHING, error);
      throw new Error(`获取统计概览失败: ${getErrorMessage(error)} (错误ID: ${errorId})`);
    }
  },

  /**
   * 获取收益统计
   */
  async getEarningsStats(params: any) {
    try {
      logInfo('StatService', '开始获取收益统计');
      const response = await apiClient.get(API_ENDPOINTS.stats.earnings, params);
      logInfo('StatService', '收益统计获取成功');
      return response;
    } catch (error: any) {
      const errorId = Date.now().toString(36);
      logError('StatService', `收益统计获取失败 [${errorId}]: ${getErrorMessage(error)}`, ErrorCategory.DATA_FETCHING, error);
      throw new Error(`获取收益统计失败: ${getErrorMessage(error)} (错误ID: ${errorId})`);
    }
  },

  /**
   * 获取任务统计
   */
  async getTaskStats(params: any) {
    try {
      logInfo('StatService', '开始获取任务统计');
      const response = await apiClient.get(API_ENDPOINTS.stats.tasks, params);
      logInfo('StatService', '任务统计获取成功');
      return response;
    } catch (error: any) {
      const errorId = Date.now().toString(36);
      logError('StatService', `任务统计获取失败 [${errorId}]: ${getErrorMessage(error)}`, ErrorCategory.DATA_FETCHING, error);
      throw new Error(`获取任务统计失败: ${getErrorMessage(error)} (错误ID: ${errorId})`);
    }
  },

  /**
   * 获取时间范围统计
   */
  async getStatsByTimeRange(startDate: string, endDate: string) {
    try {
      logInfo('StatService', '开始获取时间范围统计');
      const response = await apiClient.get(API_ENDPOINTS.stats.timeRange, { startDate, endDate });
      logInfo('StatService', '时间范围统计获取成功');
      return response;
    } catch (error: any) {
      const errorId = Date.now().toString(36);
      logError('StatService', `时间范围统计获取失败 [${errorId}]: ${getErrorMessage(error)}`, ErrorCategory.DATA_FETCHING, error);
      throw new Error(`获取时间范围统计失败: ${getErrorMessage(error)} (错误ID: ${errorId})`);
    }
  },
};
