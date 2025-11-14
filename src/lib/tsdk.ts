/**
 * TSDK - JavaScript 版本
 * 淘宝 H5 API 客户端
 * 完全在浏览器中运行，无需后端
 */

import CryptoJS from 'crypto-js';

// =====================================================
// 基础 H5 客户端
// =====================================================

export class TaobaoH5Client {
  protected baseUrl = 'https://h5api.m.tmall.com/h5';
  protected appKey = '12574478';
  protected jsv = '2.6.1';
  protected timeout = 4096;
  protected cookies: Record<string, string> = {};
  protected referer = 'https://pages.tmall.com/';

  constructor(cookieString?: string) {
    if (cookieString) {
      this.setCookies(cookieString);
    }
  }

  /**
   * 设置 Cookie
   */
  setCookies(cookieString: string): void {
    this.cookies = {};
    
    // 解析 Cookie 字符串
    cookieString.split(';').forEach(pair => {
      const [key, value] = pair.trim().split('=');
      if (key && value) {
        this.cookies[key] = value;
      }
    });
  }

  /**
   * 计算签名
   */
  protected sign(token: string, t: string, appKey: string, data: string): string {
    const signStr = `${token}&${t}&${appKey}&${data}`;
    return CryptoJS.MD5(signStr).toString();
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
    // token 是 _m_h5_tk 的第一部分（下划线前）
    return m_h5_tk.split('_')[0] || '';
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

    console.log(`[TSDK] 请求: ${apiName}`);

    try {
      // 发送请求
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Referer': this.referer,
          'Cookie': this.formatCookies(),
          'User-Agent': navigator.userAgent
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();
      
      // 解析 JSONP 响应
      const jsonMatch = text.match(/mtopjsonp\d+\((.*)\)/);
      if (!jsonMatch) {
        throw new Error('Invalid JSONP response format');
      }

      const result = JSON.parse(jsonMatch[1]);

      // 检查 API 返回状态
      if (!result.ret?.[0]?.startsWith('SUCCESS')) {
        const errorCode = result.ret?.[0] || 'UNKNOWN_ERROR';
        const errorMsg = this.parseErrorMessage(errorCode, result);
        throw new Error(errorMsg);
      }

      console.log(`[TSDK] 成功: ${apiName}`);
      return result.data;

    } catch (error: any) {
      console.error(`[TSDK] 失败: ${apiName}`, error);
      throw error;
    }
  }

  /**
   * 解析错误信息 - 基于真实抓包失败案例
   */
  protected parseErrorMessage(errorCode: string, result: any): string {
    // 常见错误码映射（基于真实抓包）
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
      'LATOUR_BENEFITE_SHOW_FAIL': '红包已被抢光', // 基于真实抓包添加
      'RGV587_ERROR': '系统繁忙，请稍后再试'
    };

    // 优先使用映射的友好提示
    if (errorMap[errorCode]) {
      return errorMap[errorCode];
    }

    // 尝试从响应中提取错误消息
    if (result.data?.errorMsg) {
      return result.data.errorMsg;
    }

    if (result.data?.message) {
      return result.data.message;
    }

    // 返回原始错误码
    return `API Error: ${errorCode}`;
  }
}

// =====================================================
// 天猫礼享金 API
// =====================================================

export interface RedPacket {
  amount: string;
  benefitCode: string;
  btnText: string;
  buttonTips: string;
  cent: number;
  coinAmount: string;
  desc?: string;
  status: 'AVAILABLE' | 'SOLD_OUT' | 'EXCHANGED';
  subDesc?: string;
  title: string;
  [key: string]: any;
}

export interface RedPacketModule {
  redAsacCode: string;
  redPackets: RedPacket[];
}

export interface RedPacketListResponse {
  api: string;
  data: {
    accountTips: string;
    totalAmount: string;
    redAsacCode: string;
    drawAsacCode: string;
    redPacketModule: RedPacketModule;
    phoneBillModule?: {
      redAsacCode: string;
      redPackets: RedPacket[];
    };
    itemModule?: {
      items: any[];
    };
    termDTOList?: any[];
  };
  ret: string[];
  traceId: string;
  v: string;
}

