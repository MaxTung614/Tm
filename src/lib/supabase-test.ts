/**
 * Supabase 连接测试工具
 * 用于验证 Supabase 数据库连接是否正常
 */

import { supabase, accountService, riskParamsService, purchaseTaskService, logService } from './supabase';

/**
 * 测试 Supabase 连接
 */
export async function testSupabaseConnection() {
  const results = {
    configured: false,
    connected: false,
    tablesExist: false,
    canWrite: false,
    canRead: false,
    errors: [] as string[]
  };

  try {
    // 1. 检查是否配置
    console.log('📋 [测试 1/5] 检查 Supabase 配置...');
    if (!supabase) {
      results.errors.push('Supabase 未配置。请设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY');
      console.error('❌ Supabase 未配置');
      return results;
    }
    results.configured = true;
    console.log('✅ Supabase 已配置');

    // 2. 测试连接
    console.log('\n📋 [测试 2/5] 测试数据库连接...');
    try {
      const { error } = await supabase.from('accounts').select('count', { count: 'exact', head: true });
      if (error) throw error;
      results.connected = true;
      console.log('✅ 数据库连接成功');
    } catch (error: any) {
      results.errors.push(`数据库连接失败: ${error.message}`);
      console.error('❌ 数据库连接失败:', error.message);
      return results;
    }

    // 3. 检查表是否存在
    console.log('\n📋 [测试 3/5] 检查数据库表...');
    const tables = ['accounts', 'risk_params', 'purchase_tasks', 'purchase_logs'];
    const tableResults = await Promise.all(
      tables.map(async (table) => {
        try {
          const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });
          if (error) throw error;
          console.log(`  ✅ 表 "${table}" 存在`);
          return true;
        } catch (error: any) {
          console.error(`  ❌ 表 "${table}" 不存在:`, error.message);
          results.errors.push(`表 "${table}" 不存在或无法访问`);
          return false;
        }
      })
    );
    results.tablesExist = tableResults.every(r => r);
    if (results.tablesExist) {
      console.log('✅ 所有表都存在');
    }

    // 4. 测试写入权限
    console.log('\n📋 [测试 4/5] 测试写入权限...');
    try {
      const testAccount = await accountService.create('测试账号', 'test_cookie_' + Date.now());
      console.log('  ✅ 创建测试账号成功');
      
      // 清理测试数据
      await accountService.delete(testAccount.id);
      console.log('  ✅ 删除测试账号成功');
      
      results.canWrite = true;
      console.log('✅ 写入权限正常');
    } catch (error: any) {
      results.errors.push(`写入测试失败: ${error.message}`);
      console.error('❌ 写入权限测试失败:', error.message);
    }

    // 5. 测试读取权限
    console.log('\n📋 [测试 5/5] 测试读取权限...');
    try {
      const accounts = await accountService.getAll();
      console.log(`  ✅ 读取账号列表成功 (${accounts.length} 条记录)`);
      
      const riskParams = await riskParamsService.getFirst();
      console.log(`  ✅ 读取风控参数成功 ${riskParams ? '(已配置)' : '(未配置)'}`);
      
      const tasks = await purchaseTaskService.getAll();
      console.log(`  ✅ 读取任务列表成功 (${tasks.length} 条记录)`);
      
      const logs = await logService.getAll(10);
      console.log(`  ✅ 读取日志成功 (最近 ${logs.length} 条)`);
      
      results.canRead = true;
      console.log('✅ 读取权限正常');
    } catch (error: any) {
      results.errors.push(`读取测试失败: ${error.message}`);
      console.error('❌ 读取权限测试失败:', error.message);
    }

  } catch (error: any) {
    results.errors.push(`未知错误: ${error.message}`);
    console.error('❌ 测试过程中发生错误:', error);
  }

  return results;
}

/**
 * 打印测试结果摘要
 */
export function printTestSummary(results: Awaited<ReturnType<typeof testSupabaseConnection>>) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 Supabase 连接测试摘要');
  console.log('='.repeat(60));
  
  console.log(`\n配置状态: ${results.configured ? '✅ 已配置' : '❌ 未配置'}`);
  console.log(`数据库连接: ${results.connected ? '✅ 正常' : '❌ 失败'}`);
  console.log(`数据库表: ${results.tablesExist ? '✅ 完整' : '❌ 缺失'}`);
  console.log(`写入权限: ${results.canWrite ? '✅ 正常' : '❌ 异常'}`);
  console.log(`读取权限: ${results.canRead ? '✅ 正常' : '❌ 异常'}`);
  
  const allPassed = results.configured && 
                    results.connected && 
                    results.tablesExist && 
                    results.canWrite && 
                    results.canRead;
  
  if (allPassed) {
    console.log('\n🎉 所有测试通过！Supabase 后端已准备就绪！');
  } else {
    console.log('\n⚠️ 部分测试失败，请检查以下问题：');
    results.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
    console.log('\n💡 请参考 /docs/SUPABASE-SETUP-GUIDE.md 进行配置');
  }
  
  console.log('='.repeat(60) + '\n');
  
  return allPassed;
}

/**
 * 运行完整测试
 */
export async function runSupabaseTest() {
  console.log('🚀 开始 Supabase 连接测试...\n');
  const results = await testSupabaseConnection();
  const success = printTestSummary(results);
  return { success, results };
}
