import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Gift, Lock, AlertCircle, CheckCircle2, QrCode, Smartphone, RefreshCw } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import QRCodeLogin from '../components/auth/QRCodeLogin';

export default function Login() {
  const [cookieInput, setCookieInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!cookieInput.trim()) {
      toast.error('请输入Cookie');
      return;
    }

    setIsLoading(true);
    try {
      await login(cookieInput);
      toast.success('登录成功！');
      navigate('/');
    } catch (error) {
      toast.error('登录失败，请检查Cookie是否正确');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setCookieInput(text);
      toast.success('Cookie已粘贴');
    } catch (error) {
      toast.error('粘贴失败，请手动输入');
    }
  };

  const handleQRCodeSuccess = async (cookie: string) => {
    try {
      await login(cookie);
      toast.success('扫码登录成功！');
      navigate('/');
    } catch (error) {
      toast.error('登录失败，请重试');
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