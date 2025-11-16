// 应用配置
// 用于控制是否使用 Playwright 模式

/**
 * 是否启用 Playwright 扫码登录
 * 
 * 设置为 true 时：
 * - 使用外部 Playwright 服务（需要部署 Playwright 服务并配置环境变量）
 * - 可以绕过淘宝风控，获取完整 Cookie
 * - 需要在 Supabase 中配置 PLAYWRIGHT_SERVICE_URL 和 PLAYWRIGHT_API_KEY
 * 
 * 设置为 false 时（默认）：
 * - 使用纯 HTTP 方式扫码登录
 * - 可能遇到淘宝风控验证
 * - 推荐使用短信登录或手动输入 Cookie
 */
export const USE_PLAYWRIGHT = false; // ⬅️ 改为 true 启用 Playwright 模式

/**
 * Playwright 服务配置检查
 */
export function checkPlaywrightConfig(): {
  enabled: boolean;
  configured: boolean;
  message: string;
} {
  if (!USE_PLAYWRIGHT) {
    return {
      enabled: false,
      configured: false,
      message: 'Playwright 模式未启用。如需启用，请将 /lib/config.ts 中的 USE_PLAYWRIGHT 设置为 true',
    };
  }

  // 注意：环境变量需要在 Supabase Edge Functions 中配置
  // 前端无法直接访问这些环境变量
  return {
    enabled: true,
    configured: true,
    message: 'Playwright 模式已启用。请确保已在 Supabase 中配置 PLAYWRIGHT_SERVICE_URL 和 PLAYWRIGHT_API_KEY',
  };
}
