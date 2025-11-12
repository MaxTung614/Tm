import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Gift, Lock, AlertCircle, CheckCircle2, QrCode, Smartphone, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import QRCodeLogin from '../components/auth/QRCodeLogin';
import { 
  logError, 
  logWarning, 
  logInfo,
  ErrorCategory, 
  getErrorMessage,
  createUserFriendlyMessage,
  generateErrorId
} from '../lib/error-handler';

export default function Login() {
  const [cookieInput, setCookieInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    // 表单验证
    if (!cookieInput.trim()) {
      logWarning('Login - Cookie输入为空', {
        operation: 'cookie_login',
        reason: 'empty_cookie_input'
      });
      
      toast.error('请输入Cookie');
      return;
    }

    // 检查网络状态
    if (!navigator.onLine) {
      logWarning('Login - 网络连接已断开', {
        operation: 'cookie_login',
        networkStatus: 'offline'
      });
      
      toast.error('网络连接已断开，请检查网络设置后重试');
      return;
    }

    setIsLoading(true);
    try {
      logInfo('Login - 开始Cookie登录', {
        operation: 'cookie_login',
        timestamp: new Date().toISOString()
      });

      await login(cookieInput);
      
      logInfo('Login - Cookie登录成功', {
        operation: 'cookie_login',
        success: true,
        timestamp: new Date().toISOString()
      });

      toast.success('登录成功！');
      navigate('/');
    } catch (error: any) {
      const errorId = generateErrorId();
      
      logError(error, {
        operation: 'cookie_login',
        component: 'Login',
        errorId,
        timestamp: new Date().toISOString()
      });

      // 使用统一的错误处理生成用户友好提示
      const errorCategory = error.message?.includes('NetworkError') || error.message?.includes('网络') ? ErrorCategory.NETWORK :
                           error.message?.includes('401') ? ErrorCategory.AUTHENTICATION :
                           error.message?.includes('timeout') ? ErrorCategory.NETWORK_TIMEOUT :
                           ErrorCategory.AUTHENTICATION;
      
      const userMessage = createUserFriendlyMessage(error, errorCategory, errorId, 'handleLogin');

      toast.error(userMessage, {
        description: `错误ID: ${errorId}`,
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaste = async () => {
    try {
      if (!navigator.clipboard) {
        throw new Error('剪贴板API不可用');
      }
      
      logInfo('Login - 开始从剪贴板粘贴Cookie', {
        operation: 'paste_cookie'
      });
      
      const text = await navigator.clipboard.readText();
      setCookieInput(text);
      
      logInfo('Login - Cookie粘贴成功', {
        operation: 'paste_cookie',
        cookieLength: text.length
      });
      
      toast.success('Cookie已粘贴');
    } catch (error: any) {
      const errorId = generateErrorId();
      
      logError(error, {
        operation: 'paste_cookie',
        component: 'Login',
        errorId,
        timestamp: new Date().toISOString()
      });

      const errorCategory = ErrorCategory.CLIPBOARD_ACCESS;
      const userMessage = createUserFriendlyMessage(error, errorCategory, errorId, 'handlePaste');

      toast.error(userMessage, {
        description: `错误ID: ${errorId}`,
        duration: 5000,
      });
    }
  };

  const handleQRCodeSuccess = async (cookie: string) => {
    try {
      // 检查网络状态
      if (!navigator.onLine) {
        logWarning('Login - QR码登录时网络连接已断开', {
          operation: 'qrcode_login',
          networkStatus: 'offline'
        });
        toast.error('网络连接已断开，请检查网络设置');
        return;
      }
      
      logInfo('Login - 开始QR码登录', {
        operation: 'qrcode_login',
        timestamp: new Date().toISOString()
      });

      await login(cookie);
      
      logInfo('Login - QR码登录成功', {
        operation: 'qrcode_login',
        success: true,
        timestamp: new Date().toISOString()
      });

      toast.success('扫码登录成功！');
      navigate('/');
    } catch (error: any) {
      const errorId = generateErrorId();
      
      logError(error, {
        operation: 'qrcode_login',
        component: 'Login',
        errorId,
        timestamp: new Date().toISOString()
      });

      // 使用统一的错误处理生成用户友好提示
      const errorCategory = error.message?.includes('NetworkError') || error.message?.includes('网络') ? ErrorCategory.NETWORK :
                           error.message?.includes('401') ? ErrorCategory.AUTHENTICATION :
                           error.message?.includes('timeout') ? ErrorCategory.NETWORK_TIMEOUT :
                           ErrorCategory.AUTHENTICATION;
      
      const userMessage = createUserFriendlyMessage(error, errorCategory, errorId, 'handleQRCodeSuccess');

      toast.error(userMessage, {
        description: `错误ID: ${errorId}`,
        duration: 5000,
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-red-50 p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">
        {/* 左侧 - 品牌信息 */}
        <div className="hidden md:flex flex-col space-y-6">
          <div className="flex items-center space-x-3">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Gift className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">礼享金抢购助手</h1>
              <p className="text-gray-600">高效、安全、便捷</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">自动化抢购</h3>
                <p className="text-sm text-gray-600">毫秒级响应，抢购成功率提升10倍</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Lock className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">安全加密</h3>
                <p className="text-sm text-gray-600">AES-256加密存储，保护您的账号安全</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <QrCode className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">扫码登录</h3>
                <p className="text-sm text-gray-600">无需复制Cookie，扫码即可快速登录</p>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧 - 登录表单 */}
        <Card className="shadow-xl border-0">
          <CardHeader>
            <div className="md:hidden flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                <Gift className="w-6 h-6 text-white" />
              </div>
            </div>
            <CardTitle>登录账号</CardTitle>
            <CardDescription>
              选择扫码登录或手动输入Cookie
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="qrcode" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="qrcode" className="flex items-center space-x-2">
                  <QrCode className="w-4 h-4" />
                  <span>扫码登录</span>
                </TabsTrigger>
                <TabsTrigger value="cookie" className="flex items-center space-x-2">
                  <Lock className="w-4 h-4" />
                  <span>Cookie登录</span>
                </TabsTrigger>
              </TabsList>

              {/* 扫码登录 */}
              <TabsContent value="qrcode" className="space-y-4">
                <QRCodeLogin onSuccess={handleQRCodeSuccess} />
              </TabsContent>

              {/* Cookie登录 */}
              <TabsContent value="cookie" className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Cookie字符串
                  </label>
                  <Textarea
                    value={cookieInput}
                    onChange={(e) => setCookieInput(e.target.value)}
                    placeholder="cookie2=xxx; _m_h5_tk=xxx; _tb_token_=xxx; ..."
                    rows={6}
                    className="font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePaste}
                    className="w-full"
                  >
                    从剪贴板粘贴
                  </Button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">如何获取Cookie？</p>
                    <ol className="list-decimal list-inside space-y-1 text-xs">
                      <li>使用Chrome浏览器打开淘宝</li>
                      <li>按F12打开开发者工具</li>
                      <li>切换到Network标签页</li>
                      <li>刷新页面并复制请求中的Cookie</li>
                    </ol>
                  </div>
                </div>

                <Button
                  onClick={handleLogin}
                  disabled={isLoading || !cookieInput.trim()}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                >
                  {isLoading ? '登录中...' : '立即登录'}
                </Button>
              </TabsContent>
            </Tabs>

            <div className="text-xs text-center text-gray-500 mt-4">
              登录即表示您同意我们的服务条款和隐私政策
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}