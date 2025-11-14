/**
 * Mock API Services - 模拟服务层
 * ⚠️ 仅用于开发和测试环境
 * 生产环境请使用 api-services.real.ts
 */

import { TARGET_RED_PACKETS, RED_PACKET_INFO } from './constants';
import type { MockRedPacket } from './types';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

// =====================================================
// Auth Service (Mock)
// =====================================================

export const authService = {
  async generateQRCode(): Promise<ApiResponse> {
    // ⚠️ Mock: 模拟生成二维码
    console.warn('[MOCK] authService.generateQRCode - 使用模拟数据');
    return {
      success: true,
      data: {
        qrCodeUrl: 'https://qr.alipay.com/mock-qr-code-url',
        sessionId: 'session-' + Date.now(),
        expireTime: Date.now() + 300000 // 5分钟后过期
      }
    };
  },

  async checkQRCode(sessionId: string): Promise<ApiResponse> {
    // ⚠️ Mock: 模拟检查二维码扫描状态
    console.warn('[MOCK] authService.checkQRCode - 使用模拟数据');
    const random = Math.random();
    
    if (random > 0.7) {
      // 30% 概率返回已扫码
      return {
        success: true,
        data: {
          status: 'scanned',
          user: {
            id: '1',
            username: 'test_user',
            nickname: '测试用户',
            balance: 158.50,
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop'
          },
          token: 'mock-token-' + Date.now(),
          cookie: 'cookie2=xxx; _m_h5_tk=xxx; _tb_token_=xxx'
        }
      };
    } else {
      // 等待扫码
      return {
        success: true,
        data: {
          status: 'waiting'
        }
      };
    }
  },

  async getQRCode(): Promise<ApiResponse> {
    // ⚠️ Mock: 模拟二维码数据
    console.warn('[MOCK] authService.getQRCode - 使用模拟数据');
    return {
      success: true,
      data: {
        qrCodeUrl: 'https://qr.alipay.com/mock-qr-code-url',
        sessionId: 'session-' + Date.now(),
        expireTime: Date.now() + 300000
      }
    };
  },

  async checkQRStatus(sessionId: string): Promise<ApiResponse> {
    // ⚠️ Mock: 模拟扫码状态检查
    console.warn('[MOCK] authService.checkQRStatus - 使用模拟数据');
    return {
      success: true,
      data: {
        status: 'waiting', // waiting, scanned, confirmed, expired
        message: '等待扫码'
      }
    };
  },

  async login(credentials: { username: string; password: string }): Promise<ApiResponse> {
    // ⚠️ Mock: 模拟登录
    console.warn('[MOCK] authService.login - 使用模拟数据');
    if (credentials.username === 'admin' && credentials.password === 'admin') {
      return {
        success: true,
        data: {
          user: {
            id: '1',
            username: 'admin',
            nickname: '管理员',
            avatar: null
          },
          token: 'mock-jwt-token'
        }
      };
    }
    return {
      success: false,
      message: '用户名或密码错误'
    };
  }
};

// =====================================================
// Gift Service (Mock)
// =====================================================

export const giftService = {
  async getAllGifts(): Promise<ApiResponse> {
    // ⚠️ Mock: 返回硬编码的11个目标红包数据
    console.warn('[MOCK] giftService.getAllGifts - 使用模拟数据');
    
    const gifts: MockRedPacket[] = TARGET_RED_PACKETS.map((benefitCode, index) => {
      const info = RED_PACKET_INFO[benefitCode];
      return {
        id: `gift-${index + 1}`,
        benefitCode: benefitCode,
        name: info.name,
        amount: info.amount,
        coinCost: parseInt(info.amount),
        type: 'redPacket' as const,
        status: 'available' as const,
        description: info.condition,
        expireTime: '2025-12-31 23:59:59'
      };
    });

    return {
      success: true,
      data: {
        gifts
      }
    };
  },

  async grabGift(giftId: string): Promise<ApiResponse> {
    // ⚠️ Mock: 模拟抢购成功
    console.warn('[MOCK] giftService.grabGift - 使用模拟数据');
    return {
      success: true,
      data: {
        giftId,
        message: '抢购成功'
      }
    };
  },

  async batchGrabGifts(giftIds: string[]): Promise<ApiResponse> {
    // ⚠️ Mock: 模拟批量抢购
    console.warn('[MOCK] giftService.batchGrabGifts - 使用模拟数据');
    return {
      success: true,
      data: {
        success: giftIds.length,
        failed: 0
      }
    };
  }
};

