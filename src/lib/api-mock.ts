/**
 * API Mock服务
 * 用于开发环境和演示环境的模拟数据
 */

// 检测是否在演示模式
export const isDemoMode = (): boolean => {
  // 如果在Figma预览环境或本地开发但后端未运行
  return window.location.hostname.includes('figma') || 
         window.location.hostname.includes('localhost') && !navigator.onLine;
};

// 模拟延迟
const mockDelay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

// 模拟用户数据
const mockUser = {
  id: 'demo_user_001',
  name: '演示用户',
  balance: 888,
  phone: '138****8888',
  avatar: null,
};

// 模拟红包数据
const mockGifts = [
  {
    id: 'gift_001',
    benefitCode: 'TMALL_GIFT_001',
    name: '双11超级红包',
    amount: '88.88',
    coinCost: 0,
    type: 'redPacket',
    status: 'available',
    expireTime: '2025-12-31 23:59:59',
    description: '限时抢购，先到先得',
  },
  {
    id: 'gift_002',
    benefitCode: 'TMALL_GIFT_002',
    name: '店铺优惠券',
    amount: '50.00',
    coinCost: 0,
    type: 'redPacket',
    status: 'available',
    expireTime: '2025-12-31 23:59:59',
    description: '全场通用',
  },
  {
    id: 'gift_003',
    benefitCode: 'TMALL_GIFT_003',
    name: '品类券',
    amount: '30.00',
    coinCost: 0,
    type: 'redPacket',
    status: 'available',
    expireTime: '2025-12-31 23:59:59',
    description: '部分商品可用',
  },
];

// 模拟统计数据
const mockStats = {
  totalGrabbed: 156,
  successRate: 89,
  totalAmount: 2345.67,
  todayGrabbed: 23,
};