export interface UserInfo {
  nick: string;
  userNumId: string;
  displayNick: string;
}

export interface UserInfoResponse {
  api: string;
  v: string;
  ret: string[];
  data: UserInfo;
}

export interface UserBalance {
  totalAmount: string;
  availableAmount: string;
  coinAmount: string;
}

export class TmallGiftAPI extends TaobaoH5Client {
  /**
   * 获取礼享金兑换页面所有数据
   */
  async getExchangeAllPage(data: any = {}): Promise<any> {
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
  async getRedPackets(): Promise<RedPacket[]> {
    try {
      const pageData = await this.getExchangeAllPage();

      // 话费红包
      const phonePackets = pageData?.phoneBillModule?.redPackets || [];
      // 普通红包
      const normalPackets = pageData?.redPacketModule?.redPackets || [];

      const allPackets = [...phonePackets, ...normalPackets];

      // 筛选可用红包
      const availablePackets = allPackets.filter(
        packet => packet.status === 'AVAILABLE'
      );

      console.log(`[TSDK] 找到 ${availablePackets.length} 个可用红包`);

      return availablePackets;
    } catch (error) {
      console.error('[TSDK] 获取红包列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有红包（包括不可用的）
   */
  async getAllRedPackets(): Promise<RedPacket[]> {
    try {
      const pageData = await this.getExchangeAllPage();

      // 话费红包
      const phonePackets = pageData?.phoneBillModule?.redPackets || [];
      // 普通红包
      const normalPackets = pageData?.redPacketModule?.redPackets || [];

      const allPackets = [...phonePackets, ...normalPackets];

      console.log(`[TSDK] 总共 ${allPackets.length} 个红包`);

      return allPackets;
    } catch (error) {
      console.error('[TSDK] 获取红包列表失败:', error);
      throw error;
    }
  }

  /**
   * 按金额排序红包（从高到低）
   */
  sortByAmount(redPackets: RedPacket[]): RedPacket[] {
    return [...redPackets].sort((a, b) => b.cent - a.cent);
  }

  /**
   * 获取可兑换的红包并按金额排序
   */
  async getAvailableRedPacketsSorted(): Promise<RedPacket[]> {
    const available = await this.getRedPackets();
    return this.sortByAmount(available);
  }

  /**
   * 获取 redAsacCode（用于兑换请求）
   */
  async getRedAsacCode(): Promise<string> {
    try {
      const pageData = await this.getExchangeAllPage();
      return pageData?.redAsacCode || pageData?.redPacketModule?.redAsacCode || '';
    } catch (error) {
      console.error('[TSDK] 获取 redAsacCode 失败:', error);
      return '';
    }
  }

  /**
   * 兑换红包 - 基于真实抓包数据实现
   * 
   * @param benefitCode 红包标识码
   * @param riskParams 风控参数 { ua, umid_token, asac }
   */
  async exchangeRedPacket(
    benefitCode: string,
    riskParams: {
      ua: string;
      umid_token: string;
      asac: string;
    }
  ): Promise<any> {
    try {
      console.log(`[TSDK] 开始抢购红包: ${benefitCode}`);

      // 构建请求数据 - 完全匹配真实抓包
      const requestData = {
        asac: riskParams.asac,
        benefitCode: benefitCode,
        type: 'redPacket',
        ua: riskParams.ua,
        umidToken: riskParams.umid_token
      };

      // URL 额外参数 - 完全匹配真实抓包
      const extraParams = {
        ecode: '1',
        isSec: '1',
        secType: '2',
        needWua: 'true',
        isNeedWua: 'true',
        needRetry: 'true',
        asac: riskParams.asac
      };

      // 注意：API 名称是 fisson 不是 fission（这是淘宝的拼写）
      const result = await this.request(
        'mtop.fisson.gift.share.vcoin.exchange',
        '1.0',
        requestData,
        extraParams
      );

      console.log('[TSDK] 抢购成功!');
      return result;

    } catch (error: any) {
      console.error('[TSDK] 抢购失败:', error);
      throw new Error(`抢购失败: ${error.message}`);
    }
  }

  /**
   * 获取用户余额
   */
  async getUserBalance(): Promise<UserBalance> {
    try {
      const pageData = await this.getExchangeAllPage();

      const balance: UserBalance = {
        totalAmount: '0',
        availableAmount: '0',
        coinAmount: '0'
      };

      // 从提现模块获取
      const withdrawalModule = pageData?.withdrawalModule;
      if (withdrawalModule) {
        balance.totalAmount = withdrawalModule.totalAmount || '0';
        balance.availableAmount = withdrawalModule.availableAmount || '0';
      }

      // 从红包模块获取
      const redPacketModule = pageData?.redPacketModule;
      if (redPacketModule) {
        balance.coinAmount = redPacketModule.totalCoinAmount || '0';
      }

      console.log('[TSDK] 余额信息:', balance);
      return balance;

    } catch (error) {
      console.error('[TSDK] 获取余额失败:', error);
      return {
        totalAmount: '0',
        availableAmount: '0',
        coinAmount: '0'
      };
    }
  }

  /**
   * 获取用户信息（从 Cookie 中）
   */
  getUserInfo(): { nick?: string; userId?: string } {
    return {
      nick: this.cookies['_nk_'] || this.cookies['nick'],
      userId: this.cookies['unb'] || this.cookies['userId']
    };
  }

  /**
   * 获取用户信息（通过 API）
   */
  async getUserInfoFromAPI(): Promise<UserInfoResponse> {
    try {
      const result = await this.request(
        'mtop.user.getUserSimple',
        '1.0',
        {},
        {
          ecode: '1',
          sessionOption: 'AutoLoginOnly',
          jsonpIncPrefix: 'liblogin'
        }
      );

      return {
        api: 'mtop.user.getUserSimple',
        v: '1.0',
        ret: ['SUCCESS::调用成功'],
        data: result
      };
    } catch (error) {
      console.error('[TSDK] 获取用户信息失败:', error);
      throw error;
    }
  }

  /**
   * 验证登录状态
   */
  async isLoggedIn(): Promise<boolean> {
    try {
      const info = await this.getUserInfoFromAPI();
      return info.ret[0].startsWith('SUCCESS') && !!info.data.userNumId;
    } catch {
      return false;
    }
  }

  /**
   * 获取用户详细信息（含登录验证）
   */
  async getUserProfile(): Promise<{
    isLoggedIn: boolean;
    userInfo?: UserInfo;
    error?: string;
  }> {
    try {
      const response = await this.getUserInfoFromAPI();
      
      if (response.ret[0].startsWith('SUCCESS')) {
        return {
          isLoggedIn: true,
          userInfo: response.data
        };
      } else {
        return {
          isLoggedIn: false,
          error: response.ret[0]
        };
      }
    } catch (error: any) {
      return {
        isLoggedIn: false,
        error: error.message
      };
    }
  }
}

// =====================================================
// 工具函数
// =====================================================

/**
 * 解析 Cookie 字符串为对象
 */
export function parseCookie(cookieString: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  
  cookieString.split(';').forEach(pair => {
    const [key, value] = pair.trim().split('=');
    if (key && value) {
      cookies[key] = value;
    }
  });

  return cookies;
}

/**
 * 从对象生成 Cookie 字符串
 */
export function stringifyCookie(cookies: Record<string, string>): string {
  return Object.entries(cookies)
    .map(([key, value]) => `${key}=${value}`)
    .join('; ');
}

/**
 * 验证 Cookie 是否有效
 */
export function validateCookie(cookieString: string): {
  valid: boolean;
  missing: string[];
} {
  const cookies = parseCookie(cookieString);
  
  // 必需的 Cookie
  const requiredCookies = [
    '_m_h5_tk',
    '_tb_token_',
    'cookie2'
  ];

  const missing = requiredCookies.filter(key => !cookies[key]);

  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * 提取用户昵称
 */
export function extractNickFromCookie(cookieString: string): string {
  const cookies = parseCookie(cookieString);
  return cookies['_nk_'] || cookies['nick'] || cookies['lgc'] || '未知用户';
}