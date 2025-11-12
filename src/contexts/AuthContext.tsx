import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../lib/api-services';
import { 
  logError, 
  logWarning, 
  logInfo,
  ErrorCategory, 
  ErrorLevel,
  getErrorMessage,
  createUserFriendlyMessage
} from '../lib/error-handler';
import { secureCookieManager } from '../lib/security';

interface User {
  id: string;
  name: string;
  avatar?: string;
  balance?: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (cookie: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 初始化时检查登录状态
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const savedCookie = secureCookieManager.getCookie();
      if (savedCookie) {
        logInfo('Auth', '检查存储的Cookie有效性');
        
        // 验证Cookie并获取用户信息
        const response = await authService.getUserInfo();
        if (response.success && response.data) {
          setUser(response.data);
          logInfo('Auth', 'Cookie验证成功，用户已登录');
        } else {
          const errorMessage = response.message || 'Cookie验证失败';
          logWarning('Auth', `存储的Cookie无效: ${errorMessage}`);
          
          // Cookie无效，清除
          secureCookieManager.clearCookie();
          logInfo('Auth', '已清除无效的Cookie');
        }
      } else {
        logInfo('Auth', '未找到存储的Cookie，需要用户登录');
      }
    } catch (error: any) {
      const errorId = Date.now().toString(36);
      console.error(`认证状态检查失败 [${errorId}]:`, error);
      
      logError('Auth', `认证状态检查异常 [${errorId}]: ${getErrorMessage(error)}`, ErrorCategory.AUTHENTICATION, error);
      
      // 清除可能存在问题的Cookie
      secureCookieManager.clearCookie();
      logInfo('Auth', '认证失败后清除Cookie');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (cookie: string) => {
    try {
      // 表单验证
      if (!cookie || cookie.trim().length === 0) {
        logWarning('Auth', '登录尝试：Cookie为空');
        throw new Error('请输入有效的Cookie信息');
      }
      
      // 检查网络连接
      if (!navigator.onLine) {
        logWarning('Auth', '登录尝试：网络未连接');
        throw new Error('网络连接异常，请检查网络设置');
      }
      
      logInfo('Auth', '开始用户登录');
      
      // 调用后端API验证Cookie并登录
      const response = await authService.loginWithCookie(cookie);
      
      if (response.success && response.data) {
        setUser(response.data.user);
        secureCookieManager.saveCookie(cookie);
        logInfo('Auth', '用户登录成功');
      } else {
        const errorMessage = response.message || '登录失败';
        logError('Auth', `登录失败: ${errorMessage}`, ErrorCategory.AUTHENTICATION, response);
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      const errorId = Date.now().toString(36);
      console.error(`登录失败 [${errorId}]:`, error);
      
      logError('Auth', `登录异常 [${errorId}]: ${getErrorMessage(error)}`, ErrorCategory.AUTHENTICATION, error);
      
      // 清除可能存储的无效Cookie
      secureCookieManager.clearCookie();
      
      let userMessage = '登录失败';
      if (error.message?.includes('NetworkError') || error.message?.includes('fetch')) {
        userMessage = '网络连接异常，请检查网络设置';
      } else if (error.message?.includes('401') || error.message?.includes('未授权')) {
        userMessage = 'Cookie无效或已过期，请重新获取';
      } else if (error.message?.includes('403') || error.message?.includes('禁止访问')) {
        userMessage = '登录权限不足，请联系管理员';
      } else if (error.message?.includes('invalid') || error.message?.includes('无效')) {
        userMessage = 'Cookie格式无效，请检查输入';
      }
      
      throw new Error(`${userMessage} (错误ID: ${errorId})`);
    }
  };

  const logout = async () => {
    try {
      logInfo('Auth', '用户登出');
      
      // 调用后端API登出
      const response = await authService.logout();
      
      if (!response.success) {
        logWarning('Auth', `登出API调用失败: ${response.message || '未知错误'}`, ErrorCategory.AUTHENTICATION);
      }
      
      logInfo('Auth', '登出成功');
    } catch (error: any) {
      const errorId = Date.now().toString(36);
      console.error(`登出失败 [${errorId}]:`, error);
      
      logError('Auth', `登出异常 [${errorId}]: ${getErrorMessage(error)}`, ErrorCategory.AUTHENTICATION, error);
      
      // 登出失败时也要清除本地状态，但要重新抛出错误让调用者知道
      throw new Error(`登出失败 (错误ID: ${errorId})`);
    } finally {
      // 无论登出API是否成功，都清除本地状态
      setUser(null);
      secureCookieManager.clearCookie();
    }
  };

  const refreshUser = async () => {
    try {
      logInfo('Auth', '刷新用户信息');
      
      const response = await authService.getUserInfo();
      
      if (response.success && response.data) {
        setUser(response.data);
        logInfo('Auth', '用户信息刷新成功');
      } else {
        const errorMessage = response.message || '刷新失败';
        logWarning('Auth', `刷新用户信息失败: ${errorMessage}`, ErrorCategory.DATA_FETCHING);
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      const errorId = Date.now().toString(36);
      console.error(`刷新用户信息失败 [${errorId}]:`, error);
      
      logError('Auth', `刷新用户信息异常 [${errorId}]: ${getErrorMessage(error)}`, ErrorCategory.DATA_FETCHING, error);
      
      // 重新抛出错误，让调用者处理
      throw new Error(`刷新用户信息失败 (错误ID: ${errorId})`);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}