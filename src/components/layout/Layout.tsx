import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { 
  Gift, 
  ListTodo, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Wallet,
  User,
  Users
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: '红包中心', href: '/', icon: Gift },
    { name: '任务管理', href: '/tasks', icon: ListTodo },
    { name: '账号管理', href: '/accounts', icon: Users },
    { name: '设置', href: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    toast.success('已退出登录');
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                <Gift className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="font-bold text-gray-900">礼享金助手</h1>
                <p className="text-xs text-gray-500">智能抢购系统</p>
              </div>
            </div>

            {/* 桌面端导航 */}
            <nav className="hidden md:flex items-center space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`
                      flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors
                      ${active 
                        ? 'bg-orange-50 text-orange-600' 
                        : 'text-gray-600 hover:bg-gray-100'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* 用户信息 */}
            <div className="flex items-center space-x-4">
              {/* 余额显示 */}
              <div className="hidden sm:flex items-center space-x-2 bg-gradient-to-r from-orange-50 to-red-50 px-4 py-2 rounded-lg border border-orange-200">
                <Wallet className="w-4 h-4 text-orange-600" />
                <div className="text-sm">
                  <div className="text-xs text-gray-600">余额</div>
                  <div className="font-bold text-orange-600">{user?.balance || 0}</div>
                </div>
              </div>

              {/* 用户菜单 */}
              <div className="hidden sm:flex items-center space-x-2">
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span className="text-sm">{user?.name || '用户'}</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleLogout}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>

              {/* 移动端菜单按钮 */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* 移动端菜单 */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-4 space-y-2">
              {/* 余额显示 (移动端) */}
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200 mb-4">
                <div className="flex items-center space-x-2">
                  <Wallet className="w-5 h-5 text-orange-600" />
                  <div>
                    <div className="text-xs text-gray-600">余额</div>
                    <div className="font-bold text-orange-600">{user?.balance || 0}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-700">{user?.name || '用户'}</span>
                </div>
              </div>

              {/* 导航菜单 */}
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`
                      flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors
                      ${active 
                        ? 'bg-orange-50 text-orange-600' 
                        : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}

              {/* 退出登录 */}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>退出登录</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 主内容区域 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* 底部信息 */}
      <footer className="border-t border-gray-200 bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>© 2025 礼享金抢购助手 - 高效、安全、便捷</p>
          </div>
        </div>
      </footer>
    </div>
  );
}