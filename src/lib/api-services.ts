/**
 * API服务层
 * 封装所有业务API调用
 */

import { apiClient } from './api-client';
import { API_ENDPOINTS } from './api-config';

// ==================== 认证服务 ====================

export const authService = {
  /**
   * 生成二维码
   */
  async generateQRCode() {
    return apiClient.post(API_ENDPOINTS.auth.qrcode.generate);
  },

  /**
   * 检查二维码扫码状态
   */
  async checkQRCode(qrCodeId: string) {
    return apiClient.get(API_ENDPOINTS.auth.qrcode.check, { qr_id: qrCodeId });
  },

  /**
   * Cookie登录
   */
  async loginWithCookie(cookie: string) {
    return apiClient.post(API_ENDPOINTS.auth.login, { cookie });
  },

  /**
   * 退出登录
   */
  async logout() {
    return apiClient.post(API_ENDPOINTS.auth.logout);
  },

  /**
   * 获取用户信息
   */
  async getUserInfo() {
    return apiClient.get(API_ENDPOINTS.auth.userInfo);
  },
};

// ==================== 红包服务 ====================

export const giftService = {
  /**
   * 获取红包列表
   */
  async getGiftList(params?: { status?: string; page?: number; limit?: number }) {
    return apiClient.get(API_ENDPOINTS.gifts.list, params);
  },

  /**
   * 抢购单个红包
   */
  async grabGift(giftId: string) {
    return apiClient.post(API_ENDPOINTS.gifts.grab, { gift_id: giftId });
  },

  /**
   * 批量抢购红包
   */
  async batchGrabGifts(giftIds: string[]) {
    return apiClient.post(API_ENDPOINTS.gifts.batchGrab, { gift_ids: giftIds });
  },

  /**
   * 获取红包状态
   */
  async getGiftStatus(giftId: string) {
    return apiClient.get(API_ENDPOINTS.gifts.status, { gift_id: giftId });
  },
};

// ==================== 任务服务 ====================

export const taskService = {
  /**
   * 获取任务列表
   */
  async getTaskList() {
    return apiClient.get(API_ENDPOINTS.tasks.list);
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
    return apiClient.post(API_ENDPOINTS.tasks.create, task);
  },

  /**
   * 更新任务
   */
  async updateTask(taskId: string, updates: any) {
    return apiClient.put(API_ENDPOINTS.tasks.update, { task_id: taskId, ...updates });
  },

  /**
   * 删除任务
   */
  async deleteTask(taskId: string) {
    return apiClient.delete(`${API_ENDPOINTS.tasks.delete}?task_id=${taskId}`);
  },

  /**
   * 启动任务
   */
  async startTask(taskId: string) {
    return apiClient.post(API_ENDPOINTS.tasks.start, { task_id: taskId });
  },

  /**
   * 停止任务
   */
  async stopTask(taskId: string) {
    return apiClient.post(API_ENDPOINTS.tasks.stop, { task_id: taskId });
  },

  /**
   * 获取任务日志
   */
  async getTaskLogs(taskId: string, params?: { limit?: number; offset?: number }) {
    return apiClient.get(API_ENDPOINTS.tasks.logs, { task_id: taskId, ...params });
  },
};

// ==================== 设置服务 ====================

export const settingsService = {
  /**
   * 获取设置
   */
  async getSettings() {
    return apiClient.get(API_ENDPOINTS.settings.get);
  },

  /**
   * 更新设置
   */
  async updateSettings(settings: any) {
    return apiClient.put(API_ENDPOINTS.settings.update, settings);
  },

  /**
   * 更新Cookie
   */
  async updateCookie(cookie: string) {
    return apiClient.put(API_ENDPOINTS.settings.updateCookie, { cookie });
  },

  /**
   * 导出数据
   */
  async exportData() {
    return apiClient.get(API_ENDPOINTS.settings.export);
  },
};

// ==================== 统计服务 ====================

export const statsService = {
  /**
   * 获取仪表板统计数据
   */
  async getDashboardStats() {
    return apiClient.get(API_ENDPOINTS.stats.dashboard);
  },

  /**
   * 获取历史记录
   */
  async getHistory(params?: { start_date?: string; end_date?: string; limit?: number }) {
    return apiClient.get(API_ENDPOINTS.stats.history, params);
  },
};
