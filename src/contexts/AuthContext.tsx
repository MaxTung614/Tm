import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../lib/api-services';

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
      const savedCookie = localStorage.getItem('tmall_cookie');
      if (savedCookie) {
        // 验证Cookie并获取用户信息
        const response = await authService.getUserInfo();
        if (response.success && response.data) {
          setUser(response.data);
        } else {
          // Cookie无效，清除
          localStorage.removeItem('tmall_cookie');
        }
      }
    } catch (error) {
      console.error('检查登录状态失败:', error);
      localStorage.removeItem('tmall_cookie');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (cookie: string) => {
    try {
      // 调用后端API验证Cookie并登录
      const response = await authService.loginWithCookie(cookie);
      
      if (response.success && response.data) {
        setUser(response.data.user);
        localStorage.setItem('tmall_cookie', cookie);
      } else {
        throw new Error(response.message || '登录失败');
      }
    } catch (error: any) {
      console.error('登录失败:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // 调用后端API登出
      await authService.logout();
    } catch (error) {
      console.error('登出失败:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('tmall_cookie');
    }
  };

  const refreshUser = async () => {
    try {
      const response = await authService.getUserInfo();
      if (response.success && response.data) {
        setUser(response.data);
      }
    } catch (error) {
      console.error('刷新用户信息失败:', error);
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