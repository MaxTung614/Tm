import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use("*", logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-c6898dcb/health", (c) => {
  return c.json({ status: "ok" });
});

// =====================================================
// 淘宝二维码登录 API - 基于 TSDK 的完整实现
// https://github.com/xinlingqudongX/TSDK
// =====================================================

// 辅助函数：初始化登录前的 CSRF 和 umidToken
async function initLoginBefore() {
  console.log("[QR] 初始化登录前置数据");
  
  const res = await fetch(
    `https://login.taobao.com/havanaone/login/login.htm?bizName=taobao&f=top&redirectURL=${encodeURIComponent("https://www.taobao.com")}`,
    {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: "https://www.taobao.com/",
      },
    },
  );

  if (!res.ok) {
    throw new Error("初始化 Cookie 失败");
  }

  const html = await res.text();
  
  // 提取 viewData 中的 _csrf 和 umidToken
  const viewDataMatch = html.match(/viewData\s*=\s*(\{.*?\});/s);
  if (!viewDataMatch) {
    console.log("[QR] 未找到 viewData，尝试其他方式提取");
    // 尝试直接提取
    const csrfMatch = html.match(/"_csrf"\s*:\s*"([^"]+)"/);
    const umidTokenMatch = html.match(/"umidToken"\s*:\s*"([^"]+)"/);
    
    return {
      csrf: csrfMatch ? csrfMatch[1] : "",
      umidToken: umidTokenMatch ? umidTokenMatch[1] : "",
    };
  }

  try {
    const viewDataStr = viewDataMatch[1];
    const viewData = JSON.parse(viewDataStr);
    const loginForm = viewData.loginFormData || {};
    
    console.log(
      `[QR] 提取成功 - csrf: ${loginForm._csrf?.substring(0, 10)}..., umidToken: ${loginForm.umidToken?.substring(0, 10)}...`,
    );
    
    return {
      csrf: loginForm._csrf || "",
      umidToken: loginForm.umidToken || "",
    };
  } catch (err) {
    console.error("[QR] 解析 viewData 失败:", err);
    return {
      csrf: "",
      umidToken: "",
    };
  }
}

