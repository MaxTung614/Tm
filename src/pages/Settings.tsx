import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Textarea } from '../components/ui/textarea';
import { Separator } from '../components/ui/separator';
import { 
  Save, 
  Download, 
  Bell, 
  RefreshCw, 
  Shield, 
  Loader2, 
  Cookie, 
  CheckCircle2, 
  AlertCircle,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { settingsService } from '../lib/api-services';
import { 
  logError, 
  logWarning, 
  logInfo,
  ErrorCategory, 
  ErrorLevel,
  getErrorMessage,
  createUserFriendlyMessage,
  generateErrorId
} from '../lib/error-handler';
import { safeFetch } from '../lib/network-interceptor';

interface Settings {
  notifications: {
    grabSuccess: boolean;
    grabFailed: boolean;
    taskComplete: boolean;
  };
  autoRefresh: {
    enabled: boolean;
    interval: number;
  };
  advanced: {
    maxRetries: number;
    timeout: number;
  };
}

export default function Settings() {
  const { user, refreshUser, logout } = useAuth();
  const [cookieInput, setCookieInput] = useState('');
  const [settings, setSettings] = useState<Settings>({
    notifications: {
      grabSuccess: true,
      grabFailed: true,
      taskComplete: true,
    },
    autoRefresh: {
      enabled: true,
      interval: 30,
    },
    advanced: {
      maxRetries: 3,
      timeout: 10,
    },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingCookie, setIsUpdatingCookie] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  // 加载设置
  const loadSettings = async () => {
    const functionName = 'loadSettings';
    const errorId = generateErrorId();
    setIsLoading(true);
    
    try {
      logInfo(`[${functionName}] 开始加载用户设置`, { errorId });
      
      // 检查网络连接状态
      if (!navigator.onLine) {
        const error = new Error('网络连接不可用，请检查网络设置');
        throw error;
      }
      
      const response = await settingsService.getSettings();
      
      if (response.success && response.data) {
        // 合并服务器返回的设置和默认设置
        setSettings({
          notifications: response.data.notifications || {
            grabSuccess: true,
            grabFailed: true,
            taskComplete: true,
          },
          autoRefresh: response.data.autoRefresh || {
            enabled: true,
            interval: 30,
          },
          advanced: response.data.advanced || {
            maxRetries: 3,
            timeout: 10,
          },
        });
        logInfo(`[${functionName}] 设置加载成功`, { 
          hasNotifications: !!response.data.notifications,
          hasAutoRefresh: !!response.data.autoRefresh,
          hasAdvanced: !!response.data.advanced,
          errorId 
        });
      } else {
        const errorMessage = response.message || '加载设置失败';
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      let errorCategory = ErrorCategory.DATA_FETCHING;
      let errorMessage = getErrorMessage(error);
      
      // 根据错误类型进行分类
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorCategory = ErrorCategory.NETWORK;
        errorMessage = '网络连接失败，请检查后端服务是否启动';
      } else if (error.message.includes('网络连接不可用')) {
        errorCategory = ErrorCategory.NETWORK;
      } else if (error.message.includes('401') || error.message.includes('未授权')) {
        errorCategory = ErrorCategory.AUTHENTICATION;
        errorMessage = '登录状态已过期，请重新登录';
      } else if (error.message.includes('403') || error.message.includes('禁止访问')) {
        errorCategory = ErrorCategory.AUTHORIZATION;
        errorMessage = '权限不足，无法加载设置';
      }
      
      logError(`[${functionName}] 加载用户设置失败`, { 
        error: error.message,
        stack: error.stack,
        errorCategory,
        errorId 
      });
      
      const userMessage = createUserFriendlyMessage(error, errorCategory, errorId);
      toast.error(userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 保存设置
  const handleSaveSettings = async () => {
    const functionName = 'handleSaveSettings';
    const errorId = generateErrorId();
    setIsSaving(true);
    
    try {
      logInfo(`[${functionName}] 开始保存用户设置`, { errorId });
      
      // 检查网络连接状态
      if (!navigator.onLine) {
        const error = new Error('网络连接不可用，请检查网络设置');
        throw error;
      }
      
      const response = await settingsService.updateSettings(settings);
      
      if (response.success) {
        logInfo(`[${functionName}] 设置保存成功`, { 
          settingsCount: Object.keys(settings).length,
          hasNotifications: !!settings.notifications,
          hasAutoRefresh: !!settings.autoRefresh,
          errorId 
        });
        
        toast.success('设置保存成功');
        
        // 重新加载设置以确保同步
        logInfo(`[${functionName}] 重新加载设置以确保数据同步`, { errorId });
        await loadSettings();
      } else {
        const errorMessage = response.message || '保存设置失败';
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      let errorCategory = ErrorCategory.DATA_SAVE;
      let errorMessage = getErrorMessage(error);
      
      // 根据错误类型进行分类
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorCategory = ErrorCategory.NETWORK;
        errorMessage = '网络连接失败，请检查后端服务是否启动';
      } else if (error.message.includes('网络连接不可用')) {
        errorCategory = ErrorCategory.NETWORK;
      } else if (error.message.includes('401') || error.message?.includes('未授权')) {
        errorCategory = ErrorCategory.AUTHENTICATION;
        errorMessage = '登录状态已过期，请重新登录';
      } else if (error.message.includes('403') || error.message?.includes('禁止访问')) {
        errorCategory = ErrorCategory.AUTHORIZATION;
        errorMessage = '权限不足，无法保存设置';
      }
      
      logError(`[${functionName}] 保存用户设置失败`, { 
        error: error.message,
        stack: error.stack,
        errorCategory,
        errorId 
      });
      
      const userMessage = createUserFriendlyMessage(error, errorCategory, errorId);
      toast.error(userMessage);
    } finally {
      setIsSaving(false);
    }
  };

  // 更新Cookie
  const handleUpdateCookie = async () => {
    const functionName = 'handleUpdateCookie';
    const errorId = generateErrorId();
    setIsUpdatingCookie(true);
    
    try {
      logInfo(`[${functionName}] 开始更新Cookie信息`, { errorId });
      
      // 表单验证
      if (!cookieInput || cookieInput.trim().length === 0) {
        const error = new Error('Cookie输入为空，无法更新');
        throw error;
      }
      
      // 简单的Cookie格式验证
      const cookieValue = cookieInput.trim();
      if (!cookieValue.includes('=') || cookieValue.split(';').length === 0) {
        const error = new Error('Cookie格式不正确，请确保包含键值对');
        throw error;
      }
      
      // 检查网络连接状态
      if (!navigator.onLine) {
        const error = new Error('网络连接不可用，请检查网络设置');
        throw error;
      }
      
      const response = await settingsService.updateCookie(cookieInput);
      
      if (response.success) {
        logInfo(`[${functionName}] Cookie更新成功`, { 
          cookieLength: cookieValue.length,
          hasKeyValuePairs: cookieValue.includes('='),
          errorId 
        });
        
        toast.success('Cookie已更新');
        setCookieInput('');
        
        // 刷新用户信息
        logInfo(`[${functionName}] 更新Cookie后刷新用户信息`, { errorId });
        await refreshUser();
      } else {
        const errorMessage = response.message || 'Cookie更新失败';
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      let errorCategory = ErrorCategory.DATA_VALIDATION;
      let errorMessage = getErrorMessage(error);
      
      // 根据错误类型进行分类
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorCategory = ErrorCategory.NETWORK;
        errorMessage = '网络连接失败，请检查后端服务是否启动';
      } else if (error.message.includes('网络连接不可用')) {
        errorCategory = ErrorCategory.NETWORK;
      } else if (error.message.includes('Cookie输入为空') || error.message.includes('格式不正确')) {
        errorCategory = ErrorCategory.DATA_VALIDATION;
        errorMessage = 'Cookie格式无效，请检查输入内容';
      } else if (error.message.includes('401') || error.message.includes('未授权')) {
        errorCategory = ErrorCategory.AUTHENTICATION;
        errorMessage = '登录状态已过期，请重新登录';
      } else if (error.message.includes('403') || error.message.includes('禁止访问')) {
        errorCategory = ErrorCategory.AUTHORIZATION;
        errorMessage = '权限不足，无法更新Cookie';
      }
      
      logError(`[${functionName}] 更新Cookie信息失败`, { 
        error: error.message,
        stack: error.stack,
        errorCategory,
        cookieLength: cookieInput?.length,
        errorId 
      });
      
      const userMessage = createUserFriendlyMessage(error, errorCategory, errorId);
      toast.error(userMessage);
    } finally {
      setIsUpdatingCookie(false);
    }
  };

  // 导出数据
  const handleExport = async () => {
    const functionName = 'handleExport';
    const errorId = generateErrorId();
    setIsExporting(true);
    
    try {
      logInfo(`[${functionName}] 开始导出用户数据`, { errorId });
      
      // 检查网络连接状态
      if (!navigator.onLine) {
        const error = new Error('网络连接不可用，请检查网络设置');
        throw error;
      }
      
      const response = await settingsService.exportData();
      
      if (response.success && response.data) {
        // 创建下载链接
        logInfo(`[${functionName}] 数据导出成功，开始下载文件`, { 
          dataSize: JSON.stringify(response.data).length,
          errorId 
        });
        
        const dataStr = JSON.stringify(response.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `tmall-gift-data-${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        URL.revokeObjectURL(url);
        
        logInfo(`[${functionName}] 文件下载完成`, { 
          fileName: link.download,
          errorId 
        });
        
        toast.success('数据已导出并下载');
      } else {
        const errorMessage = response.message || '数据导出失败';
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      let errorCategory = ErrorCategory.DATA_EXPORT;
      let errorMessage = getErrorMessage(error);
      
      // 根据错误类型进行分类
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorCategory = ErrorCategory.NETWORK;
        errorMessage = '网络连接失败，请检查后端服务是否启动';
      } else if (error.message.includes('网络连接不可用')) {
        errorCategory = ErrorCategory.NETWORK;
      } else if (error.message.includes('401') || error.message.includes('未授权')) {
        errorCategory = ErrorCategory.AUTHENTICATION;
        errorMessage = '登录状态已过期，请重新登录';
      } else if (error.message.includes('403') || error.message.includes('禁止访问')) {
        errorCategory = ErrorCategory.AUTHORIZATION;
        errorMessage = '权限不足，无法导出数据';
      } else if (error.message.includes('permission') || error.message.includes('权限')) {
        errorCategory = ErrorCategory.AUTHORIZATION;
        errorMessage = '导出权限不足，请联系管理员';
      }
      
      logError(`[${functionName}] 导出用户数据失败`, { 
        error: error.message,
        stack: error.stack,
        errorCategory,
        errorId 
      });
      
      const userMessage = createUserFriendlyMessage(error, errorCategory, errorId);
      toast.error(userMessage);
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto" />
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">设置</h1>
        <p className="text-gray-600 mt-1">管理您的账号和应用设置</p>
      </div>

      {/* Cookie管理 */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Cookie className="w-5 h-5 text-orange-600" />
            <CardTitle>Cookie管理</CardTitle>
          </div>
          <CardDescription>
            更新或管理您的淘宝Cookie
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="cookie">Cookie字符串</Label>
            <Textarea
              id="cookie"
              value={cookieInput}
              onChange={(e) => setCookieInput(e.target.value)}
              placeholder="cookie2=xxx; _m_h5_tk=xxx; _tb_token_=xxx; ..."
              rows={4}
              className="font-mono text-xs mt-2"
            />
          </div>
          <div className="flex space-x-2">
            <Button 
              onClick={handleUpdateCookie}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              <Save className="w-4 h-4 mr-2" />
              更新Cookie
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                const stored = localStorage.getItem('cookie');
                if (stored) {
                  setCookieInput(stored);
                  toast.info('已加载当前Cookie');
                }
              }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              查看当前Cookie
            </Button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Cookie有效性</p>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>当前Cookie有效，将于 2025-11-30 过期</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 通知设置 */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-blue-600" />
            <CardTitle>通知设置</CardTitle>
          </div>
          <CardDescription>
            自定义通知提醒
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">兑换成功通知</div>
              <div className="text-sm text-gray-600">红包兑换成功时推送通知</div>
            </div>
            <Switch 
              checked={settings.notifications.grabSuccess}
              onCheckedChange={(checked) => 
                setSettings({ ...settings, notifications: { ...settings.notifications, grabSuccess: checked } })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">兑换失败通知</div>
              <div className="text-sm text-gray-600">红包兑换失败时推送通知</div>
            </div>
            <Switch 
              checked={settings.notifications.grabFailed}
              onCheckedChange={(checked) => 
                setSettings({ ...settings, notifications: { ...settings.notifications, grabFailed: checked } })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">任务完成通知</div>
              <div className="text-sm text-gray-600">定时任务完成时推送通知</div>
            </div>
            <Switch 
              checked={settings.notifications.taskComplete}
              onCheckedChange={(checked) => 
                setSettings({ ...settings, notifications: { ...settings.notifications, taskComplete: checked } })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* 自动刷新设置 */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-5 h-5 text-green-600" />
            <CardTitle>自动刷新</CardTitle>
          </div>
          <CardDescription>
            自动更新红包列表和余额
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">启用自动刷新</div>
              <div className="text-sm text-gray-600">自动获取最新数据</div>
            </div>
            <Switch 
              checked={settings.autoRefresh.enabled}
              onCheckedChange={(checked) => 
                setSettings({ ...settings, autoRefresh: { ...settings.autoRefresh, enabled: checked } })
              }
            />
          </div>

          {settings.autoRefresh.enabled && (
            <>
              <Separator />
              <div>
                <Label htmlFor="interval">刷新间隔（秒）</Label>
                <Input
                  id="interval"
                  type="number"
                  value={settings.autoRefresh.interval}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 30;
                    setSettings({ ...settings, autoRefresh: { ...settings.autoRefresh, interval: value } });
                  }}
                  min="10"
                  max="300"
                  className="mt-2"
                />
                <p className="text-xs text-gray-600 mt-1">
                  建议设置为30-60秒，避免请求过于频繁
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 数据与隐私 */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-purple-600" />
            <CardTitle>数据与隐私</CardTitle>
          </div>
          <CardDescription>
            管理您的数据和隐私设置
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Button 
              onClick={handleExport}
              variant="outline"
              className="w-full justify-start"
            >
              <Download className="w-4 h-4 mr-2" />
              导出数据
            </Button>
            <Button 
              onClick={logout}
              variant="destructive"
              className="w-full justify-start"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              退出登录
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 保存按钮 */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSaveSettings}
          className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
        >
          <Save className="w-4 h-4 mr-2" />
          保存所有设置
        </Button>
      </div>

      {/* 版本信息 */}
      <Card className="border-0 shadow-lg bg-gray-50">
        <CardContent className="py-6">
          <div className="text-center text-sm text-gray-600 space-y-1">
            <p className="font-medium">礼享金抢购助手 v1.0.0</p>
            <p>© 2025 All Rights Reserved</p>
            <p className="text-xs">技术支持: React + FastAPI</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}