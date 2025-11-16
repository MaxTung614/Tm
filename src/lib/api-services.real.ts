/**
 * Real API Services - 真实服务层
 * ✅ 用于生产环境
 * 连接到 Supabase 和天猫真实 API
 */

import { TmallGiftAPI } from './tsdk';
import {
  supabase,
  accountService,
  riskParamsService,
  purchaseTaskService,
  logService
} from './supabase';
import { TARGET_RED_PACKETS, RED_PACKET_INFO } from './constants';
import { toFrontendRedPackets, type FrontendRedPacket } from './types';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { USE_PLAYWRIGHT } from './config';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

// =====================================================
// Auth Service (Real)
// =====================================================

export const authService = {
  async generateQRCode(): Promise<ApiResponse> {
    try {
      // 根据配置选择使用 Playwright 或普通模式
      const endpoint = USE_PLAYWRIGHT 
        ? '/auth/qrcode/generate-playwright'
        : '/auth/qrcode/generate';
      
      console.info(`[REAL] authService.generateQRCode - 调用后端生成二维码 (${USE_PLAYWRIGHT ? 'Playwright模式' : '普通模式'})`);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c6898dcb${endpoint}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || '生成二维码失败');
      }

      console.info('[REAL] 二维码生成成功');
      
      return {
        success: true,
        data: data.data
      };
    } catch (error: any) {
      console.error('[REAL] 生成二维码失败:', error);
      return {
        success: false,
        message: error.message || '生成二维码失败'
      };
    }
  },

  async checkQRCode(qrCodeId: string): Promise<ApiResponse> {
    try {
      console.info(`[REAL] authService.checkQRCode - 检查二维码状态: ${qrCodeId}`);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c6898dcb/auth/qrcode/check`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({ qrCodeId })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || '检查状态失败');
      }

      return {
        success: true,
        data: data.data
      };
    } catch (error: any) {
      console.error('[REAL] 检查二维码状态失败:', error);
      return {
        success: false,
        message: error.message || '检查状态失败'
      };
    }
  },

  async getQRCode(): Promise<ApiResponse> {
    // 与 generateQRCode 相同
    return this.generateQRCode();
  },

  async checkQRStatus(sessionId: string): Promise<ApiResponse> {
    // 与 checkQRCode 相同
    return this.checkQRCode(sessionId);
  },

  async login(credentials: { username: string; password: string }): Promise<ApiResponse> {
    // ✅ Real: 实际项目使用 Cookie 登录
    console.info('[REAL] authService.login - 请使用 Cookie 登录');
    throw new Error('请使用 Cookie 登录功能');
  }
};

// =====================================================
// Gift Service (Real)
// =====================================================

export const giftService = {
  async getAllGifts(): Promise<ApiResponse> {
    try {
      console.info('[REAL] giftService.getAllGifts - 通过后端 API 获取红包');

      // 1. 获取第一个可用账号
      const accounts = await accountService.getAll();
      console.info('[REAL] 获取到账号数量:', accounts?.length || 0);
      
      if (!accounts || accounts.length === 0) {
        console.warn('[REAL] 没有可用账号');
        return {
          success: false,
          message: '请先添加账号'
        };
      }

      const account = accounts[0];
      console.info('[REAL] 使用账号:', account.name, '(ID:', account.id, ')');
      console.info('[REAL] Cookie 长度:', account.cookie?.length || 0);

      // 2. 调用后端 API 获取红包列表
      const apiUrl = `https://${projectId}.supabase.co/functions/v1/make-server-c6898dcb/gifts/list`;
      console.info('[REAL] 调用后端 API:', apiUrl);
      
      const response = await fetch(
        apiUrl,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            cookie: account.cookie,
          }),
        }
      );

      console.info('[REAL] 后端响应状态:', response.status, response.statusText);

      // 解析响应（无论成功还是失败都尝试解析 JSON）
      let data;
      try {
        data = await response.json();
        console.info('[REAL] 解析后的响应数据:', JSON.stringify(data).substring(0, 500));
      } catch (parseError) {
        console.error('[REAL] 无法解析响应 JSON:', parseError);
        throw new Error(`后端响应格式错误: HTTP ${response.status}`);
      }

      console.info(`[REAL] 后端 API 响应:`, data);

      // 检查响应状态并识别错误类型
      if (!response.ok || !data.success) {
        const errorMsg = data.message || '获取红包列表失败';
        
        // 识别 Session 过期错误（支持多种格式）
        if (errorMsg.includes('Session过期') || 
            errorMsg.includes('SESSION_EXPIRED') ||
            errorMsg.includes('Token已过期') ||
            errorMsg.includes('会话已过期') ||
            errorMsg.includes('请重新登录') ||
            errorMsg.includes('Cookie可能已过期')) {
          throw new Error('⚠️ Cookie 已过期，请重新登录获取新的 Cookie');
        }
        
        throw new Error(errorMsg);
      }

      // 3. 转换为前端格式
      const apiPackets = data.data.gifts || [];
      const balance = data.data.balance || 0;
      const availableAmount = data.data.availableAmount || '0';
      
      const frontendPackets = toFrontendRedPackets(apiPackets);

      console.info(`[REAL] 获取成功！礼享金余额: ${balance}, 可用红包: ${frontendPackets.length} 个`);

      return {
        success: true,
        data: {
          gifts: frontendPackets,
          balance: balance,
          availableAmount: availableAmount
        }
      };
    } catch (error: any) {
      console.error('[REAL] giftService.getAllGifts 失败:', error);
      
      // 识别 Session 过期错误
      const errorMsg = error.message || '获取红包列表失败';
      if (errorMsg.includes('Cookie 已过期') || 
          errorMsg.includes('Session过期') ||
          errorMsg.includes('请重新登录')) {
        return {
          success: false,
          message: '⚠️ Cookie 已过期，请重新登录获取新的 Cookie',
          needRelogin: true  // 标记需要重新登录
        };
      }
      
      return {
        success: false,
        message: errorMsg
      };
    }
  },

  async grabGift(giftId: string): Promise<ApiResponse> {
    // ✅ Real: 使用 usePurchase hook 的 purchaseNow 方法
    console.info('[REAL] giftService.grabGift - 请使用 usePurchase hook');
    throw new Error('请使用 usePurchase hook 进行抢购');
  },

  async batchGrabGifts(giftIds: string[]): Promise<ApiResponse> {
    // ✅ Real: 批量抢购需要遍历调用 purchaseNow
    console.info('[REAL] giftService.batchGrabGifts - 请使用 usePurchase hook');
    throw new Error('请使用 usePurchase hook 进行批量抢购');
  }
};

