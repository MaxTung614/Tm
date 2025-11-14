import { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { RefreshCw, Smartphone, CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { authService } from '../../lib/api-services';
import QRCode from 'qrcode';

interface QRCodeLoginProps {
  onSuccess: (cookie: string) => void;
}

type QRCodeStatus = 'loading' | 'ready' | 'scanned' | 'confirmed' | 'expired' | 'error';

export default function QRCodeLogin({ onSuccess }: QRCodeLoginProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [qrCodeId, setQrCodeId] = useState<string>('');
  const [status, setStatus] = useState<QRCodeStatus>('loading');
  const [countdown, setCountdown] = useState(180); // 3分钟倒计时
  const [errorMessage, setErrorMessage] = useState<string>('');
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // 生成二维码
  const generateQRCode = async () => {
    setStatus('loading');
    setCountdown(180);
    setErrorMessage('');
    
    try {
      // 调用后端API生成二维码URL
      const response = await authService.generateQRCode();
      
      if (response.success && response.data) {
        const { qrCodeUrl: url, qrCodeId: id } = response.data;
        
        // 使用 qrcode 库将 URL 转换为二维码图片
        const qrDataUrl = await QRCode.toDataURL(url, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        
        setQrCodeDataUrl(qrDataUrl);
        setQrCodeUrl(url);
        setQrCodeId(id);
        setStatus('ready');
        
        // 开始轮询检查扫码状态
        startPolling(id);
        
        // 开始倒计时
        startCountdown();
        
        toast.success('二维码已生成，请使用手机淘宝扫码登录');
      } else {
        throw new Error(response.message || '生成二维码失败');
      }
    } catch (error: any) {
      console.error('生成二维码失败:', error);
      setStatus('error');
      setErrorMessage(error.message || '生成二维码失败，请检查后端服务');
      toast.error(error.message || '生成二维码失败');
    }
  };

  // 轮询检查扫码状态
  const startPolling = (qrId: string) => {
    stopPolling(); // 先清除之前的轮询
    
    pollingRef.current = setInterval(async () => {
      try {
        // 调用真实后端API检查扫码状态
        const response = await authService.checkQRCode(qrId);
        
        // 🔍 调试日志：打印完整响应
        console.log('[前端] 检查状态响应:', JSON.stringify(response, null, 2));
        
        if (response.success && response.data) {
          const { status: qrStatus, cookie } = response.data;
          
          // 🔍 调试日志：打印当前状态
          console.log('[前端] 当前状态:', qrStatus, '| Cookie长度:', cookie?.length || 0);
          
          if (qrStatus === 'scanned') {
            setStatus('scanned');
            toast.info('检测到扫码，请在手机上确认登录');
          } else if (qrStatus === 'confirmed' && cookie) {
            setStatus('confirmed');
            stopPolling();
            stopCountdown();
            
            // 延迟后回调登录成功
            setTimeout(() => {
              onSuccess(cookie);
            }, 500);
          } else if (qrStatus === 'expired') {
            setStatus('expired');
            stopPolling();
            stopCountdown();
            toast.error('二维码已过期');
          }
          // 如果是 waiting，不做任何操作，继续轮询
        }
      } catch (error: any) {
        console.error('轮询检查失败:', error);
        // 继续轮询，不中断
      }
    }, 2000); // 每2秒检查一次
  };

  // 倒计时
  const startCountdown = () => {
    stopCountdown();
    
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setStatus('expired');
          stopPolling();
          stopCountdown();
          toast.error('二维码已过期，请刷新重试');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // 停止轮询
  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  // 停止倒计时
  const stopCountdown = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  };

  // 刷新二维码
  const handleRefresh = () => {
    stopPolling();
    stopCountdown();
    generateQRCode();
  };

  // 组件挂载时生成二维码
  useEffect(() => {
    generateQRCode();
    
    // 组件卸载时清理
    return () => {
      stopPolling();
      stopCountdown();
    };
  }, []);

  // 格式化倒计时显示
  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center space-y-4 py-4">
      {/* 二维码显示区域 */}
      <div className="relative">
        <div className="w-64 h-64 bg-white border-4 border-gray-200 rounded-xl flex items-center justify-center overflow-hidden">
          {status === 'loading' && (
            <div className="flex flex-col items-center space-y-3">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
              <p className="text-sm text-gray-600">生成中...</p>
            </div>
          )}

          {(status === 'ready' || status === 'scanned') && qrCodeDataUrl && (
            <img 
              src={qrCodeDataUrl} 
              alt="登录二维码" 
              className="w-full h-full object-contain p-4"
            />
          )}

          {status === 'confirmed' && (
            <div className="flex flex-col items-center space-y-3 text-green-600">
              <CheckCircle2 className="w-16 h-16" />
              <p className="font-medium">扫码成功</p>
            </div>
          )}

          {status === 'expired' && (
            <div className="flex flex-col items-center space-y-3 text-gray-400">
              <XCircle className="w-16 h-16" />
              <p className="font-medium">二维码已过期</p>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center space-y-3 text-red-600 p-4">
              <XCircle className="w-16 h-16" />
              <p className="font-medium">生成失败</p>
            </div>
          )}
        </div>

        {/* 扫码成功遮罩 */}
        {status === 'scanned' && (
          <div className="absolute inset-0 bg-green-500 bg-opacity-90 rounded-xl flex flex-col items-center justify-center text-white">
            <Smartphone className="w-12 h-12 mb-2 animate-bounce" />
            <p className="font-medium">已扫码</p>
            <p className="text-sm">请在手机上确认</p>
          </div>
        )}
      </div>

      {/* 状态说明 */}
      <div className="text-center space-y-2">
        {status === 'loading' && (
          <p className="text-sm text-gray-600">正在生成二维码...</p>
        )}

        {(status === 'ready' || status === 'scanned') && (
          <>
            <div className="flex items-center justify-center space-x-2 text-orange-600">
              <Smartphone className="w-4 h-4" />
              <p className="font-medium">
                {status === 'ready' ? '请使用淘宝App扫码' : '已扫码，请在手机上确认'}
              </p>
            </div>
            <p className="text-xs text-gray-500">
              有效期: {formatCountdown(countdown)}
            </p>
          </>
        )}

        {status === 'confirmed' && (
          <p className="text-sm text-green-600 font-medium">登录成功，正在跳转...</p>
        )}

        {(status === 'expired' || status === 'error') && (
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            className="mt-2"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新二维码
          </Button>
        )}
      </div>

      {/* 错误信息 */}
      {status === 'error' && errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 w-full">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-800">
              <p className="font-medium mb-1">连接失败</p>
              <p className="text-xs">{errorMessage}</p>
              <p className="text-xs mt-2">请确保：</p>
              <ul className="text-xs list-disc list-inside mt-1 space-y-0.5">
                <li>后端服务已启动</li>
                <li>API地址配置正确</li>
                <li>网络连接正常</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 使用说明 */}
      {(status === 'ready' || status === 'scanned') && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 w-full">
          <div className="text-sm text-blue-800 space-y-2">
            <p className="font-medium">📱 扫码登录步骤：</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>打开手机淘宝 App</li>
              <li>点击首页右上角"扫一扫"</li>
              <li>扫描上方二维码</li>
              <li>在手机上确认登录</li>
              <li>系统将自动获取您的账号信息</li>
            </ol>
          </div>
        </div>
      )}

      {/* 提示信息 */}
      <div className="text-xs text-gray-500 text-center">
        基于 TSDK 开源方案实现，安全可靠
      </div>
    </div>
  );
}