// =====================================================
// Stat Service (Mock)
// =====================================================

export const statService = {
  async getStatsOverview(): Promise<ApiResponse> {
    // ⚠️ Mock: 模拟统计数据
    console.warn('[MOCK] statService.getStatsOverview - 使用模拟数据');
    return {
      success: true,
      data: {
        totalGrabbed: 128,
        successRate: 95,
        totalAmount: 1580,
        todayGrabbed: 12
      }
    };
  }
};

// =====================================================
// Task Service (Mock)
// =====================================================

export const taskService = {
  async getTaskList(): Promise<ApiResponse> {
    // ⚠️ Mock: 模拟任务列表
    console.warn('[MOCK] taskService.getTaskList - 使用模拟数据');
    return {
      success: true,
      data: {
        tasks: [
          {
            id: '1',
            name: '每日签到',
            giftId: 'gift-daily-signin',
            giftName: '每日签到奖励',
            scheduledTime: '09:00',
            repeatType: 'daily',
            status: 'completed',
            lastRun: '2025-11-13 09:00:00',
            nextRun: '2025-11-14 09:00:00',
            createdAt: '2025-11-01 08:00:00'
          },
          {
            id: '2',
            name: '自动抢购',
            giftId: 'gift-auto-grab',
            giftName: '新人红包',
            scheduledTime: '15:30',
            repeatType: 'daily',
            status: 'pending',
            nextRun: '2025-11-13 15:30:00',
            createdAt: '2025-11-10 10:00:00'
          }
        ]
      }
    };
  },

  async createTask(taskData: any): Promise<ApiResponse> {
    // ⚠️ Mock: 模拟创建任务
    console.warn('[MOCK] taskService.createTask - 使用模拟数据');
    return {
      success: true,
      data: {
        id: 'task-' + Date.now(),
        ...taskData,
        status: 'pending',
        createdAt: new Date().toISOString()
      }
    };
  },

  async updateTask(taskId: string, taskData: any): Promise<ApiResponse> {
    // ⚠️ Mock: 模拟更新任务
    console.warn('[MOCK] taskService.updateTask - 使用模拟数据');
    return {
      success: true,
      data: {
        id: taskId,
        ...taskData,
        updatedAt: new Date().toISOString()
      }
    };
  },

  async deleteTask(taskId: string): Promise<ApiResponse> {
    // ⚠️ Mock: 模拟删除任务
    console.warn('[MOCK] taskService.deleteTask - 使用模拟数据');
    return {
      success: true,
      message: '任务删除成功'
    };
  },

  async toggleTask(taskId: string, enabled: boolean): Promise<ApiResponse> {
    // ⚠️ Mock: 模拟启动/暂停任务
    console.warn('[MOCK] taskService.toggleTask - 使用模拟数据');
    return {
      success: true,
      message: enabled ? '任务已启动' : '任务已暂停'
    };
  },

  async stopTask(taskId: string): Promise<ApiResponse> {
    // ⚠️ Mock: 模拟停止任务
    console.warn('[MOCK] taskService.stopTask - 使用模拟数据');
    return {
      success: true,
      message: '任务已停止'
    };
  }
};

// =====================================================
// Settings Service (Mock)
// =====================================================

export const settingsService = {
  async getSettings(): Promise<ApiResponse> {
    // ⚠️ Mock: 模拟获取设置
    console.warn('[MOCK] settingsService.getSettings - 使用模拟数据');
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
  },

  async updateSettings(settings: any): Promise<ApiResponse> {
    // ⚠️ Mock: 模拟更新设置
    console.warn('[MOCK] settingsService.updateSettings - 使用模拟数据');
    return {
      success: true,
      message: '设置保存成功'
    };
  },

  async updateCookie(cookie: string): Promise<ApiResponse> {
    // ⚠️ Mock: 模拟更新 Cookie
    console.warn('[MOCK] settingsService.updateCookie - 使用模拟数据');
    return {
      success: true,
      message: 'Cookie 更新成功'
    };
  },

  async exportData(): Promise<ApiResponse> {
    // ⚠️ Mock: 模拟导出数据
    console.warn('[MOCK] settingsService.exportData - 使用模拟数据');
    return {
      success: true,
      data: {
        settings: {
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
        },
        tasks: [],
        history: []
      }
    };
  }
};