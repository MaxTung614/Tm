import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  Smartphone,
  Loader2,
  CheckCircle2,
  Copy,
  AlertCircle,
  Zap,
  Code,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export default function ExtractParams() {
  const [step, setStep] = useState(1);
  const [isExtracting, setIsExtracting] = useState(false);
  const [params, setParams] = useState<any>(null);
  const [showParams, setShowParams] = useState(false);
  const [manualUmidToken, setManualUmidToken] = useState('');
  const [manualUa, setManualUa] = useState('');

  // 自动检测设备
  const detectDevice = () => {
    const ua = navigator.userAgent;
    const platform = navigator.platform;
    const vendor = navigator.vendor;
    
    let deviceName = '未知设备';
    let deviceModel = '未知型号';
    
    if (/iPhone/.test(ua)) {
      deviceName = 'iPhone';
      const match = ua.match(/iPhone OS (\d+_\d+)/);
      if (match) {
        deviceModel = `iOS ${match[1].replace('_', '.')}`;
      }
    } else if (/iPad/.test(ua)) {
      deviceName = 'iPad';
    } else if (/Android/.test(ua)) {
      deviceName = 'Android';
      const match = ua.match(/Android (\d+\.\d+)/);
      if (match) {
        deviceModel = `Android ${match[1]}`;
      }
    } else if (/Windows/.test(ua)) {
      deviceName = 'Windows PC';
      deviceModel = 'Windows';
    } else if (/Mac/.test(ua)) {
      deviceName = 'Mac';
      deviceModel = 'macOS';
    }
    
    return { deviceName, deviceModel, ua, platform, vendor };
  };

  // 自动提取参数
  const handleAutoExtract = async () => {
    setIsExtracting(true);
    
    try {
      // 1. 检测设备
      const deviceInfo = detectDevice();
      toast.success(`检测到设备：${deviceInfo.deviceName}`);
      
      // 2. 提取 umidToken (从 cookies)
      await new Promise(resolve => setTimeout(resolve, 500));
      const umidToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('_m_h5_tk='))
        ?.split('=')[1] || '';
      
      if (!umidToken) {
        toast.warning('未找到 umidToken，请手动输入或先登录');
      }
      
      // 3. 提取 ua
      const ua = deviceInfo.ua;
      
      // 4. 固定的 asac
      const asac = '2A21B24LA1SI0HB0EEVN03';
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 5. 组装参数
      const extractedParams = {
        umidToken: umidToken || '',
        ua: ua,
        asac: asac,
        deviceInfo: {
          name: deviceInfo.deviceName,
          model: deviceInfo.deviceModel,
          platform: deviceInfo.platform,
          vendor: deviceInfo.vendor
        },
        extractedAt: new Date().toLocaleString('zh-CN')
      };
      
      setParams(extractedParams);
      setStep(2);
      
      toast.success('参数提取成功！');
    } catch (error: any) {
      console.error('提取失败:', error);
      toast.error('自动提取失败，请尝试手动输入');
    } finally {
      setIsExtracting(false);
    }
  };

  // 手动保存参数
  const handleManualSave = () => {
    if (!manualUmidToken || !manualUa) {
      toast.error('请填写完整的参数');
      return;
    }
    
    const deviceInfo = detectDevice();
    
    const manualParams = {
      umidToken: manualUmidToken,
      ua: manualUa,
      asac: '2A21B24LA1SI0HB0EEVN03',
      deviceInfo: {
        name: deviceInfo.deviceName,
        model: deviceInfo.deviceModel,
        platform: deviceInfo.platform,
        vendor: deviceInfo.vendor
      },
      extractedAt: new Date().toLocaleString('zh-CN'),
      method: 'manual'
    };
    
    setParams(manualParams);
    setStep(2);
    toast.success('参数已保存！');
  };

  // 复制参数
  const handleCopy = () => {
    const configText = JSON.stringify(params, null, 2);
    navigator.clipboard.writeText(configText);
    toast.success('已复制到剪贴板！');
  };

  // 保存到系统
  const handleSaveToSystem = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/risk-params', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          umidToken: params.umidToken,
          ua: params.ua,
          asac: params.asac
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('参数已保存到系统！');
        setStep(3);
      } else {
        throw new Error(data.message || '保存失败');
      }
    } catch (error: any) {
      console.error('保存失败:', error);
      toast.error(error.message || '保存失败');
    }
  };

  // 显示浏览器控制台代码
  const consoleCode = `// 复制这段代码到浏览器控制台运行
(function() {
  const umidToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('_m_h5_tk='))
    ?.split('=')[1] || 'not found';
  
  const ua = navigator.userAgent;
  
  const config = {
    umidToken: umidToken,
    ua: ua,
    asac: '2A21B24LA1SI0HB0EEVN03',
    deviceInfo: {
      platform: navigator.platform,
      vendor: navigator.vendor
    }
  };
  
  console.log('='.repeat(50));
  console.log('风控参数：');
  console.log('='.repeat(50));
  console.log(JSON.stringify(config, null, 2));
  console.log('='.repeat(50));
  
  copy(JSON.stringify(config, null, 2));
  console.log('✅ 已复制到剪贴板！');
})();`;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 头部 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">🔧 风控参数提取工具</h1>
        <p className="text-sm text-gray-600 mt-1">快速提取设备风控参数，支持自动检测和手动输入</p>
      </div>

      {/* 步骤指示 */}
      <div className="flex items-center justify-center space-x-4">
        <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-orange-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-orange-600 text-white' : 'bg-gray-200'}`}>
            1
          </div>
          <span className="text-sm">提取参数</span>
        </div>
        <div className="w-12 h-0.5 bg-gray-200"></div>
        <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-orange-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-orange-600 text-white' : 'bg-gray-200'}`}>
            2
          </div>
          <span className="text-sm">确认保存</span>
        </div>
        <div className="w-12 h-0.5 bg-gray-200"></div>
        <div className={`flex items-center space-x-2 ${step >= 3 ? 'text-green-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
            {step >= 3 ? <CheckCircle2 className="w-5 h-5" /> : '3'}
          </div>
          <span className="text-sm">完成</span>
        </div>
      </div>

      {/* 步骤 1: 提取参数 */}
      {step === 1 && (
        <>
          {/* 自动提取 */}
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-orange-600" />
                <CardTitle className="text-base">方法 1：自动提取（推荐）⭐</CardTitle>
              </div>
              <CardDescription>
                5秒快速提取，无需手动操作
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleAutoExtract}
                disabled={isExtracting}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    正在提取...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    一键自动提取
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* 浏览器控制台提取 */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Code className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-base">方法 2：浏览器控制台提取</CardTitle>
              </div>
              <CardDescription>
                适合自动提取失败时使用
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-gray-700 space-y-2">
                <p>1. 按 <Badge variant="secondary">F12</Badge> 打开开发者工具</p>
                <p>2. 切换到 <Badge variant="secondary">Console</Badge> 标签</p>
                <p>3. 复制下面的代码，粘贴到控制台运行</p>
              </div>
              
              <div className="relative">
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
                  {consoleCode}
                </pre>
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(consoleCode);
                    toast.success('代码已复制！');
                  }}
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2 text-white hover:bg-gray-800"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 手动输入 */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Smartphone className="w-5 h-5 text-purple-600" />
                <CardTitle className="text-base">方法 3：手动输入</CardTitle>
              </div>
              <CardDescription>
                如果已经通过其他方式获取了参数
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  umidToken
                </label>
                <input
                  type="text"
                  value={manualUmidToken}
                  onChange={(e) => setManualUmidToken(e.target.value)}
                  placeholder="T2gArl5MCqpJaBLQXh3b0Xps..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  ua
                </label>
                <input
                  type="text"
                  value={manualUa}
                  onChange={(e) => setManualUa(e.target.value)}
                  placeholder="140#nmuoUceczzPKwQo2+bsbK3N..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              
              <Button
                onClick={handleManualSave}
                className="w-full"
                variant="outline"
              >
                保存参数
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {/* 步骤 2: 确认参数 */}
      {step === 2 && params && (
        <Card>
          <CardHeader>
            <CardTitle>提取结果</CardTitle>
            <CardDescription>
              请确认以下参数是否正确
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 参数显示 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">umidToken:</span>
                <div className="flex items-center space-x-2">
                  {params.umidToken ? (
                    <Badge className="bg-green-600">✓ 已提取</Badge>
                  ) : (
                    <Badge variant="destructive">✗ 未提取</Badge>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">ua:</span>
                <Badge className="bg-green-600">✓ 已提取</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">asac:</span>
                <Badge className="bg-green-600">✓ 已配置</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">设备:</span>
                <span className="text-sm text-gray-600">{params.deviceInfo?.name || '未知'}</span>
              </div>
            </div>

            {/* 详细参数 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">完整配置：</span>
                <Button
                  onClick={() => setShowParams(!showParams)}
                  size="sm"
                  variant="ghost"
                >
                  {showParams ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              
              {showParams && (
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
                  {JSON.stringify(params, null, 2)}
                </pre>
              )}
            </div>

            {/* 警告 */}
            {!params.umidToken && (
              <Alert>
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>
                  未检测到 umidToken，建议先登录后再提取，或手动输入
                </AlertDescription>
              </Alert>
            )}

            {/* 操作按钮 */}
            <div className="flex space-x-3">
              <Button
                onClick={() => setStep(1)}
                variant="outline"
                className="flex-1"
              >
                重新提取
              </Button>
              
              <Button
                onClick={handleCopy}
                variant="outline"
                className="flex-1"
              >
                <Copy className="w-4 h-4 mr-2" />
                复制配置
              </Button>
              
              <Button
                onClick={handleSaveToSystem}
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              >
                保存到系统
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 步骤 3: 完成 */}
      {step === 3 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900">参数保存成功！</h3>
              <p className="text-sm text-gray-600 mt-1">
                风控参数已保存到系统，现在可以开始使用了
              </p>
            </div>
            
            <div className="flex space-x-3 justify-center">
              <Button
                onClick={() => window.location.href = '/'}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              >
                前往红包中心
              </Button>
              
              <Button
                onClick={() => {
                  setStep(1);
                  setParams(null);
                  setManualUmidToken('');
                  setManualUa('');
                }}
                variant="outline"
              >
                再次提取
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 说明卡片 */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-blue-600" />
            使用说明
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-700 space-y-2">
          <div>💡 <strong>推荐方法：</strong>使用"一键自动提取"，5秒完成</div>
          <div>📱 <strong>设备要求：</strong>所有账号必须使用同一设备扫码登录</div>
          <div>🔄 <strong>更新周期：</strong>umidToken 每 7-30 天更新一次即可</div>
          <div>⚠️ <strong>重要：</strong>如果自动提取失败，请先登录后再尝试</div>
        </CardContent>
      </Card>
    </div>
  );
}
