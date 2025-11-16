import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import * as playwright from "./playwright.tsx";
import { TmallGiftAPI } from "./tsdk.tsx";

const app = new Hono();

// ✅ 使用 TSDK 的 iPhone Mobile Safari User-Agent（关键！）
// 基于 TSDK/api/base.py 第 35-49 行
const USER_AGENT = "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1";

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
          "User-Agent": USER_AGENT,
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
        "User-Agent": USER_AGENT,
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
        // 提取 cookie 名称和值（去掉过间、path 等属性）
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
          expiresAt: Date.now() + 600000, // ✅ 修复：改为 10 分钟，给用户更充足的时间
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
          { success: false, message: "会话已过期或存在" },
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

      // ✅ 生成 deviceId（关键修复！）
      const deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      
      // ✅ 生成 ua_enc（浏览器指纹，关键修复！）
      const uaString = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

      const checkData = {
        t: session.t,
        ck: session.ck,
        ua: uaString, // ✅ 修复：填充真实 UA
        hitRSA2048Gray: true,
        bizEntrance: "taobao_pc",
        bizName: "taobao",
        renderRefer: "https://www.taobao.com/",
        _csrf: session.csrf,
        lang: "zh_CN",
        umidToken: session.umidToken,
        umidTag: "NOT_INIT",
        navLanguage: "zh-CN",
        navUserAgent: uaString, // ✅ 修复：使用一致的 UA
        navPlatform: "Win32",
        isIframe: "false",
        banThirdPartyCookie: "false", // ✅ 修复：改为 false 允许写入 Cookie
        documentReferer: "https://www.taobao.com/",
        defaultView: "password",
        deviceId: deviceId, // ✅ 修复：填充 deviceId
      };

      console.log(`[QR] 检查参数:`, JSON.stringify(checkData, null, 2));

      // ✅ 使用保存的 Cookie（关键！）
      const headers: Record<string, string> = {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": USER_AGENT,
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
        
        // ✅ 使用 TSDK 的 handleLoginSuccess 方法处理登录成功后的流程
        // 基于 TSDK h5.py 第 276-285 行
        const asyncUrls = data.asyncUrls || [];
        const iframeRedirectUrl = data.iframeRedirectUrl || data.redirectUrl;
        
        console.log(`[QR] asyncUrls 数量: ${asyncUrls.length}`);
        console.log(`[QR] asyncUrls 内容:`, asyncUrls);
        console.log(`[QR] iframeRedirectUrl:`, iframeRedirectUrl);
        
        try {
          // ✅ 创建 TSDK 客户端实例，使用当前会话的 Cookie
          const { TaobaoH5Client } = await import('./tsdk.tsx');
          const client = new TaobaoH5Client();
          
          console.log(`[QR] 🔧 创建 TSDK 客户端成功`);
          
          // ✅ 设置已有的 Cookie
          if (session.cookies) {
            client.setCookies(session.cookies);
            console.log(`[QR] 🔧 TSDK 客户端已加载现有 Cookie (${session.cookies.length} 字符)`);
            console.log(`[QR] 🔧 现有 Cookie 预览: ${session.cookies.substring(0, 150)}...`);
          } else {
            console.warn(`[QR] ⚠️ 会话中没有 Cookie！`);
          }
          
          // ✅ 调用 handleLoginSuccess 处理跳转链接和刷新 token
          console.log(`[QR] 🚀 开始调用 TSDK handleLoginSuccess...`);
          await client.handleLoginSuccess(asyncUrls, iframeRedirectUrl);
          console.log(`[QR] ✅ TSDK handleLoginSuccess 调用完成`);
          
          // ✅ 获取处理后的完整 Cookie
          const cookieString = client.getCookieString();
          console.log(`[QR] ✅ TSDK 登录成功处理完成，Cookie 长度: ${cookieString.length}`);
          console.log(`[QR] 📊 Cookie 字段数量: ${cookieString.split(';').length}`);
          console.log(`[QR] Cookie 预览: ${cookieString.substring(0, 200)}...`);
          
          // ✅ 验证 Cookie 必要字段
          const requiredFields = ['cookie2', '_tb_token_', '_m_h5_tk'];
          const missingFields = requiredFields.filter(field => !cookieString.includes(`${field}=`));
          
          if (missingFields.length > 0) {
            console.error(`[QR] ❌ Cookie 缺少必要字段: ${missingFields.join(', ')}`);
            console.error(`[QR] ❌ 这可能导致后续 API 调用失败！`);
            console.error(`[QR] ❌ 当前 Cookie 包含的字段:`, cookieString.split(';').map(c => c.split('=')[0].trim()).join(', '));
            
            // ⚠️ 尝试手动刷新 _m_h5_tk
            if (!cookieString.includes('_m_h5_tk=')) {
              console.log(`[QR] 🔧 尝试手动刷新 _m_h5_tk...`);
              try {
                await client.getUserSimple();
                const newCookieString = client.getCookieString();
                if (newCookieString.includes('_m_h5_tk=')) {
                  console.log(`[QR] ✅ 手动刷新 _m_h5_tk 成功！`);
                  // 更新 cookieString
                  const finalCookie = newCookieString;
                  console.log(`[QR] 最终 Cookie 长度: ${finalCookie.length}`);
                } else {
                  console.warn(`[QR] ⚠️ 手动刷新 _m_h5_tk 仍然失败`);
                }
              } catch (refreshError: any) {
                console.error(`[QR] ❌ 手动刷新 _m_h5_tk 失败:`, refreshError.message);
              }
            }
          } else {
            console.log(`[QR] ✅ Cookie 包含所有必要字段`);
          }
          
          // ✅ 提取用户名（从 Cookie 中）
          let username = "未知用户";
          
          // 方法1: 尝试从 _nk_ 字段提取（URL 编码的用户名）
          const nkMatch = cookieString.match(/_nk_=(.*?)($|;)/);
          if (nkMatch) {
            try {
              username = decodeURIComponent(nkMatch[1]);
              console.log(`[QR] 从 _nk_ 提取用户名: ${username}`);
            } catch (err) {
              console.error(`[QR] 解码 _nk_ 失败:`, err);
            }
          }
          
          // 方法2: 尝试从 tracknick 字段提取
          if (username === "未知用户") {
            const tracknickMatch = cookieString.match(/tracknick=(.*?)($|;)/);
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
            const lgcMatch = cookieString.match(/lgc=(.*?)($|;)/);
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
          
          // ✅ 更新会话状态
          session.status = "confirmed";
          session.cookie = cookieString;
          session.username = username;
          await kv.set(`qr_session:${qrCodeId}`, JSON.stringify(session));

          return c.json({
            success: true,
            data: {
              status: "confirmed",
              cookie: cookieString,
              username: username,
            },
          });
          
        } catch (tsdkError: any) {
          console.error(`[QR] ❌ TSDK 登录成功处理失败:`, tsdkError.message);
          console.warn(`[QR] ⚠️ 回退到传统方式处理...`);
          
          // ✅ 如果 TSDK 处理失败，回退到传统方式
          let cookieString = "";
          const cookieMap = new Map<string, string>();
          
          // 传统方式：从 asyncUrls 提取 Cookie
          console.log(`[QR] 📋 使用传统方式从 asyncUrls 解析 Cookie...`);
          for (const url of asyncUrls) {
            try {
              const urlObj = new URL(url);
              const cookieFields = [
                'cookie1', 'cookie2', 'cookie17', 
                '_tb_token_', 't', 'sg', 'sgcookie',
                '_nk_', 'tracknick', 'lgc', 'unb',
                'uc1', 'uc3', 'uc4', 'lid', '_l_g_',
                'csg', 'dnk', 'srt', 'wk_cookie2',
                'existShop', 'cookie14', 'cookie15', 'cookie16', 'cookie21',
                '_cc_', '_m_h5_tk', '_m_h5_tk_enc', 'x5sec',
              ];
              
              for (const field of cookieFields) {
                const value = urlObj.searchParams.get(field);
                if (value) {
                  const decodedValue = decodeURIComponent(value);
                  cookieMap.set(field, decodedValue);
                }
              }
            } catch (err) {
              console.error(`[QR] 解析 asyncUrl 失败:`, err);
            }
          }
          
          cookieString = Array.from(cookieMap.entries())
            .map(([name, value]) => `${name}=${value}`)
            .join('; ');
          
          // 提取用户名
          let username = "未知用户";
          const nkMatch = cookieString.match(/_nk_=(.*?)($|;)/);
          if (nkMatch) {
            try {
              username = decodeURIComponent(nkMatch[1]);
            } catch (err) {
              console.error(`[QR] 解码用户名失败:`, err);
            }
          }
          
          console.log(`[QR] 🏷️ 传统方式提取用户名: ${username}`);
          
          session.status = "confirmed";
          session.cookie = cookieString;
          session.username = username;
          await kv.set(`qr_session:${qrCodeId}`, JSON.stringify(session));

          return c.json({
            success: true,
            data: {
              status: "confirmed",
              cookie: cookieString,
              username: username,
            },
          });
        }
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

// =====================================================
// 短信登录 API - 基于 TSDK 的完整实现
// =====================================================

// 发送短信验证码
app.post(
  "/make-server-c6898dcb/auth/sms/send",
  async (c) => {
    try {
      const { phone } = await c.req.json();
      
      if (!phone || typeof phone !== 'string') {
        return c.json({
          success: false,
          message: '手机号参数缺失或无效'
        }, 400);
      }
      
      // 简单验证手机号格式（中国大陆手机号）
      if (!/^1[3-9]\d{9}$/.test(phone)) {
        return c.json({
          success: false,
          message: '手机号格式不正确'
        }, 400);
      }
      
      console.log(`[SMS] ========== 发送短信验证码: ${phone} ==========`);
      
      // 使用 TSDK 客户端
      const { TaobaoH5Client } = await import('./tsdk.tsx');
      const client = new TaobaoH5Client();
      
      // 初始化 Cookie
      await client.initCookie();
      
      // 发送短信
      const smsResult = await client.sendSms(phone);
      
      // 生成会话ID（用于后续登录）
      const sessionId = `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // 保存会话信息到 KV
      await kv.set(
        `sms_session:${sessionId}`,
        JSON.stringify({
          phone: phone,
          smsToken: smsResult.smsToken,
          cookies: client.getCookieString(), // 保存 Cookie 用于后续登录
          createdAt: Date.now(),
          expiresAt: Date.now() + 300000, // 5分钟过期
        })
      );
      
      console.log(`[SMS] ✅ 短信发送成功！会话ID: ${sessionId}`);
      
      return c.json({
        success: true,
        data: {
          sessionId: sessionId,
          expireTime: Date.now() + 300000,
        },
        message: '验证码已发送，请查收短信'
      });
      
    } catch (error: any) {
      console.error('[SMS] ❌ 发送短信失败:', error);
      return c.json({
        success: false,
        message: error.message || '发送短信失败'
      }, 500);
    }
  }
);

// 短信登录
app.post(
  "/make-server-c6898dcb/auth/sms/login",
  async (c) => {
    try {
      const { sessionId, smsCode } = await c.req.json();
      
      if (!sessionId || !smsCode) {
        return c.json({
          success: false,
          message: '会话ID或验证码缺失'
        }, 400);
      }
      
      console.log(`[SMS] ========== 短信登录: sessionId=${sessionId} ==========`);
      
      // 从 KV 获取会话信息
      const sessionData = await kv.get(`sms_session:${sessionId}`);
      
      if (!sessionData) {
        return c.json({
          success: false,
          message: '会话已过期或存在'
        }, 404);
      }
      
      const session = JSON.parse(sessionData);
      
      // 检查是否过期
      if (Date.now() > session.expiresAt) {
        await kv.del(`sms_session:${sessionId}`);
        return c.json({
          success: false,
          message: '会话已过期，请重新发送验证码'
        }, 400);
      }
      
      // 使用 TSDK 客户端登录
      const { TaobaoH5Client } = await import('./tsdk.tsx');
      const client = new TaobaoH5Client();
      
      // 恢复之前的 Cookie
      client.setCookies(session.cookies);
      
      // 短信登录
      await client.loginSms(
        session.phone,
        smsCode,
        session.smsToken
      );
      
      // 获取最终 Cookie
      const cookieString = client.getCookieString();
      
      // 验证 Cookie
      const requiredFields = ['cookie2', '_tb_token_', '_m_h5_tk'];
      const missingFields = requiredFields.filter(field => !cookieString.includes(`${field}=`));
      
      if (missingFields.length > 0) {
        console.error(`[SMS] ❌ Cookie 缺少必要字段: ${missingFields.join(', ')}`);
        throw new Error(`登录失败：Cookie 不完整（缺少 ${missingFields.join(', ')}）`);
      }
      
      // 提取用户名
      let username = "未知用户";
      
      const nkMatch = cookieString.match(/_nk_=(.*?)($|;)/);
      if (nkMatch) {
        try {
          username = decodeURIComponent(nkMatch[1]);
        } catch (err) {
          console.error(`[SMS] 解码 _nk_ 失败:`, err);
        }
      }
      
      // 如果没有从 _nk_ 提取到，尝试从 tracknick
      if (username === "未知用户") {
        const tracknickMatch = cookieString.match(/tracknick=(.*?)($|;)/);
        if (tracknickMatch) {
          try {
            username = decodeURIComponent(tracknickMatch[1]);
          } catch (err) {
            console.error(`[SMS] 解码 tracknick 失败:`, err);
          }
        }
      }
      
      // 如果还是没有，尝试从 lgc
      if (username === "未知用户") {
        const lgcMatch = cookieString.match(/lgc=(.*?)($|;)/);
        if (lgcMatch) {
          try {
            username = decodeURIComponent(lgcMatch[1]);
          } catch (err) {
            console.error(`[SMS] 解码 lgc 失败:`, err);
          }
        }
      }
      
      console.log(`[SMS] 🏷️ 提取到用户名: ${username}`);
      console.log(`[SMS] ✅ 短信登录成功，Cookie 长度: ${cookieString.length}`);
      
      // 清理会话
      await kv.del(`sms_session:${sessionId}`);
      
      return c.json({
        success: true,
        data: {
          cookie: cookieString,
          username: username,
        },
        message: '登录成功'
      });
      
    } catch (error: any) {
      console.error('[SMS] ❌ 短信登录失败:', error);
      return c.json({
        success: false,
        message: error.message || '短信登录失败'
      }, 500);
    }
  }
);

// =====================================================
// Playwright 扫码登录 API（使用外部浏览器服务）
// =====================================================

// 使用 Playwright 生成二维码
app.post(
  "/make-server-c6898dcb/auth/qrcode/generate-playwright",
  async (c) => {
    try {
      console.log("[Playwright] ========== 开始生成二维码 ==========");

      const result = await playwright.generateQRCodeWithPlaywright();

      if (!result.success) {
        throw new Error("Playwright 服务返回失败");
      }

      // 生成本地会话ID（用于前端轮询）
      const localSessionId = `pw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // 保存 Playwright 会话信息到 KV
      await kv.set(
        `pw_session:${localSessionId}`,
        JSON.stringify({
          playwrightSessionId: result.sessionId,
          qrCodeUrl: result.qrCodeUrl,
          cookies: result.cookies,
          status: "waiting",
          createdAt: Date.now(),
          expiresAt: Date.now() + 300000, // 5分钟
        }),
      );

      console.log(
        `[Playwright] ✅ 二维码生成成功！本地会话ID: ${localSessionId}`,
      );

      return c.json({
        success: true,
        data: {
          qrCodeUrl: result.qrCodeUrl,
          qrCodeId: localSessionId,
          expireTime: Date.now() + 300000,
        },
      });
    } catch (error: any) {
      console.error("[Playwright] ❌ 生成二维码失败:", error);
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

// 使用 Playwright 检查二维码状态
app.post(
  "/make-server-c6898dcb/auth/qrcode/check-playwright",
  async (c) => {
    try {
      const { qrCodeId } = await c.req.json();

      if (!qrCodeId) {
        return c.json(
          { success: false, message: "缺少 qrCodeId 参数" },
          400,
        );
      }

      console.log(
        `[Playwright] ========== 检查二维码状态: ${qrCodeId} ==========`,
      );

      // 从 KV 获取会话信息
      const sessionData = await kv.get(`pw_session:${qrCodeId}`);

      if (!sessionData) {
        return c.json(
          { success: false, message: "会话已过期或存在" },
          404,
        );
      }

      const session = JSON.parse(sessionData);

      // 检查是否过期
      if (Date.now() > session.expiresAt) {
        await kv.del(`pw_session:${qrCodeId}`);
        return c.json({
          success: true,
          data: { status: "expired" },
        });
      }

      // 如果已经确认过了，直接返回保存的结果
      if (session.status === "confirmed" && session.cookie) {
        return c.json({
          success: true,
          data: {
            status: "confirmed",
            cookie: session.cookie,
            username: session.username,
          },
        });
      }

      // ⚠️ 注意：这里我们需要先调用淘宝 API 检查状态
      // 只有在状态为 CONFIRMED 时，才调用 Playwright 服务
      // 这样可以减少 Playwright 服务的调用次数

      // 使用原有的检查逻辑
      const checkUrl =
        "https://login.taobao.com/havanaone/loginLegacy/qrCode/query.do?bizEntrance=taobao_pc&bizName=taobao";

      const deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      const uaString =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

      // 从 session 中提取必要的参数（需要先保存）
      // 这里简化处理，直接返回 waiting 状态
      // 实际生产环境需要完整实现

      // 调用 Playwright 服务检查（这里需要传入 checkUrl）
      // 由于我们需要知道淘宝的 redirectUrl，所以需要先调用淘宝 API
      // 这里简化实现，假设前端会多次轮询

      return c.json({
        success: true,
        data: { status: "waiting" },
      });
    } catch (error: any) {
      console.error("[Playwright] ❌ 检查失败:", error);
      return c.json(
        {
          success: false,
          message: error.message || "检查失败",
        },
        500,
      );
    }
  },
);

// 检查 Playwright 服务健康状态
app.get("/make-server-c6898dcb/playwright/health", async (c) => {
  try {
    const health = await playwright.checkPlaywrightHealth();
    return c.json(health);
  } catch (error: any) {
    return c.json(
      {
        healthy: false,
        message: error.message || "检查失败",
      },
      500,
    );
  }
});

// =====================================================
// 礼品 API - 获取红包列表
// =====================================================

app.post("/make-server-c6898dcb/gifts/list", async (c) => {
  try {
    const { cookie } = await c.req.json();
    
    if (!cookie || typeof cookie !== 'string') {
      return c.json({
        success: false,
        message: 'Cookie 参数缺失或无效'
      }, 400);
    }

    console.log('[Gifts API] 开始获取红包列表和余额...');
    console.log('[Gifts API] Cookie 长度:', cookie.length);
    console.log('[Gifts API] Cookie 前100字符:', cookie.substring(0, 100));
    
    // 检查必要的 Cookie 字段
    const hasRequiredFields = ['cookie2', '_m_h5_tk', '_tb_token_'].every(field => 
      cookie.includes(field)
    );
    console.log('[Gifts API] 包含必要字段:', hasRequiredFields);

    // 使用 TSDK
    const api = new TmallGiftAPI(cookie);
    
    // 获取完整页面数据（包括余额和红包）
    const { balance, availableAmount, redPackets } = await api.getFullPageData();

    console.log(`[Gifts API] ✅ 获取成功！余额: ${balance}, 可用: ${availableAmount}, 红包: ${redPackets.length} 个`);

    return c.json({
      success: true,
      data: {
        gifts: redPackets,
        balance: balance,
        availableAmount: availableAmount,
        total: redPackets.length,
        available: redPackets.length
      }
    });

  } catch (error: any) {
    console.error('[Gifts API] ❌ 获取红包列表失败 - 错误类型:', error.constructor.name);
    console.error('[Gifts API] ❌ 错误消息:', error.message);
    console.error('[Gifts API] ❌ 错误堆栈:', error.stack);
    
    // 识别 Session 过期错误
    const errorMsg = error.message || '获取红包列表失败';
    const isSessionExpired = errorMsg.includes('Session过期') || 
                             errorMsg.includes('SESSION_EXPIRED') ||
                             errorMsg.includes('Token已过期') ||
                             errorMsg.includes('Token为空') ||
                             errorMsg.includes('会话已过期') ||
                             errorMsg.includes('请重新登录');
    
    console.log('[Gifts API] Session 过期?', isSessionExpired);
    
    return c.json({
      success: false,
      message: isSessionExpired ? '会话已过期，请重新登录' : errorMsg
    }, isSessionExpired ? 401 : 500);  // Session 过期返回 401，其他错误返回 500
  }
});

Deno.serve(app.fetch);