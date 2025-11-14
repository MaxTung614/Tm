-- =====================================================
-- Supabase 数据库初始化脚本
-- 在 Supabase Dashboard → SQL Editor 中执行此脚本
-- =====================================================

-- 1. 账号表（存储加密的 Cookie）
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  cookie TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_accounts_active ON accounts(is_active);
CREATE INDEX IF NOT EXISTS idx_accounts_created ON accounts(created_at DESC);

-- =====================================================

-- 2. 风控参数表
CREATE TABLE IF NOT EXISTS risk_params (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ua TEXT NOT NULL,
  umid_token TEXT NOT NULL,
  asac VARCHAR(50) DEFAULT '2A21B24LA1SI0HB0EEVN03',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================

-- 3. 抢购任务表
CREATE TABLE IF NOT EXISTS purchase_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  benefit_code VARCHAR(100) NOT NULL,
  amount INTEGER NOT NULL,
  scheduled_time TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'pending',
  -- pending: 待执行, running: 执行中, success: 成功, failed: 失败
  result JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_tasks_account ON purchase_tasks(account_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON purchase_tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled ON purchase_tasks(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_tasks_created ON purchase_tasks(created_at DESC);

-- =====================================================

-- 4. 抢购日志表
CREATE TABLE IF NOT EXISTS purchase_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES purchase_tasks(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  level VARCHAR(10) NOT NULL,
  -- info: 信息, success: 成功, warning: 警告, error: 错误
  message TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_logs_task ON purchase_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_logs_account ON purchase_logs(account_id);
CREATE INDEX IF NOT EXISTS idx_logs_level ON purchase_logs(level);
CREATE INDEX IF NOT EXISTS idx_logs_created ON purchase_logs(created_at DESC);

-- =====================================================

-- 5. 关闭行级安全（简化版，适合个人使用）
-- 注意：如果需要多用户支持，请启用 RLS 并配置策略
ALTER TABLE accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE risk_params DISABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_logs DISABLE ROW LEVEL SECURITY;

-- =====================================================

-- 6. 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为需要的表添加触发器
DROP TRIGGER IF EXISTS update_accounts_updated_at ON accounts;
CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_risk_params_updated_at ON risk_params;
CREATE TRIGGER update_risk_params_updated_at
  BEFORE UPDATE ON risk_params
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON purchase_tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON purchase_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================

-- 7. 插入默认的风控参数（asac 硬编码值）
INSERT INTO risk_params (ua, umid_token, asac)
VALUES (
  'placeholder_ua_extract_from_browser',
  'placeholder_umidToken_extract_from_browser',
  '2A21B24LA1SI0HB0EEVN03'
)
ON CONFLICT DO NOTHING;

-- =====================================================

-- 完成！
-- 执行此脚本后，你的 Supabase 数据库已准备就绪
-- 下一步：配置前端环境变量
