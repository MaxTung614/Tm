/**
 * Supabase 客户端和数据服务
 * 所有数据存储和管理的核心
 */

import { createClient } from '@supabase/supabase-js';
import CryptoJS from 'crypto-js';
import { projectId, publicAnonKey } from '../utils/supabase/info';

// ✅ 直接使用 Supabase 配置（无需本地环境变量）
const supabaseUrl = `https://${projectId}.supabase.co`;
const supabaseKey = publicAnonKey;
const encryptionKey = 'tmall-gift-auto-purchase-encryption-key-2025';

// 创建 Supabase 客户端
export const supabase = createClient(supabaseUrl, supabaseKey);

console.log('✅ Supabase 客户端初始化成功');
console.log('📡 项目 ID:', projectId);

// =====================================================
// Cookie 加密/解密工具
// =====================================================

/**
 * 加密 Cookie 字符串
 */
export function encryptCookie(cookie: string): string {
  return CryptoJS.AES.encrypt(cookie, encryptionKey).toString();
}

/**
 * 解密 Cookie 字符串
 */
export function decryptCookie(encryptedCookie: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedCookie, encryptionKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Failed to decrypt cookie:', error);
    return '';
  }
}

// =====================================================
// 类型定义
// =====================================================

export interface Account {
  id: string;
  name: string;
  cookie: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RiskParams {
  id: string;
  ua: string;
  umid_token: string;
  asac: string;
  created_at: string;
  updated_at: string;
}

export interface PurchaseTask {
  id: string;
  account_id: string;
  benefit_code: string;
  amount: number;
  scheduled_time?: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  result?: any;
  created_at: string;
  updated_at: string;
}

export interface PurchaseLog {
  id: string;
  task_id?: string;
  account_id?: string;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  details?: any;
  created_at: string;
}

// =====================================================
// 账号管理服务
// =====================================================

export const accountService = {
  /**
   * 创建账号（别名方法，与 save 相同）
   */
  async create(name: string, cookie: string): Promise<Account> {
    return this.save(name, cookie);
  },

  /**
   * 保存账号
   */
  async save(name: string, cookie: string): Promise<Account> {
    const encryptedCookie = encryptCookie(cookie);
    
    const { data, error } = await supabase
      .from('accounts')
      .insert({
        name,
        cookie: encryptedCookie,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to save account:', error);
      throw new Error(`保存账号失败: ${error.message}`);
    }

    return {
      ...data,
      cookie: decryptCookie(data.cookie)
    };
  },

  /**
   * 获取所有账号
   */
  async getAll(): Promise<Account[]> {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to get accounts:', error);
      throw new Error(`获取账号失败: ${error.message}`);
    }

    // 解密 Cookie
    return (data || []).map(account => ({
      ...account,
      cookie: decryptCookie(account.cookie)
    }));
  },

  /**
   * 获取单个账号
   */
  async getById(id: string): Promise<Account | null> {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      console.error('Failed to get account:', error);
      throw new Error(`获取账号失败: ${error.message}`);
    }

    return {
      ...data,
      cookie: decryptCookie(data.cookie)
    };
  },

  /**
   * 更新账号
   * 支持两种调用方式：
   * 1. update(id, name, cookie)
   * 2. update(id, { name, cookie })
   */
  async update(id: string, nameOrUpdates: string | { name?: string; cookie?: string }, cookie?: string): Promise<Account> {
    let payload: any = {};
    
    // 处理两种调用方式
    if (typeof nameOrUpdates === 'string') {
      // update(id, name, cookie)
      if (nameOrUpdates) payload.name = nameOrUpdates;
      if (cookie) payload.cookie = encryptCookie(cookie);
    } else {
      // update(id, updates)
      if (nameOrUpdates.name) payload.name = nameOrUpdates.name;
      if (nameOrUpdates.cookie) payload.cookie = encryptCookie(nameOrUpdates.cookie);
    }

    const { data, error } = await supabase
      .from('accounts')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update account:', error);
      throw new Error(`更新账号失败: ${error.message}`);
    }

    return {
      ...data,
      cookie: decryptCookie(data.cookie)
    };
  },

  /**
   * 删除账号（软删除）
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('accounts')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('Failed to delete account:', error);
      throw new Error(`删除账号失败: ${error.message}`);
    }
  },

  /**
   * 切换账号激活状态
   */
  async toggleActive(id: string): Promise<Account> {
    // 先获取当前状态
    const account = await this.getById(id);
    if (!account) {
      throw new Error('账号不存在');
    }

    // 切换状态
    const { data, error } = await supabase
      .from('accounts')
      .update({ is_active: !account.is_active })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Failed to toggle account active status:', error);
      throw new Error(`切换账号状态失败: ${error.message}`);
    }

    return {
      ...data,
      cookie: decryptCookie(data.cookie)
    };
  },

  /**
   * 永久删除账号
   */
  async deletePermanently(id: string): Promise<void> {
    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Failed to permanently delete account:', error);
      throw new Error(`永久删除账号失败: ${error.message}`);
    }
  }
};

// =====================================================
// 风控参数服务
// =====================================================