// =====================================================
// Stat Service (Real)
// =====================================================

export const statService = {
  async getStatsOverview(): Promise<ApiResponse> {
    try {
      console.info('[REAL] statService.getStatsOverview - 从 Supabase 计算统计数据');

      // 1. 获取所有任务
      const tasks = await purchaseTaskService.getAll();

      // 2. 计算统计数据
      const totalGrabbed = tasks.length;
      const successCount = tasks.filter(t => t.status === 'success').length;
      const successRate = totalGrabbed > 0 ? Math.round((successCount / totalGrabbed) * 100) : 0;

      // 3. 计算总金额（从成功任务的 amount 累加）
      const totalAmount = tasks
        .filter(t => t.status === 'success')
        .reduce((sum, task) => sum + task.amount, 0);

      // 4. 计算今日抢购数
      const today = new Date().toISOString().split('T')[0];
      const todayGrabbed = tasks.filter(t => {
        const taskDate = new Date(t.created_at).toISOString().split('T')[0];
        return taskDate === today;
      }).length;

      return {
        success: true,
        data: {
          totalGrabbed,
          successRate,
          totalAmount,
          todayGrabbed
        }
      };
    } catch (error: any) {
      console.error('[REAL] statService.getStatsOverview 失败:', error);
      
      // 返回默认值而不是失败，避免影响页面展示
      return {
        success: true,
        data: {
          totalGrabbed: 0,
          successRate: 0,
          totalAmount: 0,
          todayGrabbed: 0
        }
      };
    }
  }
};

// =====================================================
// Task Service (Real)
// =====================================================

