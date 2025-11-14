import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Gift, Lock, User } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 检查 Supabase 是否配置
    if (!supabase) {
      toast.error('Supabase 未配置，请先配置环境变量');
      return;
    }
    
    if (!email.trim() || !password.trim()) {
      toast.error('请输入邮箱和密码');
      return;
    }

    // 简单的邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('请输入有效的邮箱地址');
      return;
    }

    setIsLoading(true);
    try {
      const success = await login(email, password);
      
      if (success) {
        toast.success('登录成功！');
        navigate('/');
      } else {
        toast.error('邮箱或密码错误，请检查后重试');
      }
    } catch (error: any) {
      console.error('登录错误:', error);
      toast.error(error.message || '登录失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-red-50 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-center">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Gift className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="text-center">
              <CardTitle>礼享金抢购助手</CardTitle>
              <CardDescription>
                使用 Supabase 账号登录
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm">邮箱</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your-email@example.com"
                    className="pl-10"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm">密码</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="输入密码"
                    className="pl-10"
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                <p className="font-medium mb-1">📝 如何创建账号：</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>访问 Supabase Dashboard</li>
                  <li>Authentication → Users → Add User</li>
                  <li>输入邮箱和密码，勾选 Auto Confirm</li>
                  <li>使用该邮箱密码登录</li>
                </ol>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              >
                {isLoading ? '登录中...' : '立即登录'}
              </Button>
            </form>

            <div className="text-xs text-center text-muted-foreground mt-4">
              登录即表示您同意我们的服务条款和隐私政策
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}