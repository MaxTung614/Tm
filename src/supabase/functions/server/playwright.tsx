// Playwright 服务集成模块
// 用于调用外部 Playwright 服务完成淘宝扫码登录

// ⚠️ 请在 Supabase Dashboard 中设置以下环境变量：
// PLAYWRIGHT_SERVICE_URL - Playwright 服务地址（例如：https://taobao-playwright-service.onrender.com）
// PLAYWRIGHT_API_KEY - Playwright 服务的 API 密钥

const PLAYWRIGHT_SERVICE_URL = Deno.env.get("PLAYWRIGHT_SERVICE_URL") || "";
const PLAYWRIGHT_API_KEY = Deno.env.get("PLAYWRIGHT_API_KEY") || "";

/**
 * 调用 Playwright 服务生成二维码
 */
export async function generateQRCodeWithPlaywright() {
  try {
    if (!PLAYWRIGHT_SERVICE_URL || !PLAYWRIGHT_API_KEY) {
      throw new Error(
        "未配置 Playwright 服务。请在 Supabase Dashboard 中设置 PLAYWRIGHT_SERVICE_URL 和 PLAYWRIGHT_API_KEY 环境变量。"
      );
    }

    console.log(`[Playwright] 调用服务生成二维码: ${PLAYWRIGHT_SERVICE_URL}`);

    const response = await fetch(`${PLAYWRIGHT_SERVICE_URL}/qrcode/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": PLAYWRIGHT_API_KEY,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Playwright 服务返回错误: ${response.status} ${errorText}`
      );
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Playwright 服务返回失败");
    }

    console.log(
      `[Playwright] ✅ 二维码生成成功，会话ID: ${data.data.sessionId}`
    );

    return {
      success: true,
      qrCodeUrl: data.data.qrCodeUrl,
      sessionId: data.data.sessionId,
      cookies: data.data.cookies,
      t: data.data.t,
      ck: data.data.ck,
      csrf: data.data.csrf,
    };
  } catch (error: any) {
    console.error(`[Playwright] ❌ 生成二维码失败:`, error.message);
    throw error;
  }
}

/**
 * 调用 Playwright 服务检查二维码状态并获取 Cookie
 */
export async function checkQRCodeWithPlaywright(
  sessionId: string,
  checkUrl: string
) {
  try {
    if (!PLAYWRIGHT_SERVICE_URL || !PLAYWRIGHT_API_KEY) {
      throw new Error(
        "未配置 Playwright 服务。请在 Supabase Dashboard 中设置 PLAYWRIGHT_SERVICE_URL 和 PLAYWRIGHT_API_KEY 环境变量。"
      );
    }

    console.log(
      `[Playwright] 调用服务检查二维码: ${sessionId.substring(0, 20)}...`
    );

    const response = await fetch(`${PLAYWRIGHT_SERVICE_URL}/qrcode/check`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": PLAYWRIGHT_API_KEY,
      },
      body: JSON.stringify({
        sessionId: sessionId,
        checkUrl: checkUrl,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Playwright 服务返回错误: ${response.status} ${errorText}`
      );
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Playwright 服务返回失败");
    }

    console.log(`[Playwright] ✅ Cookie 提取完成`);
    console.log(`[Playwright] Cookie 长度: ${data.data.cookie.length}`);
    console.log(`[Playwright] Cookie 数量: ${data.data.cookieCount}`);
    console.log(`[Playwright] 用户名: ${data.data.username}`);
    console.log(`[Playwright] 包含登录凭证: ${data.data.hasLoginCookie}`);

    return {
      success: true,
      cookie: data.data.cookie,
      username: data.data.username,
      hasLoginCookie: data.data.hasLoginCookie,
      isVerificationPage: data.data.isVerificationPage,
      finalUrl: data.data.finalUrl,
      cookieCount: data.data.cookieCount,
    };
  } catch (error: any) {
    console.error(`[Playwright] ❌ 检查失败:`, error.message);
    throw error;
  }
}

/**
 * 检查 Playwright 服务健康状态
 */
export async function checkPlaywrightHealth() {
  try {
    if (!PLAYWRIGHT_SERVICE_URL || !PLAYWRIGHT_API_KEY) {
      return {
        healthy: false,
        message: "未配置 Playwright 服务",
      };
    }

    const response = await fetch(`${PLAYWRIGHT_SERVICE_URL}/health`, {
      method: "GET",
      headers: {
        "X-API-Key": PLAYWRIGHT_API_KEY,
      },
    });

    if (!response.ok) {
      return {
        healthy: false,
        message: `服务返回错误: ${response.status}`,
      };
    }

    const data = await response.json();

    return {
      healthy: true,
      message: "服务正常",
      ...data,
    };
  } catch (error: any) {
    return {
      healthy: false,
      message: `连接失败: ${error.message}`,
    };
  }
}
