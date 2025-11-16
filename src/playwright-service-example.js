// ⚠️ 这是示例代码，请复制到您的本地项目中
// 文件路径：taobao-playwright-service/server.js

import express from 'express';
import cors from 'cors';
import { chromium } from 'playwright';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY || 'your-secret-api-key';

// 中间件
app.use(cors());
app.use(express.json());

// API Key 验证中间件
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== API_KEY) {
    return res.status(401).json({ success: false, message: '未授权访问' });
  }
  next();
};

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'taobao-playwright', version: '1.0.0' });
});

// 生成二维码
app.post('/qrcode/generate', authenticateApiKey, async (req, res) => {
  let browser = null;
  
  try {
    console.log('[Playwright] 开始生成二维码...');
    
    // 启动浏览器
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });
    
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 720 },
      locale: 'zh-CN',
    });
    
    const page = await context.newPage();
    
    // 访问淘宝登录页
    console.log('[Playwright] 访问淘宝登录页...');
    await page.goto('https://login.taobao.com/member/login.jhtml?redirectURL=https://www.taobao.com/', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    
    // 等待页面加载
    await page.waitForTimeout(3000);
    
    // 尝试点击二维码登录标签
    try {
      const qrTab = await page.locator('[data-spm="qrcode"]').first();
      if (await qrTab.isVisible({ timeout: 2000 })) {
        await qrTab.click();
        console.log('[Playwright] 已点击二维码标签');
        await page.waitForTimeout(2000);
      }
    } catch (err) {
      console.log('[Playwright] 未找到二维码标签或页面已显示二维码');
    }
    
    // 等待二维码出现（多种可能的选择器）
    try {
      await page.waitForSelector('img[id*="qrcode"], img[class*="qrcode"], canvas, #J_QRCodeImg', { timeout: 10000 });
      console.log('[Playwright] 二维码元素已加载');
    } catch (err) {
      console.error('[Playwright] 等待二维码元素超时');
    }
    
    // 提取二维码 URL 和必要参数
    const pageData = await page.evaluate(() => {
      // 尝试从页面中提取必要的数据
      let qrCodeUrl = '';
      let t = '';
      let ck = '';
      let csrf = '';
      
      // 方法1: 从 img 标签提取二维码 URL
      const qrImg = document.querySelector('img[id*="qrcode"], img[class*="qrcode"], #J_QRCodeImg');
      if (qrImg && qrImg.src) {
        qrCodeUrl = qrImg.src;
      }
      
      // 方法2: 从页面脚本中提取
      const scripts = Array.from(document.querySelectorAll('script'));
      for (const script of scripts) {
        const text = script.textContent || '';
        
        // 提取 codeContent（二维码链接）
        if (!qrCodeUrl) {
          const codeContentMatch = text.match(/codeContent["']?\s*:\s*["']([^"']+)["']/);
          if (codeContentMatch) {
            qrCodeUrl = codeContentMatch[1];
          }
        }
        
        // 提取 t
        const tMatch = text.match(/["']t["']?\s*:\s*(\d+)/);
        if (tMatch) t = tMatch[1];
        
        // 提取 ck
        const ckMatch = text.match(/["']ck["']?\s*:\s*["']([^"']+)["']/);
        if (ckMatch) ck = ckMatch[1];
        
        // 提取 csrf
        const csrfMatch = text.match(/["']_csrf["']?\s*:\s*["']([^"']+)["']/);
        if (csrfMatch) csrf = csrfMatch[1];
      }
      
      return { qrCodeUrl, t, ck, csrf };
    });
    
    // 获取 cookies
    const cookies = await context.cookies();
    const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');
    
    // 生成会话 ID
    const sessionId = `pw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 保存浏览器上下文到内存
    global.browserSessions = global.browserSessions || {};
    global.browserSessions[sessionId] = {
      cookies: cookieString,
      pageData: pageData,
      createdAt: Date.now(),
    };
    
    console.log('[Playwright] ✅ 二维码生成成功');
    console.log('[Playwright] 会话ID:', sessionId);
    console.log('[Playwright] 二维码URL:', pageData.qrCodeUrl?.substring(0, 80));
    console.log('[Playwright] Cookies数量:', cookies.length);
    
    await browser.close();
    
    res.json({
      success: true,
      data: {
        qrCodeUrl: pageData.qrCodeUrl,
        sessionId: sessionId,
        t: pageData.t,
        ck: pageData.ck,
        csrf: pageData.csrf,
        cookies: cookieString,
      },
    });
    
  } catch (error) {
    console.error('[Playwright] ❌ 生成二维码失败:', error);
    
    if (browser) {
      await browser.close().catch(err => console.error('关闭浏览器失败:', err));
    }
    
    res.status(500).json({
      success: false,
      message: error.message || '生成二维码失败',
    });
  }
});

// 检查二维码状态并获取 Cookie
app.post('/qrcode/check', authenticateApiKey, async (req, res) => {
  const { sessionId, checkUrl } = req.body;
  
  if (!sessionId || !checkUrl) {
    return res.status(400).json({
      success: false,
      message: '缺少必要参数: sessionId 或 checkUrl',
    });
  }
  
  let browser = null;
  
  try {
    console.log('[Playwright] 开始检查二维码状态...');
    console.log('[Playwright] 会话ID:', sessionId);
    console.log('[Playwright] 检查URL:', checkUrl.substring(0, 80));
    
    // 获取保存的会话信息
    const session = global.browserSessions?.[sessionId];
    if (!session) {
      return res.status(404).json({
        success: false,
        message: '会话不存在或已过期',
      });
    }
    
    // 启动浏览器
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });
    
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 720 },
      locale: 'zh-CN',
    });
    
    // 设置已保存的 cookies
    const cookiePairs = session.cookies.split('; ');
    const cookiesToSet = cookiePairs.map(pair => {
      const [name, ...valueParts] = pair.split('=');
      const value = valueParts.join('=');
      return {
        name: name.trim(),
        value: value?.trim() || '',
        domain: '.taobao.com',
        path: '/',
      };
    }).filter(c => c.name && c.value);
    
    await context.addCookies(cookiesToSet);
    
    const page = await context.newPage();
    
    // 访问检查 URL（这会跟随所有重定向并执行 JS）
    console.log('[Playwright] 访问检查URL...');
    await page.goto(checkUrl, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    
    // 等待页面完全加载
    await page.waitForTimeout(3000);
    
    // 获取最终的 cookies
    const finalCookies = await context.cookies();
    const cookieString = finalCookies.map(c => `${c.name}=${c.value}`).join('; ');
    
    console.log('[Playwright] ✅ Cookie 提取完成');
    console.log('[Playwright] Cookie 数量:', finalCookies.length);
    console.log('[Playwright] Cookie 长度:', cookieString.length);
    
    // 检查是否包含关键的登录 Cookie
    const hasLoginCookie = finalCookies.some(c => c.name === 'cookie2' || c.name === 't' || c.name === '_tb_token_');
    
    // 提取用户名
    let username = '未知用户';
    const nkCookie = finalCookies.find(c => c.name === '_nk_');
    if (nkCookie) {
      try {
        username = decodeURIComponent(nkCookie.value);
      } catch (err) {
        console.error('[Playwright] 解码用户名失败:', err);
      }
    }
    
    // 如果没找到 _nk_，尝试 tracknick
    if (username === '未知用户') {
      const tracknickCookie = finalCookies.find(c => c.name === 'tracknick');
      if (tracknickCookie) {
        try {
          username = decodeURIComponent(tracknickCookie.value);
        } catch (err) {
          console.error('[Playwright] 解码 tracknick 失败:', err);
        }
      }
    }
    
    console.log('[Playwright] 用户名:', username);
    console.log('[Playwright] 包含登录凭证:', hasLoginCookie);
    
    // 获取页面 URL（检查是否到达验证页面）
    const currentUrl = page.url();
    const isVerificationPage = currentUrl.includes('validate') || currentUrl.includes('verify') || currentUrl.includes('iv/');
    
    console.log('[Playwright] 最终URL:', currentUrl);
    console.log('[Playwright] 是否验证页面:', isVerificationPage);
    
    await browser.close();
    
    // 清理会话
    delete global.browserSessions[sessionId];
    
    res.json({
      success: true,
      data: {
        cookie: cookieString,
        username: username,
        hasLoginCookie: hasLoginCookie,
        isVerificationPage: isVerificationPage,
        finalUrl: currentUrl,
        cookieCount: finalCookies.length,
      },
    });
    
  } catch (error) {
    console.error('[Playwright] ❌ 检查失败:', error);
    
    if (browser) {
      await browser.close().catch(err => console.error('关闭浏览器失败:', err));
    }
    
    res.status(500).json({
      success: false,
      message: error.message || '检查失败',
    });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 Playwright 服务已启动`);
  console.log(`📡 监听端口: ${PORT}`);
  console.log(`🔑 API Key: ${API_KEY}`);
  console.log(`💚 健康检查: http://localhost:${PORT}/health`);
});

// 定期清理过期会话（每 10 分钟）
setInterval(() => {
  if (!global.browserSessions) return;
  
  const now = Date.now();
  let cleaned = 0;
  
  for (const [sessionId, session] of Object.entries(global.browserSessions)) {
    if (now - session.createdAt > 10 * 60 * 1000) { // 10分钟
      delete global.browserSessions[sessionId];
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    console.log(`🧹 清理了 ${cleaned} 个过期会话`);
  }
}, 10 * 60 * 1000);