export const riskParamsService = {
  /**
   * 保存风控参数
   */
  async save(ua: string, umidToken: string, asac?: string): Promise<RiskParams> {
    // 先删除所有旧的参数
    await supabase.from('risk_params').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // 插入新参数
    const { data, error } = await supabase
      .from('risk_params')
      .insert({
        ua,
        umid_token: umidToken,
        asac: asac || '2A21B24LA1SI0HB0EEVN03'
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to save risk params:', error);
      throw new Error(`保存风控参数失败: ${error.message}`);
    }

    return data;
  },

  /**
   * 获取风控参数
   */
  async get(): Promise<RiskParams | null> {
    const { data, error } = await supabase
      .from('risk_params')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      console.error('Failed to get risk params:', error);
      throw new Error(`获取风控参数失败: ${error.message}`);
    }

    return data;
  },

  /**
   * 获取第一个风控参数（别名方法）
   */
  async getFirst(): Promise<RiskParams | null> {
    return this.get();
  },

  /**
   * 更新风控参数
   */
  async update(id: string, updates: { ua?: string; umid_token?: string; asac?: string }): Promise<RiskParams> {
    const { data, error } = await supabase
      .from('risk_params')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update risk params:', error);
      throw new Error(`更新风控参数失败: ${error.message}`);
    }

    return data;
  }
};

// =====================================================
// 抢购任务服务
// =====================================================

export const purchaseTaskService = {
  /**
   * 创建抢购任务
   */
  async create(
    accountId: string,
    benefitCode: string,
    amount: number,
    scheduledTime?: Date
  ): Promise<PurchaseTask> {
    const { data, error } = await supabase
      .from('purchase_tasks')
      .insert({
        account_id: accountId,
        benefit_code: benefitCode,
        amount,
        scheduled_time: scheduledTime?.toISOString(),
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create task:', error);
      throw new Error(`创建任务失败: ${error.message}`);
    }

    return data;
  },

  /**
   * 更新任务状态
   */
  async updateStatus(
    taskId: string,
    status: 'pending' | 'running' | 'success' | 'failed',
    result?: any
  ): Promise<void> {
    const { error } = await supabase
      .from('purchase_tasks')
      .update({
        status,
        result
      })
      .eq('id', taskId);

    if (error) {
      console.error('Failed to update task status:', error);
      throw new Error(`更新任务状态失败: ${error.message}`);
    }
  },

  /**
   * 获取所有任务
   */
  async getAll(): Promise<PurchaseTask[]> {
    const { data, error } = await supabase
      .from('purchase_tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to get tasks:', error);
      throw new Error(`获取任务失败: ${error.message}`);
    }

    return data || [];
  },

  /**
   * 获取账号的任务
   */
  async getByAccount(accountId: string): Promise<PurchaseTask[]> {
    const { data, error } = await supabase
      .from('purchase_tasks')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to get account tasks:', error);
      throw new Error(`获取账号任务失败: ${error.message}`);
    }

    return data || [];
  },

  /**
   * 获取单个任务
   */
  async getById(taskId: string): Promise<PurchaseTask | null> {
    const { data, error } = await supabase
      .from('purchase_tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      console.error('Failed to get task:', error);
      throw new Error(`获取任务失败: ${error.message}`);
    }

    return data;
  },

  /**
   * 删除任务
   */
  async delete(taskId: string): Promise<void> {
    const { error } = await supabase
      .from('purchase_tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      console.error('Failed to delete task:', error);
      throw new Error(`删除任务失败: ${error.message}`);
    }
  }
};

// =====================================================
// 日志服务
// =====================================================

export const logService = {
  /**
   * 添加日志
   */
  async add(
    level: 'info' | 'success' | 'warning' | 'error',
    message: string,
    options?: {
      taskId?: string;
      accountId?: string;
      details?: any;
    }
  ): Promise<void> {
    const { error } = await supabase
      .from('purchase_logs')
      .insert({
        task_id: options?.taskId,
        account_id: options?.accountId,
        level,
        message,
        details: options?.details
      });

    if (error) {
      console.error('Failed to add log:', error);
      // 日志失败不抛出异常，只记录
    }
  },

  /**
   * 获取所有日志
   */
  async getAll(limit: number = 100): Promise<PurchaseLog[]> {
    const { data, error } = await supabase
      .from('purchase_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to get logs:', error);
      throw new Error(`获取日志失败: ${error.message}`);
    }

    return data || [];
  },

  /**
   * 获取任务的日志
   */
  async getByTask(taskId: string): Promise<PurchaseLog[]> {
    const { data, error } = await supabase
      .from('purchase_logs')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to get task logs:', error);
      throw new Error(`获取任务日志失败: ${error.message}`);
    }

    return data || [];
  },

  /**
   * 获取账号的日志
   */
  async getByAccount(accountId: string): Promise<PurchaseLog[]> {
    const { data, error } = await supabase
      .from('purchase_logs')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to get account logs:', error);
      throw new Error(`获取账号日志失败: ${error.message}`);
    }

    return data || [];
  },

  /**
   * 清除旧日志
   */
  async clearOld(daysToKeep: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const { error } = await supabase
      .from('purchase_logs')
      .delete()
      .lt('created_at', cutoffDate.toISOString());

    if (error) {
      console.error('Failed to clear old logs:', error);
      throw new Error(`清除旧日志失败: ${error.message}`);
    }
  }
};

// =====================================================
// 实时订阅（可选功能）
// =====================================================

export const realtimeService = {
  /**
   * 订阅任务变化
   */
  subscribeTasks(callback: (payload: any) => void) {
    return supabase
      .channel('purchase_tasks')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'purchase_tasks' },
        callback
      )
      .subscribe();
  },

  /**
   * 订阅日志变化
   */
  subscribeLogs(callback: (payload: any) => void) {
    return supabase
      .channel('purchase_logs')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'purchase_logs' },
        callback
      )
      .subscribe();
  }
};