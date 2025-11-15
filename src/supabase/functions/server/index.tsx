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

// 辅助函数：初始化登录前准备（获取 CSRF Token 和 umidToken）
async function initLoginBefore() {
  try {
    console.log("[QR] 开始初始化登录前准备...");

    const res = await fetch(
      "https://login.taobao.com/member/login.jhtml?redirectURL=https://www.taobao.com/",
      {
        method: "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Referer: "https://www.taobao.com/",
        },
      },
    );

    console.log(`[QR] 初始化请求状态: ${res.status}`);

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[QR] 初始化失败: HTTP ${res.status}`, errorText.substring(0, 500));
      throw new Error(`初始化请求失败: HTTP ${res.status}`);
    }

    // ✅ 提取初始 Cookie（关键！）
    const setCookieHeaders = res.headers.getSetCookie?.() || [];
    const cookies: string[] = [];
    
    for (const setCookie of setCookieHeaders) {
      const cookiePair = setCookie.split(';')[0];
      if (cookiePair) {
        cookies.push(cookiePair.trim());
      }
    }
    
    const initialCookies = cookies.join('; ');
    console.log(`[QR] 🍪 初始 Cookie 提取: ${cookies.length} 个，预览: ${initialCookies.substring(0, 100)}...`);

    const html = await res.text();
    console.log(`[QR] 获取到 HTML，长度: ${html.length}`);
    
    // 初始化返回值
    let csrf = "";
    let umidToken = "";
    
    // 方法1: 尝试从 viewData 提取
    const viewDataMatch = html.match(/viewData\s*=\s*(\{.*?\});/s);
    if (viewDataMatch) {
      try {
        const viewDataStr = viewDataMatch[1];
        const viewData = JSON.parse(viewDataStr);
        console.log(`[QR] 找到 viewData，键名:`, Object.keys(viewData));
        
        const loginForm = viewData.loginFormData || {};
        console.log(`[QR] loginFormData 内容:`, loginForm);
        
        // 提取 csrf（可能在 loginFormData 中）
        if (loginForm._csrf) {
          csrf = loginForm._csrf;
          console.log(`[QR] 从 loginFormData 提取到 csrf: ${csrf.substring(0, 10)}...`);
        }
        
        // 尝试从 viewData 的其他位置提取 umidToken
        if (viewData.umidToken) {
          umidToken = viewData.umidToken;
          console.log(`[QR] 从 viewData 根级别提取到 umidToken: ${umidToken.substring(0, 10)}...`);
        } else if (loginForm.umidToken) {
          umidToken = loginForm.umidToken;
          console.log(`[QR] 从 loginFormData 提取到 umidToken: ${umidToken.substring(0, 10)}...`);
        }
      } catch (err) {
        console.error("[QR] 解析 viewData 失败:", err);
      }
    } else {
      console.log("[QR] 未找到 viewData");
    }
    
    // 方法2: 如果还没找到，使用正则直接提取
    if (!csrf) {
      const csrfMatch = html.match(/"_csrf"\s*:\s*"([^"]+)"/);
      if (csrfMatch) {
        csrf = csrfMatch[1];
        console.log(`[QR] 通过正则提取到 csrf: ${csrf.substring(0, 10)}...`);
      }
    }
    
    if (!umidToken) {
      const umidTokenMatch = html.match(/"umidToken"\s*:\s*"([^"]+)"/);
      if (umidTokenMatch) {
        umidToken = umidTokenMatch[1];
        console.log(`[QR] 通过正则提取到 umidToken: ${umidToken.substring(0, 10)}...`);
      }
    }
    
    // 方法3: 尝试生成一个 umidToken（作为最后的备选）
    if (!umidToken) {
      // 淘宝的 umidToken 格式：C + 时间戳 + 11位随机数 + 时间戳 + 3位随机数
      const now = Date.now();
      const random11 = Math.random().toString().substring(2, 13).padEnd(11, '0');
      const random3 = Math.random().toString().substring(2, 5).padEnd(3, '0');
      umidToken = `C${now}${random11}${now}${random3}`;
      console.log(`[QR] 生成备用 umidToken: ${umidToken.substring(0, 20)}...`);
    }
    
    // 验证结果
    if (!csrf) {
      console.error("[QR] 无法提取 CSRF Token");
      console.error("[QR] HTML 预览（前 2000 字符）:", html.substring(0, 2000));
      throw new Error("无法从页面提取 CSRF Token");
    }
    
    if (!umidToken) {
      console.error("[QR] 无法提取或生成 umidToken");
      throw new Error("无法提取或生成 umidToken");
    }
    
    console.log(`[QR] ✅ 提取成功 - csrf: ${csrf.substring(0, 10)}..., umidToken: ${umidToken.substring(0, 20)}...`);
    
    return {
      csrf: csrf,
      umidToken: umidToken,
      initialCookies: initialCookies,
    };
  } catch (err: any) {
    console.error("[QR] initLoginBefore 异常:", err.message);
    throw err;
  }
}

// 生成淘宝登录二维码（完全基于 TSDK 第 195-213 行）
app.post(
  "/make-server-c6898dcb/auth/qrcode/generate",
  async (c) => {
    try {
      console.log("[QR] ========== 开始生成二维码 ==========");

      // 步骤1: 初始化获取 CSRF 和 umidToken
      const { csrf, umidToken, initialCookies } = await initLoginBefore();
      
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

      // ✅ 携带初始 Cookie 发送请求
      const genHeaders: Record<string, string> = {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: "https://login.taobao.com/",
        Accept: "application/json, text/javascript, */*; q=0.01",
      };
      
      if (initialCookies) {
        genHeaders["Cookie"] = initialCookies;
        console.log(`[QR] 🍪 使用初始 Cookie 生成二维码: ${initialCookies.substring(0, 100)}...`);
      }

      const response = await fetch(qrGenUrl.toString(), {
        method: "GET",
        headers: genHeaders,
      });

      if (!response.ok) {
        throw new Error(`淘宝 API 返回错误: ${response.status}`);
      }

      // ✅ 提取 Set-Cookie 响应头（关键！）
      const setCookieHeaders = response.headers.getSetCookie?.() || [];
      const cookies: string[] = [];
      
      for (const setCookie of setCookieHeaders) {
        // 提取 cookie 名称和值（去掉过期时间、path 等属性）
        const cookiePair = setCookie.split(';')[0];
        if (cookiePair) {
          cookies.push(cookiePair.trim());
        }
      }
      
      const newCookieString = cookies.join('; ');
      console.log(`[QR] 🍪 二维码生成请求返回 ${cookies.length} 个 Cookie: ${newCookieString.substring(0, 100)}...`);

      // ✅ 合并初始 Cookie 和新 Cookie
      const allCookies = new Set<string>();
      
      // 添加初始 Cookie
      if (initialCookies) {
        initialCookies.split(';').forEach(cookie => {
          const trimmed = cookie.trim();
          if (trimmed) {
            allCookies.add(trimmed);
          }
        });
      }
      
      // 添加新 Cookie（会覆盖同名的旧 Cookie）
      if (newCookieString) {
        newCookieString.split(';').forEach(cookie => {
          const trimmed = cookie.trim();
          if (trimmed) {
            // 提取 cookie 名称
            const cookieName = trimmed.split('=')[0];
            // 删除旧的同名 cookie
            allCookies.forEach(existingCookie => {
              if (existingCookie.startsWith(cookieName + '=')) {
                allCookies.delete(existingCookie);
              }
            });
            // 添加新 cookie
            allCookies.add(trimmed);
          }
        });
      }
      
      const finalCookieString = Array.from(allCookies).join('; ');
      console.log(`[QR] 🍪 合并后的 Cookie (${allCookies.size} 个): ${finalCookieString.substring(0, 150)}...`);

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

      // ✅ 保存会话信息到 KV（包含 Cookie）
      await kv.set(
        `qr_session:${sessionId}`,
        JSON.stringify({
          t: t,
          ck: ck,
          csrf: csrf,
          umidToken: umidToken,
          cookies: finalCookieString, // ← 保存 Cookie
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

      // ✅ 使用保存的 Cookie（关键！）
      const headers: Record<string, string> = {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: "https://login.taobao.com/",
        Accept: "application/json, text/javascript, */*; q=0.01",
      };
      
      // 添加 Cookie 请求头
      if (session.cookies) {
        headers["Cookie"] = session.cookies;
        console.log(`[QR] 🍪 使用 Cookie: ${session.cookies.substring(0, 100)}...`);
      } else {
        console.log(`[QR] ⚠️ 警告：没有可用的 Cookie`);
      }

      const response = await fetch(checkUrl, {
        method: "POST",
        headers: headers,
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
        
        // 登录成功，访问跳转 URL 获取 Cookie（TSDK 第 217-220 行）
        // ✅ 修复：淘宝返回的是 redirectUrl 而不是 iframeRedirectUrl
        const asyncUrls = data.asyncUrls || [];
        const redirectUrl = data.redirectUrl || data.iframeRedirectUrl; // ← 优先使用 redirectUrl
        
        console.log(`[QR] asyncUrls:`, asyncUrls);
        console.log(`[QR] redirectUrl:`, redirectUrl);
        
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
        if (redirectUrl) {
          try {
            console.log(`[QR] 🔗 开始跟随重定向链，起始 URL: ${redirectUrl}`);
            
            // ✅ 手动跟随重定向链（最多 5 次）
            let currentUrl = redirectUrl;
            let redirectCount = 0;
            const maxRedirects = 5;
            
            while (redirectCount <= maxRedirects) {
              console.log(`[QR] 🌐 [${redirectCount}] 访问: ${currentUrl.substring(0, 100)}...`);
              
              const res = await fetch(currentUrl, {
                method: "GET",
                redirect: "manual", // ← 手动控制重定向
                headers: {
                  "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
                  "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
                  "Accept-Encoding": "gzip, deflate, br",
                  "Referer": "https://login.taobao.com/",
                  "Connection": "keep-alive",
                  "Upgrade-Insecure-Requests": "1",
                  "Sec-Fetch-Dest": "document",
                  "Sec-Fetch-Mode": "navigate",
                  "Sec-Fetch-Site": "same-site",
                  "Sec-Fetch-User": "?1",
                  "Cache-Control": "max-age=0",
                  "Cookie": session.cookies, // ← 携带会话 Cookie
                },
              });
              
              console.log(`[QR] 📊 [${redirectCount}] 状态码: ${res.status}`);
              
              // 提取 Set-Cookie 响应头
              const setCookies = res.headers.getSetCookie?.() || [];
              console.log(`[QR] 🍪 [${redirectCount}] 获取到 ${setCookies.length} 个 Set-Cookie 响应头`);
              
              if (setCookies.length > 0) {
                setCookies.forEach((cookie) => {
                  const cookiePair = cookie.split(";")[0];
                  const cookieName = cookiePair.split('=')[0];
                  console.log(`[QR] ➕ [${redirectCount}] 添加 Cookie: ${cookieName}=${cookiePair.substring(cookieName.length + 1, Math.min(cookiePair.length, cookieName.length + 31))}...`);
                  cookieSet.add(cookiePair);
                });
              }
              
              // 检查是否有 HTTP 重定向 (3xx)
              if (res.status >= 300 && res.status < 400) {
                const location = res.headers.get("Location");
                if (location) {
                  // 处理相对 URL
                  if (location.startsWith('/')) {
                    const urlObj = new URL(currentUrl);
                    currentUrl = `${urlObj.protocol}//${urlObj.host}${location}`;
                  } else if (!location.startsWith('http')) {
                    const urlObj = new URL(currentUrl);
                    const basePath = urlObj.pathname.substring(0, urlObj.pathname.lastIndexOf('/') + 1);
                    currentUrl = `${urlObj.protocol}//${urlObj.host}${basePath}${location}`;
                  } else {
                    currentUrl = location;
                  }
                  
                  console.log(`[QR] 🔄 [${redirectCount}] HTTP 重定向到: ${currentUrl.substring(0, 100)}...`);
                  redirectCount++;
                  
                  // 更新 session.cookies，将新获取的 Cookie 合并
                  const currentCookies = Array.from(cookieSet).join('; ');
                  session.cookies = currentCookies;
                  
                  continue;
                }
              }
              
              // ✅ 检查是否是 200 但有 JavaScript/Meta 重定向
              if (res.status === 200) {
                try {
                  const html = await res.text();
                  console.log(`[QR] 📄 [${redirectCount}] 获取到 HTML，长度: ${html.length}`);
                  
                  // 方法1: 查找 JavaScript 跳转
                  // window.location.href = "..."
                  // window.location = "..."
                  // location.href = "..."
                  const jsRedirectMatch = html.match(/(?:window\.)?location(?:\.href)?\s*=\s*["']([^"']+)["']/i);
                  if (jsRedirectMatch) {
                    let nextUrl = jsRedirectMatch[1];
                    
                    // 处理相对 URL
                    if (nextUrl.startsWith('/')) {
                      const urlObj = new URL(currentUrl);
                      nextUrl = `${urlObj.protocol}//${urlObj.host}${nextUrl}`;
                    } else if (!nextUrl.startsWith('http')) {
                      const urlObj = new URL(currentUrl);
                      const basePath = urlObj.pathname.substring(0, urlObj.pathname.lastIndexOf('/') + 1);
                      nextUrl = `${urlObj.protocol}//${urlObj.host}${basePath}${nextUrl}`;
                    }
                    
                    console.log(`[QR] 🔄 [${redirectCount}] JS 重定向到: ${nextUrl.substring(0, 100)}...`);
                    currentUrl = nextUrl;
                    redirectCount++;
                    
                    // 更新 session.cookies
                    const currentCookies = Array.from(cookieSet).join('; ');
                    session.cookies = currentCookies;
                    
                    continue;
                  }
                  
                  // 方法2: 查找 Meta 标签重定向
                  // <meta http-equiv="refresh" content="0;url=...">
                  const metaRedirectMatch = html.match(/<meta[^>]+http-equiv=["']refresh["'][^>]+content=["'][^;]+;\s*url=([^"']+)["']/i);
                  if (metaRedirectMatch) {
                    let nextUrl = metaRedirectMatch[1];
                    
                    // 处理相对 URL
                    if (nextUrl.startsWith('/')) {
                      const urlObj = new URL(currentUrl);
                      nextUrl = `${urlObj.protocol}//${urlObj.host}${nextUrl}`;
                    } else if (!nextUrl.startsWith('http')) {
                      const urlObj = new URL(currentUrl);
                      const basePath = urlObj.pathname.substring(0, urlObj.pathname.lastIndexOf('/') + 1);
                      nextUrl = `${urlObj.protocol}//${urlObj.host}${basePath}${nextUrl}`;
                    }
                    
                    console.log(`[QR] 🔄 [${redirectCount}] Meta 重定向到: ${nextUrl.substring(0, 100)}...`);
                    currentUrl = nextUrl;
                    redirectCount++;
                    
                    // 更新 session.cookies
                    const currentCookies = Array.from(cookieSet).join('; ');
                    session.cookies = currentCookies;
                    
                    continue;
                  }
                  
                  // 方法3: 检查是否是淘宝的验证页面
                  if (currentUrl.includes('normal_validate.htm') || currentUrl.includes('login_check.htm') || currentUrl.includes('verify_modes.htm') || currentUrl.includes('identity_verify.htm')) {
                    console.log(`[QR] 🔍 [${redirectCount}] 检测到验证页面: ${currentUrl.split('?')[0]}`);
                    
                    // 查找页面中的 URL（可能在 data-url、href 等属性中）
                    const urlMatch = html.match(/(?:data-url|href)=[\"']([^\"']+taobao\\.com[^\"']*)[\"']/i);
                    if (urlMatch) {
                      let nextUrl = urlMatch[1];
                      
                      // HTML 解码
                      nextUrl = nextUrl.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '\"');
                      
                      // 处理相对 URL
                      if (nextUrl.startsWith('/')) {
                        const urlObj = new URL(currentUrl);
                        nextUrl = `${urlObj.protocol}//${urlObj.host}${nextUrl}`;
                      } else if (!nextUrl.startsWith('http')) {
                        const urlObj = new URL(currentUrl);
                        const basePath = urlObj.pathname.substring(0, urlObj.pathname.lastIndexOf('/') + 1);
                        nextUrl = `${urlObj.protocol}//${urlObj.host}${basePath}${nextUrl}`;
                      }
                      
                      console.log(`[QR] 🔄 [${redirectCount}] 从页面提取到 URL: ${nextUrl.substring(0, 100)}...`);
                      currentUrl = nextUrl;
                      redirectCount++;
                      
                      // 更新 session.cookies
                      const currentCookies = Array.from(cookieSet).join('; ');
                      session.cookies = currentCookies;
                      
                      continue;
                    }
                    
                    console.log(`[QR] ⚠️ [${redirectCount}] 无法从验证页面提取跳转 URL`);
                    console.log(`[QR] 📋 HTML 预览（前 1000 字符）: ${html.substring(0, 1000)}`);
                  }
                  
                  // 没有找到任何重定向，到达最终页面
                  console.log(`[QR] ✅ [${redirectCount}] 到达最终页面，状态码: ${res.status}`);
                } catch (err) {
                  console.error(`[QR] ❌ [${redirectCount}] 解析页面失败:`, err);
                  console.log(`[QR] ✅ [${redirectCount}] 到达最终页面，状态码: ${res.status}`);
                  break;
                }
              }
              
              // 其他状态码，停止
              console.log(`[QR] ✅ [${redirectCount}] 到达最终页面，状态码: ${res.status}`);
              break;
            }
            
            if (redirectCount > maxRedirects) {
              console.log(`[QR] ⚠️ 重定向次数超过限制 (${maxRedirects})，停止跟随`);
            }
            
            console.log(`[QR] 🏁 重定向链结束，共跟随 ${redirectCount} 次重定向`);
          } catch (err) {
            console.error(`[QR] ❌ 访问 redirectUrl 失败:`, err);
          }
        }
        
        cookieString = Array.from(cookieSet).join("; ");
        
        console.log(`[QR] ✅ Cookie 提取完成，长度: ${cookieString.length}`);
        console.log(`[QR] Cookie 预览: ${cookieString.substring(0, 200)}...`);
        
        // ✅ 提取用户名（从 Cookie 中）
        let username = "未知用户";
        
        // 方法1: 尝试从 _nk_ 字段提取（URL 编码的用户名）
        const nkMatch = cookieString.match(/_nk_=([^;]+)/);
        if (nkMatch) {
          try {
            username = decodeURIComponent(nkMatch[1]);
            console.log(`[QR] 从 _nk_ 提取用名: ${username}`);
          } catch (err) {
            console.error(`[QR] 解码 _nk_ 失败:`, err);
          }
        }
        
        // 方法2: 尝试从 tracknick 字段提取
        if (username === "未知用户") {
          const tracknickMatch = cookieString.match(/tracknick=([^;]+)/);
          if (tracknickMatch) {
            try {
              username = decodeURIComponent(tracknickMatch[1]);
              console.log(`[QR] 从 tracknick 提取用户名: ${username}`);
            } catch (err) {
              console.error(`[QR] 解码 tracknick 失败:`, err);
            }
          }
        }
        
        // 方法3: 尝试从 lgc 字段提取（登录账号）
        if (username === "未知用户") {
          const lgcMatch = cookieString.match(/lgc=([^;]+)/);
          if (lgcMatch) {
            try {
              username = decodeURIComponent(lgcMatch[1]);
              console.log(`[QR] 从 lgc 提取用户名: ${username}`);
            } catch (err) {
              console.error(`[QR] 解码 lgc 失败:`, err);
            }
          }
        }
        
        console.log(`[QR] 🏷️ 最终用户名: ${username}`);
        
        // 更新会话状态
        session.status = "confirmed";
        session.cookie = cookieString;
        session.username = username; // ← 保存用户名
        await kv.set(`qr_session:${qrCodeId}`, JSON.stringify(session));

        return c.json({
          success: true,
          data: {
            status: "confirmed",
            cookie: cookieString,
            username: username, // ← 返回用户名
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