export const taskService = {
  async getTaskList(): Promise<ApiResponse> {
    try {
      console.info('[REAL] taskService.getTaskList - 从 Supabase 获取任务');

      // 获取所有任务
      const tasks = await purchaseTaskService.getAll();

      // 转换为前端格式
      const formattedTasks = tasks.map(task => ({
        id: task.id,
        name: `抢购 ${task.amount}元 红包`,
        giftId: task.benefit_code,
        giftName: RED_PACKET_INFO[task.benefit_code]?.name || '未知红包',
        scheduledTime: task.scheduled_time 
          ? new Date(task.scheduled_time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
          : '-',
        repeatType: 'once' as const, // 当前系统只支持单次执行
        status: task.status,
        lastRun: task.status !== 'pending' ? task.updated_at : undefined,
        nextRun: task.scheduled_time,
        createdAt: task.created_at
      }));

      return {
        success: true,
        data: {
          tasks: formattedTasks
        }
      };
    } catch (error: any) {
      console.error('[REAL] taskService.getTaskList 失败:', error);
      return {
        success: false,
        message: error.message || '获取任务列表失败'
      };
    }
  },

  async createTask(taskData: any): Promise<ApiResponse> {
    try {
      console.info('[REAL] taskService.createTask - 创建任务到 Supabase');

      const task = await purchaseTaskService.create(
        taskData.accountId,
        taskData.benefitCode,
        taskData.amount,
        taskData.scheduledTime
      );

      return {
        success: true,
        data: task
      };
    } catch (error: any) {
      console.error('[REAL] taskService.createTask 失败:', error);
      return {
        success: false,
        message: error.message || '创建任务失败'
      };
    }
  },

  async updateTask(taskId: string, taskData: any): Promise<ApiResponse> {
    try {
      console.info('[REAL] taskService.updateTask - 更新任务到 Supabase');

      // 更新任务状态或结果
      if (taskData.status) {
        await purchaseTaskService.updateStatus(taskId, taskData.status, taskData.result);
      }

      const updatedTask = await purchaseTaskService.getById(taskId);

      return {
        success: true,
        data: updatedTask
      };
    } catch (error: any) {
      console.error('[REAL] taskService.updateTask 失败:', error);
      return {
        success: false,
        message: error.message || '更新任务失败'
      };
    }
  },

  async deleteTask(taskId: string): Promise<ApiResponse> {
    try {
      console.info('[REAL] taskService.deleteTask - 从 Supabase 删除任务');

      await purchaseTaskService.delete(taskId);

      return {
        success: true,
        message: '任务删除成功'
      };
    } catch (error: any) {
      console.error('[REAL] taskService.deleteTask 失败:', error);
      return {
        success: false,
        message: error.message || '删除任务失败'
      };
    }
  },

  async toggleTask(taskId: string, enabled: boolean): Promise<ApiResponse> {
    try {
      console.info('[REAL] taskService.toggleTask - 启动/暂停任务');

      // 更新任务状态为 pending(启动) 或 paused(暂停)
      const status = enabled ? 'pending' : 'paused';
      await purchaseTaskService.updateStatus(taskId, status as any);

      return {
        success: true,
        message: enabled ? '任务已启动' : '任务已暂停'
      };
    } catch (error: any) {
      console.error('[REAL] taskService.toggleTask 失败:', error);
      return {
        success: false,
        message: error.message || '操作失败'
      };
    }
  },

  async stopTask(taskId: string): Promise<ApiResponse> {
    try {
      console.info('[REAL] taskService.stopTask - 停止任务');

      // 停止任务直接删除
      await purchaseTaskService.delete(taskId);

      return {
        success: true,
        message: '任务已停止并删除'
      };
    } catch (error: any) {
      console.error('[REAL] taskService.stopTask 失败:', error);
      return {
        success: false,
        message: error.message || '停止任务失败'
      };
    }
  }
};

// =====================================================
// Settings Service (Real)
// =====================================================

export const settingsService = {
  async getSettings(): Promise<ApiResponse> {
    try {
      console.info('[REAL] settingsService.getSettings - 从 localStorage 获取设置');

      // 设置存储在 localStorage 中（前端本地存储）
      const settingsStr = localStorage.getItem('app_settings');
      if (settingsStr) {
        const settings = JSON.parse(settingsStr);
        return {
          success: true,
          data: settings
        };
      }

      // 返回默认设置
      return {
        success: true,
        data: {
          notifications: {
            grabSuccess: true,
            grabFailed: true,
            taskComplete: true
          },
          autoRefresh: {
            enabled: true,
            interval: 30
          },
          advanced: {
            maxRetries: 3,
            timeout: 10
          }
        }
      };
    } catch (error: any) {
      console.error('[REAL] settingsService.getSettings 失败:', error);
      return {
        success: false,
        message: error.message || '获取设置失败'
      };
    }
  },

  async updateSettings(settings: any): Promise<ApiResponse> {
    try {
      console.info('[REAL] settingsService.updateSettings - 保存设置到 localStorage');

      // 保存到 localStorage
      localStorage.setItem('app_settings', JSON.stringify(settings));

      return {
        success: true,
        message: '设置保存成功'
      };
    } catch (error: any) {
      console.error('[REAL] settingsService.updateSettings 失败:', error);
      return {
        success: false,
        message: error.message || '保存设置失败'
      };
    }
  },

  async updateCookie(cookie: string): Promise<ApiResponse> {
    try {
      console.info('[REAL] settingsService.updateCookie - 更新账号 Cookie 到 Supabase');

      // 获取第一个账号并更新 Cookie
      const accounts = await accountService.getAll();
      if (!accounts || accounts.length === 0) {
        return {
          success: false,
          message: '没有找到账号，请先添加账号'
        };
      }

      const account = accounts[0];
      await accountService.update(account.id, { cookie });

      return {
        success: true,
        message: 'Cookie 更新成功'
      };
    } catch (error: any) {
      console.error('[REAL] settingsService.updateCookie 失败:', error);
      return {
        success: false,
        message: error.message || 'Cookie 更新失败'
      };
    }
  },

  async exportData(): Promise<ApiResponse> {
    try {
      console.info('[REAL] settingsService.exportData - 导出所有数据');

      // 1. 获取设置
      const settingsResponse = await this.getSettings();
      const settings = settingsResponse.data || {};

      // 2. 获取任务
      const tasks = await purchaseTaskService.getAll();

      // 3. 获取日志（最近100条）
      const logs = await logService.getAll(100);

      return {
        success: true,
        data: {
          settings,
          tasks,
          history: logs,
          exportTime: new Date().toISOString()
        }
      };
    } catch (error: any) {
      console.error('[REAL] settingsService.exportData 失败:', error);
      return {
        success: false,
        message: error.message || '导出数据失败'
      };
    }
  }
};