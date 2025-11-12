/**
 * 演示模式登录组件
 * 当后端服务不可用时显示
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { AlertCircle, Play, Info } from 'lucide-react';
import { toast } from 'sonner';

interface DemoModeLoginProps {
  onLogin: (userData: any) => void;
}

export default function DemoModeLogin({ onLogin }: DemoModeLoginProps) {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleDemoLogin = async () => {
    setIsLoading(true);
    
    // 模拟登录延迟
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const demoUser = {
      id: 'demo_user_001',
      name: '演示用户',
      balance: 888,
      phone: '138****8888',
      avatar: null,
      token: 'demo_token_' + Date.now(),
    };
    
    // 保存到localStorage
    localStorage.setItem('user', JSON.stringify(demoUser));
    localStorage.setItem('auth_token', demoUser.token);
    
    // 调用登录回调
    onLogin(demoUser);
    
    setIsLoading(false);
    toast.success('欢迎进入演示模式！');
    navigate('/');
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
            <Play className="w-5 h-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl">演示模式</CardTitle>
            <CardDescription>体验完整功能无需后端服务</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 提示信息 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-2 text-sm text-blue-900">
              <p className="font-medium">欢迎使用演示模式</p>
              <p>当前后端服务未运行，您可以：</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>查看完整的用户界面</li>
                <li>体验所有交互功能</li>
                <li>浏览模拟数据展示</li>
                <li>测试抢购流程演示</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 演示模式限制说明 */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-1 text-sm text-amber-900">
              <p className="font-medium">演示模式限制</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>使用模拟数据，不会实际抢购</li>
                <li>无法连接真实淘宝账号</li>
                <li>数据不会持久化保存</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 如何启用完整功能 */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="space-y-2 text-sm text-gray-700">
            <p className="font-medium text-gray-900">启用完整功能：</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>启动后端服务：<code className="bg-gray-200 px-1.5 py-0.5 rounded text-xs">start_backend.bat</code></li>
              <li>等待服务启动完成</li>
              <li>刷新此页面</li>
              <li>使用扫码或Cookie登录</li>
            </ol>
          </div>
        </div>

        {/* 演示登录按钮 */}
        <Button
          onClick={handleDemoLogin}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          size="lg"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              进入演示模式...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              进入演示模式
            </>
          )}
        </Button>
        
        {/* 帮助信息 */}
        <p className="text-xs text-center text-gray-500">
          演示账号：demo_user_001 | 余额：888淘金币
        </p>
      </CardContent>
    </Card>
  );
}
