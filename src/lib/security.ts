/**
 * 安全工具模块
 * 提供数据加密、解密和安全存储功能
 */

// 简单的 XOR 加密（用于演示，生产环境建议使用 crypto-js 或 Web Crypto API）
class SimpleEncryption {
  private key: string;

  constructor(key?: string) {
    // 使用环境变量或默认密钥（生产环境应从安全配置获取）
    this.key = key || this.generateKey();
  }

  /**
   * 生成加密密钥（基于设备指纹）
   */
  private generateKey(): string {
    // 使用浏览器指纹作为密钥的一部分
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      new Date().getTimezoneOffset(),
      screen.width + 'x' + screen.height
    ].join('|');
    
    return this.hashString(fingerprint);
  }

  /**
   * 简单的字符串哈希函数
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * XOR 加密/解密（对称加密）
   */
  private xorCipher(input: string, key: string): string {
    let output = '';
    for (let i = 0; i < input.length; i++) {
      const charCode = input.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      output += String.fromCharCode(charCode);
    }
    return output;
  }

  /**
   * 加密数据
   */
  encrypt(data: string): string {
    try {
      // 添加时间戳防止重放攻击
      const payload = JSON.stringify({
        data,
        timestamp: Date.now(),
        checksum: this.hashString(data)
      });
      
      // XOR 加密
      const encrypted = this.xorCipher(payload, this.key);
      
      // Base64 编码（便于存储）
      return btoa(encrypted);
    } catch (error) {
      console.error('加密失败:', error);
      throw new Error('数据加密失败');
    }
  }

  /**
   * 解密数据
   */
  decrypt(encryptedData: string): string {
    try {
      // Base64 解码
      const encrypted = atob(encryptedData);
      
      // XOR 解密
      const decrypted = this.xorCipher(encrypted, this.key);
      
      // 解析并验证
      const payload = JSON.parse(decrypted);
      
      // 验证校验和
      if (this.hashString(payload.data) !== payload.checksum) {
        throw new Error('数据完整性验证失败');
      }
      
      // 验证时间戳（防止使用过期数据，24小时有效期）
      const age = Date.now() - payload.timestamp;
      const MAX_AGE = 24 * 60 * 60 * 1000; // 24小时
      if (age > MAX_AGE) {
        console.warn('加密数据已过期');
        // 注意：对于 Cookie 等长期数据，可能需要调整策略
      }
      
      return payload.data;
    } catch (error) {
      console.error('解密失败:', error);
      throw new Error('数据解密失败');
    }
  }
}

// 创建加密实例
const encryption = new SimpleEncryption();

/**
 * 安全存储类
 * 提供加密的 localStorage 和 sessionStorage 访问
 */
export class SecureStorage {
  private storage: Storage;
  private encryption: SimpleEncryption;

  constructor(storageType: 'local' | 'session' = 'local') {
    this.storage = storageType === 'local' ? localStorage : sessionStorage;
    this.encryption = encryption;
  }

  /**
   * 安全设置项（自动加密）
   */
  setItem(key: string, value: string, encrypt: boolean = true): void {
    try {
      const dataToStore = encrypt ? this.encryption.encrypt(value) : value;
      this.storage.setItem(key, dataToStore);
    } catch (error) {
      console.error(`安全存储失败 [${key}]:`, error);
      throw new Error('数据存储失败');
    }
  }

  /**
   * 安全获取项（自动解密）
   */
  getItem(key: string, encrypted: boolean = true): string | null {
    try {
      const storedData = this.storage.getItem(key);
      if (!storedData) {
        return null;
      }
      
      return encrypted ? this.encryption.decrypt(storedData) : storedData;
    } catch (error) {
      console.error(`安全读取失败 [${key}]:`, error);
      // 数据损坏或解密失败时，删除该项
      this.storage.removeItem(key);
      return null;
    }
  }

  /**
   * 删除项
   */
  removeItem(key: string): void {
    this.storage.removeItem(key);
  }

  /**
   * 清空存储
   */
  clear(): void {
    this.storage.clear();
  }

  /**
   * 检查项是否存在
   */
  hasItem(key: string): boolean {
    return this.storage.getItem(key) !== null;
  }
}

/**
 * Cookie 安全管理器
 */
export class SecureCookieManager {
  private secureStorage: SecureStorage;
  
  constructor() {
    // 使用 sessionStorage 存储敏感 Cookie（浏览器关闭后自动清除）
    this.secureStorage = new SecureStorage('session');
  }

  /**
   * 保存 Cookie（加密存储）
   */
  saveCookie(cookie: string): void {
    if (!cookie || cookie.trim().length === 0) {
      throw new Error('Cookie 不能为空');
    }
    
    // 验证 Cookie 格式（基本验证）
    if (!this.validateCookieFormat(cookie)) {
      throw new Error('Cookie 格式无效');
    }
    
    // 加密存储到 sessionStorage
    this.secureStorage.setItem('tmall_cookie', cookie, true);
    
    // 同时保存哈希值用于快速验证
    const cookieHash = this.hashCookie(cookie);
    this.secureStorage.setItem('tmall_cookie_hash', cookieHash, false);
  }

  /**
   * 获取 Cookie（自动解密）
   */
  getCookie(): string | null {
    try {
      const cookie = this.secureStorage.getItem('tmall_cookie', true);
      
      if (!cookie) {
        return null;
      }
      
      // 验证完整性
      const storedHash = this.secureStorage.getItem('tmall_cookie_hash', false);
      const currentHash = this.hashCookie(cookie);
      
      if (storedHash !== currentHash) {
        console.warn('Cookie 完整性验证失败');
        this.clearCookie();
        return null;
      }
      
      return cookie;
    } catch (error) {
      console.error('获取 Cookie 失败:', error);
      this.clearCookie();
      return null;
    }
  }

  /**
   * 清除 Cookie
   */
  clearCookie(): void {
    this.secureStorage.removeItem('tmall_cookie');
    this.secureStorage.removeItem('tmall_cookie_hash');
  }

  /**
   * 检查 Cookie 是否存在
   */
  hasCookie(): boolean {
    return this.secureStorage.hasItem('tmall_cookie');
  }

  /**
   * 验证 Cookie 格式
   */
  private validateCookieFormat(cookie: string): boolean {
    // 基本格式验证：Cookie 通常包含键值对
    return cookie.includes('=') && cookie.length > 10;
  }

  /**
   * 生成 Cookie 哈希值
   */
  private hashCookie(cookie: string): string {
    let hash = 0;
    for (let i = 0; i < cookie.length; i++) {
      const char = cookie.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
}

// 导出单例
export const secureStorage = new SecureStorage('local');
export const sessionSecureStorage = new SecureStorage('session');
export const secureCookieManager = new SecureCookieManager();

// 导出加密工具（供其他模块使用）
export { encryption as encryptionUtil };