// Mock API响应
export const mockApi = {
  // 认证相关
  auth: {
    generateQRCode: async () => {
      await mockDelay();
      return {
        success: true,
        data: {
          qrcode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          token: 'demo_qr_token_' + Date.now(),
          expireTime: Date.now() + 300000, // 5分钟后过期
        },
      };
    },
    
    checkQRCode: async (token: string) => {
      await mockDelay(1000);
      // 模拟扫码状态变化
      const random = Math.random();
      if (random < 0.3) {
        return {
          success: true,
          data: {
            status: 'pending',
            message: '等待扫码...',
          },
        };
      } else if (random < 0.6) {
        return {
          success: true,
          data: {
            status: 'scanned',
            message: '已扫码，请在手机上确认',
          },
        };
      } else {
        return {
          success: true,
          data: {
            status: 'confirmed',
            message: '登录成功',
            user: mockUser,
            token: 'demo_access_token_' + Date.now(),
          },
        };
      }
    },
    
    getUserInfo: async () => {
      await mockDelay();
      return {
        success: true,
        data: mockUser,
      };
    },
  },
  
  // 红包相关
  gifts: {
    getList: async (params?: any) => {
      await mockDelay();
      return {
        success: true,
        data: {
          gifts: mockGifts,
          total: mockGifts.length,
        },
      };
    },
    
    grab: async (giftId: string) => {
      await mockDelay(800);
      const random = Math.random();
      if (random > 0.2) {
        return {
          success: true,
          data: {
            giftId,
            amount: mockGifts.find(g => g.id === giftId)?.amount || '0',
            message: '抢购成功！',
          },
        };
      } else {
        return {
          success: false,
          message: '手速太慢了，红包已被抢光',
        };
      }
    },
    
    batchGrab: async (giftIds: string[]) => {
      await mockDelay(1500);
      const success = Math.floor(giftIds.length * 0.8);
      const failed = giftIds.length - success;
      return {
        success: true,
        data: {
          success,
          failed,
          results: giftIds.map((id, i) => ({
            giftId: id,
            success: i < success,
            message: i < success ? '抢购成功' : '已抢光',
          })),
        },
      };
    },
  },
  
  // 统计相关
  stats: {
    getOverview: async () => {
      await mockDelay();
      return {
        success: true,
        data: mockStats,
      };
    },
  },
  
  // 任务相关
  tasks: {
    getList: async () => {
      await mockDelay();
      return {
        success: true,
        data: {
          tasks: [
            {
              id: 'task_001',
              name: '每日自动抢购',
              type: 'scheduled',
              status: 'running',
              nextRun: '2025-11-13 00:00:00',
              lastRun: '2025-11-12 00:00:00',
              successCount: 45,
              failCount: 5,
            },
          ],
        },
      };
    },
  },
  
  // 设置相关
  settings: {
    get: async () => {
      await mockDelay();
      return {
        success: true,
        data: {
          notifications: {
            grabSuccess: true,
            grabFailed: true,
            taskComplete: true,
            lowBalance: false,
          },
          autoGrab: {
            enabled: false,
            interval: 5,
            maxRetry: 3,
          },
          performance: {
            requestTimeout: 30,
            maxConcurrent: 5,
          },
        },
      };
    },
    
    update: async (data: any) => {
      await mockDelay();
      return {
        success: true,
        message: '演示模式：设置已保存（仅本地）',
        data: data,
      };
    },
    
    updateCookie: async (cookie: string) => {
      await mockDelay();
      return {
        success: true,
        message: '演示模式：Cookie 更新功能需要后端支持',
      };
    },
    
    export: async () => {
      await mockDelay();
      return {
        success: true,
        data: {
          user: mockUser,
          settings: {
            notifications: {
              grabSuccess: true,
              grabFailed: true,
              taskComplete: true,
              lowBalance: false,
            },
            autoGrab: {
              enabled: false,
              interval: 5,
              maxRetry: 3,
            },
          },
          stats: mockStats,
          exportTime: new Date().toISOString(),
        },
      };
    },
  },
  
  // 监控相关
  monitor: {
    getList: async () => {
      await mockDelay();
      return {
        success: true,
        monitors: [],
      };
    },
    
    getPerformance: async () => {
      await mockDelay();
      return {
        success: true,
        stats: {
          total_monitors: 0,
          active_monitors: 0,
          total_checks: 0,
          total_state_changes: 0,
          overall_avg_response_ms: 0,
          min_response_ms: 0,
          max_response_ms: 0,
        },
      };
    },
    
    start: async (data: any) => {
      await mockDelay();
      return {
        success: true,
        message: '演示模式：监控功能需要后端服务支持',
      };
    },
  },
  
  // 会话健康相关
  sessionHealth: {
    getStatus: async () => {
      await mockDelay();
      return {
        success: true,
        basic_service: {
          is_running: false,
          check_interval: 3600,
          last_check: null,
          total_checks: 0,
          current_status: {
            healthy_accounts: 0,
            unhealthy_accounts: 0,
            total_accounts: 0,
          },
        },
        enhanced_service: {
          is_running: false,
          check_interval: 3600,
          last_check: null,
          total_checks: 0,
          current_status: {
            healthy_accounts: 0,
            unhealthy_accounts: 0,
            total_accounts: 0,
          },
        },
        is_running: false,
      };
    },
    
    start: async (data: any) => {
      await mockDelay();
      return {
        success: true,
        message: '演示模式：健康检查需要后端服务支持',
      };
    },
  },
  
  // 账号相关
  accounts: {
    getList: async () => {
      await mockDelay();
      return {
        success: true,
        data: {
          accounts: [
            {
              id: 'account_001',
              name: '演示账号1',
              phone: '138****8888',
              balance: 888,
              status: 'active',
              lastLoginTime: '2025-11-12 10:30:00',
            },
          ],
        },
      };
    },
  },
};

// 检查后端是否可用
export const checkBackendAvailable = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    const response = await fetch('http://localhost:8000/api/health', {
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    return false;
  }
};