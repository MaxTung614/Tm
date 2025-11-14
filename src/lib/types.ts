/**
 * 统一类型定义
 * 解决前后端数据类型不一致问题
 */

import { RedPacket as TsdkRedPacket } from './tsdk';

// =====================================================
// 前端扩展的 RedPacket 类型
// =====================================================

/**
 * 前端展示用的 RedPacket 类型
 * 继承自 TsdkRedPacket，添加前端需要的字段
 */
export interface FrontendRedPacket extends TsdkRedPacket {
  id: string;           // 前端生成的唯一ID（用于 React key）
  type: 'redPacket';    // 前端分类标识（用于过滤）
  displayStatus: 'available' | 'claimed' | 'expired';  // 前端展示状态
}

// =====================================================
// 类型转换函数
// =====================================================

/**
 * 将 TSDK RedPacket 转换为前端 RedPacket
 * @param apiPacket - API 返回的红包数据
 * @returns 前端使用的红包数据
 */
export function toFrontendRedPacket(apiPacket: TsdkRedPacket): FrontendRedPacket {
  return {
    ...apiPacket,
    id: `rp-${apiPacket.benefitCode}`,  // 使用 benefitCode 生成唯一ID
    type: 'redPacket' as const,
    displayStatus: convertToDisplayStatus(apiPacket.status)
  };
}

/**
 * 批量转换
 * @param apiPackets - API 返回的红包数组
 * @returns 前端使用的红包数组
 */
export function toFrontendRedPackets(apiPackets: TsdkRedPacket[]): FrontendRedPacket[] {
  return apiPackets.map(toFrontendRedPacket);
}

/**
 * 转换 API 状态为前端展示状态
 * @param apiStatus - API 返回的状态
 * @returns 前端展示状态
 */
function convertToDisplayStatus(
  apiStatus: 'AVAILABLE' | 'SOLD_OUT' | 'EXCHANGED'
): 'available' | 'claimed' | 'expired' {
  switch (apiStatus) {
    case 'AVAILABLE':
      return 'available';
    case 'EXCHANGED':
      return 'claimed';
    case 'SOLD_OUT':
      return 'expired';
    default:
      return 'expired';
  }
}

/**
 * 反向转换：前端状态转 API 状态
 * @param displayStatus - 前端展示状态
 * @returns API 状态
 */
export function convertToApiStatus(
  displayStatus: 'available' | 'claimed' | 'expired'
): 'AVAILABLE' | 'SOLD_OUT' | 'EXCHANGED' {
  switch (displayStatus) {
    case 'available':
      return 'AVAILABLE';
    case 'claimed':
      return 'EXCHANGED';
    case 'expired':
      return 'SOLD_OUT';
    default:
      return 'SOLD_OUT';
  }
}

// =====================================================
// Mock API 数据类型（用于开发/测试）
// =====================================================

/**
 * Mock 红包数据（仅用于前端展示）
 */
export interface MockRedPacket {
  id: string;
  benefitCode: string;
  name: string;
  amount: string;
  coinCost: number;
  type: 'redPacket';
  status: 'available' | 'claimed' | 'expired';
  expireTime?: string;
  description?: string;
}

/**
 * 将 Mock 数据转换为标准 FrontendRedPacket
 * @param mockPacket - Mock 红包数据
 * @returns 标准前端红包数据
 */
export function fromMockRedPacket(mockPacket: MockRedPacket): FrontendRedPacket {
  return {
    id: mockPacket.id,
    amount: mockPacket.amount,
    benefitCode: mockPacket.benefitCode,
    btnText: '立即兑换',
    buttonTips: '',
    cent: mockPacket.coinCost,
    coinAmount: String(mockPacket.coinCost),
    desc: mockPacket.description,
    status: convertToApiStatus(mockPacket.status),
    subDesc: '',
    title: mockPacket.name,
    type: 'redPacket',
    displayStatus: mockPacket.status
  };
}

// =====================================================
// 导出所有类型
// =====================================================

// 重新导出 TSDK 类型，方便统一从 types.ts 导入
export type { RedPacket as TsdkRedPacket } from './tsdk';
export type { Account, RiskParams, PurchaseTask, PurchaseLog } from './supabase';
