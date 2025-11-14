/**
 * 抢购管理 Hook
 * 封装所有抢购相关的逻辑
 */

import { useState, useCallback } from 'react';
import { TmallGiftAPI, RedPacket } from './tsdk';
import {
  accountService,
  riskParamsService,
  purchaseTaskService,
  logService,
  type Account,
  type RiskParams
} from './supabase';
import { filterTargetRedPackets, sortRedPacketsByPriority, isTargetRedPacket } from './constants';

// =====================================================
// 类型定义
// =====================================================

export interface PurchaseResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export interface RedPacketWithAccount extends RedPacket {
  accountId: string;
  accountName: string;
}

// =====================================================
// 主 Hook
// =====================================================

export function usePurchase() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 获取红包列表（只返回目标红包，并按优先级排序）
   */
  const getRedPackets = useCallback(async (accountId: string): Promise<RedPacket[]> => {
    setLoading(true);
    setError(null);

    try {
      // 1. 获取账号
      const account = await accountService.getById(accountId);
      if (!account) {
        throw new Error('账号不存在');
      }

      // 2. 初始化 API
      const api = new TmallGiftAPI(account.cookie);

      // 3. 获取所有红包
      const allPackets = await api.getRedPackets();
      console.log(`✅ 获取到 ${allPackets.length} 个红包`);

      // 4. 过滤出目标红包
      const targetPackets = filterTargetRedPackets(allPackets);
      console.log(`🎯 过滤后保留 ${targetPackets.length} 个目标红包（共11个）`);

      // 5. 按优先级排序
      const sortedPackets = sortRedPacketsByPriority(targetPackets);
      console.log('✅ 按优先级排序完成');

      return sortedPackets;

    } catch (err: any) {
      const errorMsg = err.message || '获取红包列表失败';
      setError(errorMsg);
      console.error('❌ 获取红包列表失败:', err);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 立即抢购
   */
  const purchaseNow = useCallback(async (
    accountId: string,
    benefitCode: string,
    amount: number
  ): Promise<PurchaseResult> => {
    setLoading(true);
    setError(null);

    let taskId: string | undefined;

    try {
      // 0. 验证是否为目标红包
      if (!isTargetRedPacket(benefitCode)) {
        throw new Error('该红包不在目标红包列表中，系统仅支持抢购指定的11个红包');
      }

      console.log(`🎯 开始抢购: 账号=${accountId}, 红包=${benefitCode}, 金额=${amount}`);

      // 1. 获取账号
      const account = await accountService.getById(accountId);
      if (!account) {
        throw new Error('账号不存在');
      }

      // 2. 获取风控参数
      const riskParams = await riskParamsService.get();
      if (!riskParams) {
        throw new Error('请先配置风控参数（ua 和 umidToken）');
      }

      // 验证风控参数
      if (!riskParams.ua || riskParams.ua === 'placeholder_ua_extract_from_browser') {
        throw new Error('请提取真实的 UA 参数');
      }
      if (!riskParams.umid_token || riskParams.umid_token === 'placeholder_umidToken_extract_from_browser') {
        throw new Error('请提取真实的 umidToken 参数');
      }

      // 3. 创建任务
      const task = await purchaseTaskService.create(accountId, benefitCode, amount);
      taskId = task.id;

      // 4. 记录开始日志
      await logService.add('info', `开始抢购 ${amount}元 红包`, {
        taskId,
        accountId,
        details: { benefitCode, amount }
      });

      // 5. 更新任务状态为执行中
      await purchaseTaskService.updateStatus(taskId, 'running');

      // 6. 初始化 API 并执行抢购
      const api = new TmallGiftAPI(account.cookie);
      
      const result = await api.exchangeRedPacket(benefitCode, {
        ua: riskParams.ua,
        umid_token: riskParams.umid_token,
        asac: riskParams.asac
      });

      // 7. 抢购成功
      await purchaseTaskService.updateStatus(taskId, 'success', result);
      
      await logService.add('success', `✅ 抢购成功！获得 ${amount}元 红包`, {
        taskId,
        accountId,
        details: result
      });

      console.log('🎉 抢购成功!', result);

      return {
        success: true,
        message: `抢购成功！获得 ${amount}元 红包`,
        data: result
      };

    } catch (err: any) {
      const errorMsg = err.message || '抢购失败';
      setError(errorMsg);

      // 记录失败
      if (taskId) {
        // 根据错误类型设置不同的状态
        let taskStatus: 'failed' | 'completed' = 'failed';
        
        // 如果是已领取过的错误，标记为完成而非失败
        if (errorMsg.includes('已经领取过') || errorMsg.includes('ALREADY_RECEIVED')) {
          taskStatus = 'completed';
        }
        
        await purchaseTaskService.updateStatus(taskId, taskStatus, { error: errorMsg });
        
        const logLevel = taskStatus === 'completed' ? 'warning' : 'error';
        const logEmoji = taskStatus === 'completed' ? '⚠️' : '❌';
        
        await logService.add(logLevel, `${logEmoji} ${errorMsg}`, {
          taskId,
          accountId,
          details: { benefitCode, amount, error: errorMsg }
        });
      }

      console.error('❌ 抢购失败:', err);

      return {
        success: false,
        message: errorMsg,
        error: errorMsg
      };

    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 定时抢购
   */
  const schedulePurchase = useCallback(async (
    accountId: string,
    benefitCode: string,
    amount: number,
    scheduledTime: Date
  ): Promise<PurchaseResult> => {
    setLoading(true);
    setError(null);

    try {
      const now = Date.now();
      const targetTime = scheduledTime.getTime();
      const delay = targetTime - now;

      if (delay <= 0) {
        throw new Error('定时时间必须在未来');
      }

      console.log(`⏰ 创建定时任务: ${scheduledTime.toLocaleString()}, 延迟 ${delay}ms`);

      // 1. 创建待执行任务
      const task = await purchaseTaskService.create(accountId, benefitCode, amount, scheduledTime);

      // 2. 记录日志
      await logService.add('info', `创建定时抢购任务: ${scheduledTime.toLocaleString()}`, {
        taskId: task.id,
        accountId,
        details: { benefitCode, amount, scheduledTime: scheduledTime.toISOString() }
      });

      // 3. 设置定时器
      setTimeout(() => {
        console.log('⏰ 定时任务触发，开始抢购...');
        purchaseNow(accountId, benefitCode, amount);
      }, delay);

      return {
        success: true,
        message: `定时任务已创建，将在 ${scheduledTime.toLocaleString()} 执行`,
        data: task
      };

    } catch (err: any) {
      const errorMsg = err.message || '创建定时任务失败';
      setError(errorMsg);
      console.error('❌ 创建定时任务失败:', err);

      return {
        success: false,
        message: '创建定时任务失败',
        error: errorMsg
      };

    } finally {
      setLoading(false);
    }
  }, [purchaseNow]);

  /**
   * 批量抢购（多个账号抢同一个红包）
   */
  const batchPurchase = useCallback(async (
    accountIds: string[],
    benefitCode: string,
    amount: number
  ): Promise<PurchaseResult[]> => {
    setLoading(true);
    setError(null);

    try {
      console.log(`🚀 批量抢购: ${accountIds.length} 个账号`);

      // 并发执行所有账号的抢购
      const promises = accountIds.map(accountId =>
        purchaseNow(accountId, benefitCode, amount)
      );

      const results = await Promise.all(promises);

      const successCount = results.filter(r => r.success).length;
      console.log(`✅ 批量抢购完成: ${successCount}/${accountIds.length} 成功`);

      return results;

    } catch (err: any) {
      console.error('❌ 批量抢购失败:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [purchaseNow]);

  /**
   * 获取用户余额
   */
  const getUserBalance = useCallback(async (accountId: string) => {
    setLoading(true);
    setError(null);

    try {
      const account = await accountService.getById(accountId);
      if (!account) {
        throw new Error('账号不存在');
      }

      const api = new TmallGiftAPI(account.cookie);
      const balance = await api.getUserBalance();

      return balance;

    } catch (err: any) {
      const errorMsg = err.message || '获取余额失败';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    // 状态
    loading,
    error,

    // 方法
    getRedPackets,
    purchaseNow,
    schedulePurchase,
    batchPurchase,
    getUserBalance
  };
}

// =====================================================
// 账号管理 Hook
// =====================================================

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await accountService.getAll();
      setAccounts(data);
    } catch (err) {
      console.error('加载账号失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const addAccount = useCallback(async (name: string, cookie: string) => {
    setLoading(true);
    try {
      await accountService.save(name, cookie);
      await loadAccounts();
    } catch (err) {
      console.error('添加账号失败:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadAccounts]);

  const deleteAccount = useCallback(async (id: string) => {
    setLoading(true);
    try {
      await accountService.delete(id);
      await loadAccounts();
    } catch (err) {
      console.error('删除账号失败:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadAccounts]);

  return {
    accounts,
    loading,
    loadAccounts,
    addAccount,
    deleteAccount
  };
}

// =====================================================
// 风控参数管理 Hook
// =====================================================

export function useRiskParams() {
  const [params, setParams] = useState<RiskParams | null>(null);
  const [loading, setLoading] = useState(false);

  const loadParams = useCallback(async () => {
    setLoading(true);
    try {
      const data = await riskParamsService.get();
      setParams(data);
    } catch (err) {
      console.error('加载风控参数失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveParams = useCallback(async (ua: string, umidToken: string, asac?: string) => {
    setLoading(true);
    try {
      const data = await riskParamsService.save(ua, umidToken, asac);
      setParams(data);
    } catch (err) {
      console.error('保存风控参数失败:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    params,
    loading,
    loadParams,
    saveParams
  };
}