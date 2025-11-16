/**
 * TSDK - Deno 后端版本
 * 淘宝 H5 API 客户端（用于 Supabase Edge Function）
 * 
 * 完整实现基于 TSDK Python 版本：
 * - Cookie 初始化流程（initCookie）
 * - 登录成功后处理（asyncUrls, iframeRedirectUrl）
 * - Token 刷新机制（getUserSimple）
 * - 信任设备功能（trustDevice）
 */

import { createHash } from "node:crypto";

// iPhone Mobile Safari User-Agent（与 TSDK 保持一致）
const USER_AGENT = "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1";

/**
 * 淘宝 H5 客户端（后端版本）
 * 基于 TSDK/api/taobao/h5.py 完整实现
 */
export class TaobaoH5Client {
  protected baseUrl = 'https://h5api.m.taobao.com/h5';
  protected appKey = '12574478';
  protected jsv = '2.6.1';
  protected timeout = 4096;
  protected cookies: Record<string, string> = {};
  protected referer = 'https://pages.tmall.com/';
  
  // ✅ 登录相关状态（基于 TSDK h5.py 第 52-53 行）
  protected _login_csrf = '';
  protected _login_umidtoken = '';
  
  // ✅ 白名单 Cookie（基于 TSDK h5.py 第 36-50 行）
  protected whiteCookieNames = [
    'cookie2',
    '_tb_token_',
    'unb',
    'cookie17',
    '_cc_',
    '_l_g_',
    'sg',
    'cookie1',
    '_m_h5_tk',
    '_m_h5_tk_enc',
    'sgcookie',
    'x5sec',
  ];

  constructor(cookieString?: string) {
    if (cookieString) {
      this.setCookies(cookieString);
    } else {
      // ✅ 如果没有提供 Cookie，则初始化基础 Cookie
      // 注意：在 Deno 环境中，initCookie 需要异步调用，所以不在构造函数中执行
    }
  }
  