// 生成淘宝登录二维码（完全基于 TSDK 第 195-213 行）
app.post(
  "/make-server-c6898dcb/auth/qrcode/generate",
  async (c) => {
    try {
      console.log("[QR] ========== 开始生成二维码 ==========");

      // 步骤1: 初始化获取 CSRF 和 umidToken
      const { csrf, umidToken } = await initLoginBefore();
      
      if (!csrf || !umidToken) {
        throw new Error("获取 CSRF 或 umidToken 失败");
      }

      // 步骤2: 调用 havanaone API 生成二维码（TSDK 第 200 行）
      const qrGenUrl = new URL(
        "https://login.taobao.com/havanaone/loginLegacy/qrCode/generate.do",
      );
      qrGenUrl.searchParams.set("bizEntrance", "taobao_pc");
      qrGenUrl.searchParams.set("bizName", "taobao");
      qrGenUrl.searchParams.set("hitRSA2048Gray", "true");
      qrGenUrl.searchParams.set("_csrf", csrf);
      qrGenUrl.searchParams.set("umidToken", umidToken);
      qrGenUrl.searchParams.set("lang", "zh_CN");
      qrGenUrl.searchParams.set("returnUrl", "https://www.taobao.com/");
      qrGenUrl.searchParams.set("umidTag", "NOT_INIT");

      console.log(`[QR] 请求 URL: ${qrGenUrl.toString()}`);

      const response = await fetch(qrGenUrl.toString(), {
        method: "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Referer: "https://login.taobao.com/",
          Accept: "application/json, text/javascript, */*; q=0.01",
        },
      });

      if (!response.ok) {
        throw new Error(`淘宝 API 返回错误: ${response.status}`);
      }

      const resData: any = await response.json();
      console.log("[QR] 淘宝响应:", JSON.stringify(resData));

      // 解析响应（TSDK 第 204-207 行）
      const hasError = resData.hasError;
      if (hasError) {
        throw new Error(
          resData.content?.message || "生成二维码失败",
        );
      }

      const data = resData.content?.data;
      if (!data || !data.codeContent) {
        throw new Error("二维码数据不完整");
      }

      // 提取关键信息
      const t = data.t; // 时间戳参数
      const ck = data.ck; // 会话令牌
      const qrUrl = data.codeContent; // 二维码 URL
      
      // 生成会话ID
      const sessionId = `qr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // 保存会话信息到 KV
      await kv.set(
        `qr_session:${sessionId}`,
        JSON.stringify({
          t: t,
          ck: ck,
          csrf: csrf,
          umidToken: umidToken,
          qrCodeUrl: qrUrl,
          status: "waiting",
          createdAt: Date.now(),
          expiresAt: Date.now() + 300000, // 5分钟
        }),
      );

      console.log(
        `[QR] ✅ 二维码生成成功！会话ID: ${sessionId}, t: ${t}, ck: ${ck?.substring(0, 10)}...`,
      );

      return c.json({
        success: true,
        data: {
          qrCodeUrl: qrUrl,
          qrCodeId: sessionId,
          expireTime: Date.now() + 300000,
        },
      });
    } catch (error: any) {
      console.error("[QR] ❌ 生成二维码失败:", error);
      return c.json(
        {
          success: false,
          message: error.message || "生成二维码失败",
        },
        500,
      );
    }
  },
);

// 检查二维码扫描状态（完全基于 TSDK 第 304-332 行的 qrNewCheck2）
app.post(
  "/make-server-c6898dcb/auth/qrcode/check",
  async (c) => {
    try {
      const { qrCodeId } = await c.req.json();

      if (!qrCodeId) {
        return c.json(
          { success: false, message: "缺少 qrCodeId 参数" },
          400,
        );
      }

      console.log(`[QR] ========== 检查二维码状态: ${qrCodeId} ==========`);

      // 从 KV 获取会话信息
      const sessionData = await kv.get(`qr_session:${qrCodeId}`);

      if (!sessionData) {
        return c.json(
          { success: false, message: "会话已过期或不存在" },
          404,
        );
      }

      const session = JSON.parse(sessionData);

      // 检查是否过期
      if (Date.now() > session.expiresAt) {
        await kv.del(`qr_session:${qrCodeId}`);
        return c.json({
          success: true,
          data: { status: "expired" },
        });
      }

      // 调用 havanaone API 检查状态（TSDK 第 304 行）
      const checkUrl =
        "https://login.taobao.com/havanaone/loginLegacy/qrCode/query.do?bizEntrance=taobao_pc&bizName=taobao";

      const checkData = {
        t: session.t,
        ck: session.ck,
        ua: "",
        hitRSA2048Gray: true,
        bizEntrance: "taobao_pc",
        bizName: "taobao",
        renderRefer: "https://www.taobao.com/",
        _csrf: session.csrf,
        lang: "zh_CN",
        umidToken: session.umidToken,
        umidTag: "NOT_INIT",
        navLanguage: "zh-CN",
        navUserAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        navPlatform: "Win32",
        isIframe: "false",
        banThirdPartyCookie: "true",
        documentReferer: "https://www.taobao.com/",
        defaultView: "password",
        deviceId: "",
      };

      console.log(`[QR] 检查参数:`, JSON.stringify(checkData, null, 2));

      const response = await fetch(checkUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Referer: "https://login.taobao.com/",
          Accept: "application/json, text/javascript, */*; q=0.01",
        },
        body: new URLSearchParams(checkData as any).toString(),
      });

      if (!response.ok) {
        throw new Error(`淘宝 API 返回错误: ${response.status}`);
      }

      const resData: any = await response.json();
      console.log("[QR] 淘宝原始响应:", JSON.stringify(resData));

      const hasError = resData.hasError;
      if (hasError) {
        console.error("[QR] API 错误:", resData);
        throw new Error("检查状态失败");
      }

      const data = resData.content?.data;
      if (!data) {
        throw new Error("响应数据不完整");
      }

      // 解析状态（TSDK 第 215-231 行）
      const qrCodeStatus = data.qrCodeStatus;
      
      console.log(`[QR] 状态: qrCodeStatus = ${qrCodeStatus}`);

      // 判断状态（基于 TSDK 的枚举值）
      // 可能的值：'NEW', 'SCANED', 'CONFIRMED', 'EXPIRED' 等
      
      if (qrCodeStatus === "CONFIRMED" || qrCodeStatus === "已确认") {
        console.log(`[QR] ✅ 登录成功！开始提取 Cookie`);
        
        // 登录成功，访问异步 URL 获取 Cookie（TSDK 第 217-220 行）
        const asyncUrls = data.asyncUrls || [];
        const iframeRedirectUrl = data.iframeRedirectUrl;
        
        console.log(`[QR] asyncUrls:`, asyncUrls);
        console.log(`[QR] iframeRedirectUrl:`, iframeRedirectUrl);
        
        let cookieString = "";
        const cookieSet = new Set<string>();
        
        // 访问所有 asyncUrls
        for (const url of asyncUrls) {
          try {
            console.log(`[QR] 访问 asyncUrl: ${url}`);
            const asyncRes = await fetch(url, {
              method: "GET",
              redirect: "manual",
              headers: {
                "User-Agent":
                  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              },
            });
            
            const setCookies = asyncRes.headers.getSetCookie?.() || [];
            setCookies.forEach((cookie) => {
              const cookiePair = cookie.split(";")[0];
              cookieSet.add(cookiePair);
            });
          } catch (err) {
            console.error(`[QR] 访问 asyncUrl 失败:`, err);
          }
        }
        
        // 访问主重定向 URL
        if (iframeRedirectUrl) {
          try {
            console.log(`[QR] 访问 iframeRedirectUrl: ${iframeRedirectUrl}`);
            const mainRes = await fetch(iframeRedirectUrl, {
              method: "GET",
              redirect: "manual",
              headers: {
                "User-Agent":
                  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              },
            });
            
            const setCookies = mainRes.headers.getSetCookie?.() || [];
            setCookies.forEach((cookie) => {
              const cookiePair = cookie.split(";")[0];
              cookieSet.add(cookiePair);
            });
          } catch (err) {
            console.error(`[QR] 访问 iframeRedirectUrl 失败:`, err);
          }
        }
        
        cookieString = Array.from(cookieSet).join("; ");
        
        console.log(`[QR] ✅ Cookie 提取完成，长度: ${cookieString.length}`);
        console.log(`[QR] Cookie 预览: ${cookieString.substring(0, 200)}...`);
        
        // 更新会话状态
        session.status = "confirmed";
        session.cookie = cookieString;
        await kv.set(`qr_session:${qrCodeId}`, JSON.stringify(session));

        return c.json({
          success: true,
          data: {
            status: "confirmed",
            cookie: cookieString,
          },
        });
      } else if (qrCodeStatus === "SCANED" || qrCodeStatus === "已扫码") {
        console.log(`[QR] 📱 已扫码，等待确认`);
        
        session.status = "scanned";
        await kv.set(`qr_session:${qrCodeId}`, JSON.stringify(session));

        return c.json({
          success: true,
          data: { status: "scanned" },
        });
      } else if (qrCodeStatus === "EXPIRED" || qrCodeStatus === "已过期") {
        console.log(`[QR] ⏰ 二维码已过期`);
        
        await kv.del(`qr_session:${qrCodeId}`);

        return c.json({
          success: true,
          data: { status: "expired" },
        });
      } else {
        // 默认：等待扫码（NEW 或其他状态）
        console.log(`[QR] ⏳ 等待扫码 (状态: ${qrCodeStatus})`);

        return c.json({
          success: true,
          data: { status: "waiting" },
        });
      }
    } catch (error: any) {
      console.error("[QR] ❌ 检查二维码状态失败:", error);
      return c.json(
        {
          success: false,
          message: error.message || "检查状态失败",
        },
        500,
      );
    }
  },
);

Deno.serve(app.fetch);