  /**
   * 初始化 Cookie（完全基于 TSDK h5.py 第 86-116 行）
   * 这是登录前的关键步骤！
   */
  async initCookie(): Promise<void> {
    console.log('[TSDK] 🔧 开始初始化 Cookie...');
    
    try {
      // ✅ 步骤1: 生成 _uab_collina（TSDK h5.py 第 88-96 行）
      let _uab_collina = '';
      for (let i = 0; i < 20; i++) {
        if (_uab_collina.length < 11) {
          _uab_collina += Math.random().toString().substring(2);
        } else {
          break;
        }
      }
      const timestamp = Date.now().toString();
      _uab_collina = timestamp + _uab_collina.substring(_uab_collina.length - 11);
      this.cookies['_uab_collina'] = _uab_collina;
      console.log(`[TSDK] ✅ 生成 _uab_collina: ${_uab_collina}`);
      
      // ✅ 步骤2: 从 eg.js 获取 cna（TSDK h5.py 第 98-101 行）
      const egResponse = await fetch('https://log.mmstat.com/eg.js', {
        headers: { 'User-Agent': USER_AGENT }
      });
      
      const etag = egResponse.headers.get('Etag');
      if (etag) {
        const cna = etag.replace(/"/g, '');
        this.cookies['cna'] = cna;
        console.log(`[TSDK] ✅ 获取 cna: ${cna}`);
      }
      
      // ✅ 步骤3: 初始化 _tb_token, cookie2, t 等（TSDK h5.py 第 111-113 行）
      console.log('[TSDK] 🔧 初始化 _tb_token 和 cookie2...');
      
      // 第一次请求
      const res1 = await fetch('https://h5api.m.taobao.com/h5/mtop.user.getusersimple/1.0/', {
        headers: {
          'User-Agent': USER_AGENT,
          'Cookie': this.formatCookies()
        }
      });
      this.updateCookiesFromResponse(res1);
      
      // 第二次请求
      const res2 = await fetch('https://h5api.m.taobao.com/h5/mtop.taobao.wireless.home.load/1.0/?appKey=12574478', {
        headers: {
          'User-Agent': USER_AGENT,
          'Cookie': this.formatCookies()
        }
      });
      this.updateCookiesFromResponse(res2);
      
      // ✅ 步骤4: 设置额外的必要 Cookie（TSDK h5.py 第 114-116 行）
      this.cookies['thw'] = 'cn';
      this.cookies['xlly_s'] = '1';
      this.cookies['_samesite_flag_'] = 'true';
      
      console.log('[TSDK] ✅ Cookie 初始化完成');
      console.log(`[TSDK] 📊 当前 Cookie 字段数量: ${Object.keys(this.cookies).length}`);
      console.log(`[TSDK] 📊 Cookie 字段:`, Object.keys(this.cookies).join(', '));
      
    } catch (error: any) {
      console.error('[TSDK] ❌ Cookie 初始化失败:', error.message);
      throw error;
    }
  }
  
  /**
   * 从响应中更新 Cookie
   */
  protected updateCookiesFromResponse(response: Response): void {
    const setCookies = response.headers.getSetCookie?.() || [];
    
    if (setCookies.length > 0) {
      setCookies.forEach((cookie) => {
        const cookiePair = cookie.split(';')[0];
        const [name, value] = cookiePair.split('=');
        if (name && value) {
          this.cookies[name.trim()] = value.trim();
        }
      });
      console.log(`[TSDK] 🍪 更新了 ${setCookies.length} 个 Cookie`);
    }
  }
  
  /**
   * 登录前准备（基于 TSDK h5.py 第 225-237 行）
   * 访问登录页面获取 csrf token 和 umidToken
   */
  async loginBefore(): Promise<void> {
    console.log('[TSDK] 🔧 开始登录前准备...');
    
    try {
      const loginUrl = `https://login.taobao.com/havanaone/login/login.htm?bizName=taobao&f=top&redirectURL=${encodeURIComponent('https://www.taobao.com')}`;
      
      const response = await fetch(loginUrl, {
        headers: {
          'User-Agent': USER_AGENT,
          'Cookie': this.formatCookies()
        }
      });
      
      if (!response.ok) {
        throw new Error(`登录前准备失败: HTTP ${response.status}`);
      }
      
      const html = await response.text();
      
      // ✅ 提取 viewData（TSDK h5.py 第 232-237 行）
      const viewDataMatch = html.match(/viewData\s*=\s*(\{.*?\});/s);
      if (!viewDataMatch) {
        throw new Error('无法提取 viewData');
      }
      
      const viewData = JSON.parse(viewDataMatch[1]);
      const loginForm = viewData.loginFormData || {};
      
      this._login_csrf = loginForm._csrf || '';
      this._login_umidtoken = loginForm.umidToken || '';
      
      console.log(`[TSDK] ✅ csrf: ${this._login_csrf.substring(0, 10)}...`);
      console.log(`[TSDK] ✅ umidToken: ${this._login_umidtoken.substring(0, 20)}...`);
      
    } catch (error: any) {
      console.error('[TSDK] ❌ 登录前准备失败:', error.message);
      throw error;
    }
  }
  
  /**
   * 获取用户简单信息（基于 TSDK h5.py 第 636-665 行）
   * 用于刷新 _m_h5_tk token
   */
  async getUserSimple(): Promise<any> {
    console.log('[TSDK] 📡 调用 getUserSimple 刷新 token...');
    
    const method = 'get';
    const params = {
      jsv: '2.6.1',
      appKey: '12574478',
      api: 'mtop.user.getUserSimple',
      v: '1.0',
      ecode: '1',
      sessionOption: 'AutoLoginOnly',
      jsonpIncPrefix: 'liblogin',
      type: 'jsonp',
      dataType: 'jsonp',
      callback: `mtopjsonpliblogin${Math.floor(Math.random() * 100)}`,
      data: {}
    };
    
    const t = this.getTimestamp();
    const token = this.getToken();
    const dataStr = JSON.stringify(params.data);
    const sign = this.sign(token, t, params.appKey, dataStr);
    
    console.log(`[TSDK] 🔧 getUserSimple - 当前 token: ${token?.substring(0, 20)}...`);
    console.log(`[TSDK] 🔧 getUserSimple - t: ${t}, sign: ${sign?.substring(0, 20)}...`);
    
    const url = new URLSearchParams({
      ...params,
      t,
      sign,
      data: dataStr
    });
    
    const fullUrl = `https://h5api.m.taobao.com/h5/mtop.user.getusersimple/1.0/?${url.toString()}`;
    
    console.log(`[TSDK] 🌐 请求 URL: ${fullUrl.substring(0, 150)}...`);
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'User-Agent': USER_AGENT,
        'Cookie': this.formatCookies(),
        'Referer': 'https://www.taobao.com/'
      }
    });
    
    console.log(`[TSDK] 📥 getUserSimple 响应状态: ${response.status}`);
    
    // ✅ 更新 Cookie（特别是 _m_h5_tk）
    const beforeUpdate = Object.keys(this.cookies).length;
    this.updateCookiesFromResponse(response);
    const afterUpdate = Object.keys(this.cookies).length;
    
    console.log(`[TSDK] 🍪 Cookie 更新：之前 ${beforeUpdate} 个，之后 ${afterUpdate} 个`);
    
    // 检查是否获取到 _m_h5_tk
    if (this.cookies['_m_h5_tk']) {
      console.log(`[TSDK] ✅ 成功获取 _m_h5_tk: ${this.cookies['_m_h5_tk'].substring(0, 20)}...`);
    } else {
      console.warn(`[TSDK] ⚠️ 未获取到 _m_h5_tk！`);
      // 打印响应头
      console.log(`[TSDK] 🔍 响应头 Set-Cookie:`, response.headers.getSetCookie?.());
    }
    
    const text = await response.text();
    console.log(`[TSDK] 📄 响应文本 (���300字符): ${text.substring(0, 300)}...`);
    
    const jsonMatch = text.match(/mtopjsonpliblogin\d+\((.*)\)/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[1]);
      console.log('[TSDK] ✅ getUserSimple 成功，token 已刷新');
      console.log(`[TSDK] 📊 返回数据:`, JSON.stringify(result, null, 2).substring(0, 500));
      return result.data;
    }
    
    console.error(`[TSDK] ❌ getUserSimple 响应格式错误，无法匹配 JSONP 格式`);
    console.error(`[TSDK] 完整响应: ${text}`);
    throw new Error('getUserSimple 响应格式错误');
  }
  
  /**
   * 处理登录成功后的跳转链接（基于 TSDK h5.py 第 276-283 行）
   * @param asyncUrls - 异步跳转 URL 数组（天猫、飞猪等多站点同步登录）
   * @param iframeRedirectUrl - 主跳转 URL
   */
  async handleLoginSuccess(asyncUrls?: string[], iframeRedirectUrl?: string): Promise<void> {
    console.log('[TSDK] 🔄 处理登录成功后的跳转...');
    
    try {
      // ✅ 处理 asyncUrls（TSDK h5.py 第 277-279 行）
      if (asyncUrls && asyncUrls.length > 0) {
        console.log(`[TSDK] 📡 处理 ${asyncUrls.length} 个异步跳转 URL...`);
        
        for (const url of asyncUrls) {
          try {
            console.log(`[TSDK] 🔗 访问: ${url.substring(0, 80)}...`);
            const res = await fetch(url, {
              headers: {
                'User-Agent': USER_AGENT,
                'Cookie': this.formatCookies()
              }
            });
            this.updateCookiesFromResponse(res);
            console.log(`[TSDK] ✅ 异步 URL 处理完成: ${res.status}`);
          } catch (err: any) {
            console.warn(`[TSDK] ⚠️ 异步 URL 处理失败: ${err.message}`);
          }
        }
      }
      
      // ✅ 处理 iframeRedirectUrl（TSDK h5.py 第 281-283 行）
      if (iframeRedirectUrl) {
        console.log(`[TSDK] 🔗 访问主跳转 URL: ${iframeRedirectUrl.substring(0, 80)}...`);
        const res = await fetch(iframeRedirectUrl, {
          headers: {
            'User-Agent': USER_AGENT,
            'Cookie': this.formatCookies()
          }
        });
        this.updateCookiesFromResponse(res);
        console.log(`[TSDK] ✅ 主跳转 URL 处理完成: ${res.status}`);
      }
      
      // ✅ 最后调用 getUserSimple 刷新 _m_h5_tk token（TSDK h5.py 第 285 行）
      await this.getUserSimple();
      console.log('[TSDK] ✅ 登录成功后处理完成');
      
    } catch (error: any) {
      console.error('[TSDK] ❌ 登录成功后处理失败:', error.message);
      // 不抛出错误，继续执行
    }
  }
  
  /**
   * 信任设备（基于 TSDK h5.py 第 437-449 行）
   * @param ck - 二维码生成时的 ck 参数
   * @param trust - 是否信任设备
   */
  async trustDevice(ck: string, trust: boolean = true): Promise<any> {
    console.log(`[TSDK] 🔐 ${trust ? '信任' : '不信任'}设备...`);
    
    try {
      const token = ck.replace('qr_code_', '');
      
      const url = new URL('https://login.taobao.com/havanaone/login/autoLogin/choose.do');
      url.searchParams.set('token', token);
      url.searchParams.set('chooseNextAction', 'clearAutoLoginToken');
      url.searchParams.set('chooseButton', trust.toString());
      
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'User-Agent': USER_AGENT,
          'Cookie': this.formatCookies(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          dialogStress: trust,
          deviceId: this.cookies['cna'] || ''
        })
      });
      
      const result = await response.json();
      console.log(`[TSDK] ✅ 信任设备设置完成:`, result);
      
      return result;
    } catch (error: any) {
      console.error('[TSDK] ❌ 信任设备失败:', error.message);
      throw error;
    }
  }
  
  /**
   * 发送短信验证码（基于 TSDK h5.py 第 385-412 行）
   * @param phone - 手机号
   * @param countryCode - 国家代码（默认 CN）
   * @param phoneCode - 区号（默认 86）
   */
  async sendSms(phone: string, countryCode: string = 'CN', phoneCode: string = '86'): Promise<{
    smsToken: string;
    emailToken?: string;
    resultCode: number;
  }> {
    console.log(`[TSDK] 📱 发送短信验证码到: +${phoneCode} ${phone}`);
    
    try {
      // 先调用登录前准备
      await this.loginBefore();
      
      // 步骤1: 推荐登录流程
      const recommendUrl = 'https://login.m.taobao.com/havanaone/loginLegacy/recommendLoginFlow.do?bizEntrance=taobao_h5&bizName=taobao';
      await fetch(recommendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': USER_AGENT,
          'Cookie': this.formatCookies(),
          'Referer': 'https://login.m.taobao.com/'
        },
        body: new URLSearchParams({
          simBizType: '0',
          loginId: phone,
          phoneCode: phoneCode,
          countryCode: countryCode,
          keepLogin: 'true',
          contextToken: '',
          defaultView: 'sim'
        })
      });
      
      // 步骤2: 发送短信验证码
      const smsUrl = 'https://login.m.taobao.com/havanaone/loginLegacy/sms/sendSms.do?bizEntrance=taobao_h5&bizName=taobao';
      const smsResponse = await fetch(smsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': USER_AGENT,
          'Cookie': this.formatCookies(),
          'Referer': 'https://login.m.taobao.com/'
        },
        body: new URLSearchParams({
          phoneCode: phoneCode,
          loginId: phone,
          countryCode: countryCode,
          contextToken: '',
          defaultView: 'sim',
          _csrf: this._login_csrf,
          lang: 'zh_CN'
        })
      });
      
      if (!smsResponse.ok) {
        throw new Error(`发送短信失败: HTTP ${smsResponse.status}`);
      }
      
      const result = await smsResponse.json();
      console.log('[TSDK] 📱 短信发送响应:', JSON.stringify(result, null, 2));
      
      if (result.hasError) {
        throw new Error(result.content?.message || '发送短信失败');
      }
      
      const smsData = result.content?.data;
      if (!smsData || !smsData.smsToken) {
        throw new Error('短信发送失败：未获取到 smsToken');
      }
      
      console.log(`[TSDK] ✅ 短信发送成功，smsToken: ${smsData.smsToken.substring(0, 20)}...`);
      
      return {
        smsToken: smsData.smsToken,
        emailToken: smsData.emailToken,
        resultCode: smsData.resultCode
      };
    } catch (error: any) {
      console.error('[TSDK] ❌ 发送短信失败:', error.message);
      throw error;
    }
  }
  
  /**
   * 短信验证码登录（基于 TSDK h5.py 第 415-435 行）
   * @param phone - 手机号
   * @param smsCode - 短信验证码
   * @param smsToken - 发送短信时返回的 token
   * @param countryCode - 国家代码（默认 CN）
   * @param phoneCode - 区号（默认 86）
   */
  async loginSms(
    phone: string,
    smsCode: string,
    smsToken: string,
    countryCode: string = 'CN',
    phoneCode: string = '86'
  ): Promise<void> {
    console.log(`[TSDK] 📱 短信登录: +${phoneCode} ${phone}`);
    
    try {
      const loginUrl = 'https://login.m.taobao.com/havanaone/loginLegacy/sms/login.do?bizEntrance=taobao_h5&bizName=taobao';
      
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': USER_AGENT,
          'Cookie': this.formatCookies(),
          'Referer': 'https://login.m.taobao.com/'
        },
        body: new URLSearchParams({
          loginId: phone,
          phoneCode: phoneCode,
          countryCode: countryCode,
          keepLogin: 'true',
          contextToken: '',
          smsCode: smsCode,
          smsToken: smsToken
        })
      });
      
      if (!response.ok) {
        throw new Error(`短信登录失败: HTTP ${response.status}`);
      }
      
      // 更新 Cookie
      this.updateCookiesFromResponse(response);
      
      const result = await response.json();
      console.log('[TSDK] 📱 短信登录响应:', JSON.stringify(result, null, 2));
      
      if (result.hasError) {
        throw new Error(result.content?.message || '短信登录失败');
      }
      
      const loginData = result.content?.data;
      
      // 处理重定向 URL
      if (loginData?.redirectUrl) {
        console.log(`[TSDK] 🔗 访问重定向 URL: ${loginData.redirectUrl}`);
        const redirectResponse = await fetch(loginData.redirectUrl, {
          headers: {
            'User-Agent': USER_AGENT,
            'Cookie': this.formatCookies()
          }
        });
        this.updateCookiesFromResponse(redirectResponse);
      }
      
      // 刷新 token
      await this.getUserSimple();
      
      console.log('[TSDK] ✅ 短信登录成功');
    } catch (error: any) {
      console.error('[TSDK] ❌ 短信登录失败:', error.message);
      throw error;
    }
  }

  /**
   * 设置 Cookie
   */
  setCookies(cookieString: string): void {
    this.cookies = {};
    
    cookieString.split(';').forEach(pair => {
      const [key, value] = pair.trim().split('=');
      if (key && value) {
        this.cookies[key] = value;
      }
    });
  }

  /**
   * 计算签名（MD5）
   */
  protected sign(token: string, t: string, appKey: string, data: string): string {
    const signStr = `${token}&${t}&${appKey}&${data}`;
    return createHash('md5').update(signStr).digest('hex');
  }

  /**
   * 获取当前时间戳
   */
  protected getTimestamp(): string {
    return Date.now().toString();
  }

  /**
   * 从 Cookie 中提取 token
   */
  protected getToken(): string {
    const m_h5_tk = this.cookies['_m_h5_tk'] || '';
    return m_h5_tk.split('_')[0] || '';
  }

  /**
   * 获取 token 的时间戳
   */
  protected getTokenTimestamp(): number {
    const m_h5_tk = this.cookies['_m_h5_tk'] || '';
    const parts = m_h5_tk.split('_');
    return parts.length > 1 ? parseInt(parts[1], 10) : 0;
  }

  /**
   * 检查 token 是否需要刷新
   * TSDK 原理：_m_h5_tk 格式为 "token_timestamp"，超过一定时间需要刷新
   */
  protected needsTokenRefresh(): boolean {
    const tokenTimestamp = this.getTokenTimestamp();
    if (!tokenTimestamp) {
      console.log('[TSDK] 🔍 token 时间戳为空，需要刷新');
      return true;
    }
    
    const now = Date.now();
    const age = now - tokenTimestamp;
    const maxAge = 30 * 60 * 1000; // 30分钟（TSDK 通常的阈值）
    
    // ✅ 修复：如果时间戳是未来的时间（age < 0），也需要刷新
    if (age < 0) {
      console.log(`[TSDK] 🔍 token 时间戳异常（未来时间），需要刷新`);
      return true;
    }
    
    if (age > maxAge) {
      console.log(`[TSDK] 🔍 token 已过期 (${Math.floor(age / 60000)} 分钟)，需要刷新`);
      return true;
    }
    
    console.log(`[TSDK] ✅ token 仍有效 (${Math.floor(age / 60000)} 分钟前)，无需刷新`);
    return false;
  }

  /**
   * 格式化 Cookie 为字符串
   */
  protected formatCookies(): string {
    return Object.entries(this.cookies)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ');
  }
  
  /**
   * 获取 Cookie 字符串（公开方法，用于保存）
   */
  getCookieString(): string {
    return this.formatCookies();
  }

  /**
   * 执行 API 请求
   */
  async request(
    apiName: string,
    version: string,
    data: any = {},
    extraParams: any = {}
  ): Promise<any> {
    const t = this.getTimestamp();
    const token = this.getToken();
    const dataStr = JSON.stringify(data);
    const sign = this.sign(token, t, this.appKey, dataStr);

    // 构建 URL 参数
    const params = new URLSearchParams({
      jsv: this.jsv,
      appKey: this.appKey,
      t,
      sign,
      api: apiName,
      v: version,
      timeout: this.timeout.toString(),
      type: 'jsonp',
      dataType: 'jsonp',
      callback: `mtopjsonp${Math.floor(Math.random() * 100)}`,
      data: dataStr,
      ...extraParams
    });

    const url = `${this.baseUrl}/${apiName}/${version}/?${params.toString()}`;

    console.log(`[TSDK] 📡 请求: ${apiName}`);
    console.log(`[TSDK] 📡 URL: ${url.substring(0, 150)}...`);
    console.log(`[TSDK] 📡 Cookie 字段数量: ${Object.keys(this.cookies).length}`);
    console.log(`[TSDK] 📡 Cookie 字段:`, Object.keys(this.cookies).join(', '));
    console.log(`[TSDK] 📡 _m_h5_tk: ${this.cookies['_m_h5_tk']?.substring(0, 30)}...`);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Referer': this.referer,
          'Cookie': this.formatCookies(),
          'User-Agent': USER_AGENT
        }
      });

      console.log(`[TSDK] 📊 响应状态: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();
      console.log(`[TSDK] 📄 响应文本长度: ${text.length}`);
      console.log(`[TSDK] 📄 响应预览: ${text.substring(0, 200)}`);
      
      // 解析 JSONP 响应
      const jsonMatch = text.match(/mtopjsonp\d+\((.*)\)/);
      if (!jsonMatch) {
        console.error(`[TSDK] ❌ 无法解析 JSONP 格式，响应文本: ${text.substring(0, 500)}`);
        throw new Error('Invalid JSONP response format');
      }

      const result = JSON.parse(jsonMatch[1]);
      console.log(`[TSDK] 📦 解析后的 result:`, JSON.stringify(result, null, 2));

      // 检查 API 返回状态
      if (!result.ret?.[0]?.startsWith('SUCCESS')) {
        const errorCode = result.ret?.[0] || 'UNKNOWN_ERROR';
        console.error(`[TSDK] ❌ API 返回错误码: ${errorCode}`);
        console.error(`[TSDK] ❌ 完整错误信息:`, JSON.stringify(result, null, 2));
        const errorMsg = this.parseErrorMessage(errorCode, result);
        throw new Error(errorMsg);
      }

      console.log(`[TSDK] ✅ 成功: ${apiName}`);
      return result.data;

    } catch (error: any) {
      console.error(`[TSDK] ❌ 失败: ${apiName}`, error.message);
      throw error;
    }
  }

  /**
   * 解析错误信息
   */
  protected parseErrorMessage(errorCode: string, result: any): string {
    const errorMap: Record<string, string> = {
      'FAIL_SYS_ILLEGAL_ACCESS': '非法访问，请检查风控参数',
      'FAIL_SYS_TOKEN_EMPTY': 'Token为空，Cookie可能已过期',
      'FAIL_SYS_TOKEN_EXOIRED': 'Token已过期，请重新登录',
      'FAIL_SYS_SESSION_EXPIRED': '会话已过期，请重新登录',
      'FAIL_SYS_USER_VALIDATE': '用户验证失败，请重新登录',
      'FAIL_BIZ_ALREADY_RECEIVED': '您已经领取过该红包了',
      'FAIL_BIZ_STOCK_NOT_ENOUGH': '红包库存不足，已被抢光',
      'FAIL_BIZ_NOT_IN_TIME': '不在活动时间内',
      'FAIL_BIZ_COIN_NOT_ENOUGH': '礼享金余额不足',
      'FAIL_BIZ_RISK_CONTROL': '触发风控限制，请稍后再试',
      'FAIL_BIZ_FREQ_LIMIT': '操作太频繁，请稍后再试',
      'FAIL_BIZ_BLACK_USER': '账号异常，无法参与活动',
      'LATOUR_BENEFITE_SHOW_FAIL': '红包已被抢光',
      'RGV587_ERROR': '系统繁忙，请稍后再试'
    };

    // 提取纯错误码（去掉 :: 后面的部分）
    const pureErrorCode = errorCode.split('::')[0];

    // 优先使用错误映射表
    if (errorMap[pureErrorCode]) {
      return errorMap[pureErrorCode];
    }

    // 其次尝试从响应中获取错误信息
    if (result.data?.errorMsg) {
      return result.data.errorMsg;
    }

    if (result.data?.message) {
      return result.data.message;
    }

    // 如果有 :: 分隔符，返回后半部分的中文描述
    if (errorCode.includes('::')) {
      return errorCode.split('::')[1];
    }

    // 最后返回原始错误码
    return `API Error: ${errorCode}`;
  }
}

/**
 * 天猫礼享金 API
 */
export class TmallGiftAPI extends TaobaoH5Client {
  /**
   * 刷新 _m_h5_tk token
   * 访问天猫页面来获取的 _m_h5_tk
   */
  private async refreshToken(): Promise<void> {
    // ✅ 先检查是否需要刷新（基于 TSDK 原理）
    if (!this.needsTokenRefresh()) {
      console.log('[TSDK] ⏭️ token 仍有效，跳过刷新');
      return;
    }
    
    try {
      console.log('[TSDK] 🔄 开始刷新 _m_h5_tk token...');
      
      // ✅ 修复：使用正确的天猫礼享金页面 URL
      const tmallUrl = 'https://pages.tmall.com/wow/an/tmall/user-growth/share-benefit-exchange';
      
      const response = await fetch(tmallUrl, {
        method: 'GET',
        headers: {
          'User-Agent': USER_AGENT,
          'Cookie': this.formatCookies(),
          'Referer': 'https://www.taobao.com/',
        },
      });
      
      console.log(`[TSDK] 📊 刷新请求响应: ${response.status}`);
      
      // 提取新的 Set-Cookie
      const setCookies = response.headers.getSetCookie?.() || [];
      
      if (setCookies.length > 0) {
        console.log(`[TSDK] 🍪 获取到 ${setCookies.length} 个新 Cookie`);
        
        setCookies.forEach((cookie) => {
          const cookiePair = cookie.split(';')[0];
          const [name, value] = cookiePair.split('=');
          if (name && value) {
            this.cookies[name.trim()] = value.trim();
            if (name.trim() === '_m_h5_tk') {
              console.log(`[TSDK] ✅ 成功刷新 _m_h5_tk: ${value.substring(0, 40)}...`);
            }
          }
        });
      } else {
        console.warn(`[TSDK] ⚠️ 刷新请求未返回 Set-Cookie`);
      }
    } catch (error) {
      console.error('[TSDK] ❌ 刷新 token 失败:', error);
      // 不抛出错误，继续使用旧 token
    }
  }

  /**
   * 获取礼享金兑换页面所有数据
   */
  async getExchangeAllPage(data: any = {}): Promise<any> {
    // ✅ 在调用 API 前刷新 token
    await this.refreshToken();
    
    return await this.request(
      'mtop.fission.gift.share.vcoin.exchange.allpage',
      '1.0',
      data,
      {
        needRetry: 'true'
      }
    );
  }

  /**
   * 获取红包列表
   */
  async getRedPackets(): Promise<any[]> {
    try {
      const pageData = await this.getExchangeAllPage();

      // 话费红包
      const phonePackets = pageData?.phoneBillModule?.redPackets || [];
      // 普通红包
      const normalPackets = pageData?.redPacketModule?.redPackets || [];

      const allPackets = [...phonePackets, ...normalPackets];

      // 筛选可用红包
      const availablePackets = allPackets.filter(
        (packet: any) => packet.status === 'AVAILABLE'
      );

      console.log(`[TSDK] 找到 ${availablePackets.length} 个可用红包`);

      return availablePackets;
    } catch (error) {
      console.error('[TSDK] 获取红包列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取礼享金余额
   */
  async getCoinBalance(): Promise<{ balance: number; availableAmount: string }> {
    try {
      const pageData = await this.getExchangeAllPage();

      const balance = parseInt(pageData?.coinAmount || '0', 10);
      const availableAmount = pageData?.availableAmount || '0';

      console.log(`[TSDK] 礼享金余额: ${balance}, 可金额: ${availableAmount}`);

      return {
        balance,
        availableAmount
      };
    } catch (error) {
      console.error('[TSDK] 获取礼享金余额失败:', error);
      throw error;
    }
  }

  /**
   * 获取完整页面数据（包括余额和红包）
   */
  async getFullPageData(): Promise<{
    balance: number;
    availableAmount: string;
    redPackets: any[];
  }> {
    try {
      const pageData = await this.getExchangeAllPage();

      const balance = parseInt(pageData?.coinAmount || '0', 10);
      const availableAmount = pageData?.availableAmount || '0';

      const phonePackets = pageData?.phoneBillModule?.redPackets || [];
      const normalPackets = pageData?.redPacketModule?.redPackets || [];
      const allPackets = [...phonePackets, ...normalPackets];

      const availablePackets = allPackets.filter(
        (packet: any) => packet.status === 'AVAILABLE'
      );

      return {
        balance,
        availableAmount,
        redPackets: availablePackets
      };
    } catch (error) {
      console.error('[TSDK] 获取完整页面数据失败:', error);
      throw error;
    }
  }
}