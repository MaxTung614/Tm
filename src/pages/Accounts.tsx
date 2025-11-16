/**
 * 账号管理页面
 * 用于管理多个淘宝/天猫账号及其 Cookie
 */

import { useState, useEffect } from 'react';
import { accountService } from '../lib/api-services';
import type { Account } from '../lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { toast } from 'sonner';
import { 
  Plus, 
  Trash2, 
  Edit, 
  User, 
  Lock,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  RefreshCw,
  Copy,
  QrCode,
  Keyboard,
  Smartphone // 添加手机图标
} from 'lucide-react';
import {
  logError,
  logInfo,
  logWarning,
  ErrorCategory,
  generateErrorId,
  createUserFriendlyMessage
} from '../lib/error-handler';
import QRCodeLogin from '../components/auth/QRCodeLogin';

export default function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // 添加/编辑对话框状态
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [loginMethod, setLoginMethod] = useState<'qrcode' | 'manual' | 'sms'>('qrcode'); // ← 添加 'sms'
  const [formData, setFormData] = useState({
    name: '',
    cookie: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  
  // 短信登录状态
  const [smsPhone, setSmsPhone] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [smsSessionId, setSmsSessionId] = useState('');
  const [smsSending, setSmsSending] = useState(false);
  const [smsCountdown, setSmsCountdown] = useState(0);
  const [smsLoggingIn, setSmsLoggingIn] = useState(false);

  // 删除确认对话框
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    setIsLoading(true);
    try {
      logInfo('开始加载账号列表', {
        operation: 'load_accounts',
        timestamp: new Date().toISOString()
      });

      const result = await accountService.getAll();
      
      logInfo(`成功加载 ${result.length} 个账号`, {
        operation: 'load_accounts',
        accountCount: result.length
      });

      setAccounts(result);
    } catch (error: any) {
      const errorId = generateErrorId();
      
      logError(error, {
        operation: 'load_accounts',
        component: 'Accounts',
        errorId,
        timestamp: new Date().toISOString()
      });

      const errorCategory = error.message?.includes('NetworkError') || error.message?.includes('网络') 
        ? ErrorCategory.NETWORK 
        : ErrorCategory.DATA_FETCHING;
      
      const userMessage = createUserFriendlyMessage(error, errorCategory, errorId, 'loadAccounts');

      toast.error(userMessage, {
        description: `错误ID: ${errorId}`,
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await loadAccounts();
      toast.success('账号列表已刷新');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAdd = () => {
    setEditingAccount(null);
    setFormData({ name: '', cookie: '' });
    setLoginMethod('qrcode'); // ✅ 默认扫码登录（基于 TSDK 实现）
    setIsDialogOpen(true);
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      cookie: account.cookie,
    });
    setLoginMethod('manual'); // 编辑时默认手动输入
    setIsDialogOpen(true);
  };

  // 扫码登录成功回调
  const handleQRCodeSuccess = (cookie: string, username: string) => {
    setFormData(prev => ({ 
      ...prev, 
      cookie,
      name: username // ← 自动填充用户名
    }));
    toast.success(`扫码成功！已获取账号：${username}`, {
      duration: 3000,
    });
  };

  const handleSave = async () => {
    // 验证
    if (!formData.name.trim()) {
      toast.error('请输入账号名称');
      return;
    }

    if (!formData.cookie.trim()) {
      toast.error('请输入 Cookie');
      return;
    }

    setIsSaving(true);
    try {
      logInfo(`开始${editingAccount ? '更新' : '创建'}账号`, {
        operation: editingAccount ? 'update_account' : 'create_account',
        accountId: editingAccount?.id,
        accountName: formData.name,
        timestamp: new Date().toISOString()
      });

      if (editingAccount) {
        // 更新
        await accountService.update(editingAccount.id, formData.name, formData.cookie);
        
        logInfo('账号更新成功', {
          operation: 'update_account',
          accountId: editingAccount.id,
          accountName: formData.name
        });

        toast.success('账号更新成功');
      } else {
        // 创建
        await accountService.create(formData.name, formData.cookie);
        
        logInfo('账号创建成功', {
          operation: 'create_account',
          accountName: formData.name
        });

        toast.success('账号添加成功');
      }

      setIsDialogOpen(false);
      await loadAccounts();
    } catch (error: any) {
      const errorId = generateErrorId();
      
      logError(error, {
        operation: editingAccount ? 'update_account' : 'create_account',
        accountId: editingAccount?.id,
        accountName: formData.name,
        component: 'Accounts',
        errorId,
        timestamp: new Date().toISOString()
      });

      const errorCategory = error.message?.includes('NetworkError') || error.message?.includes('网络') 
        ? ErrorCategory.NETWORK 
        : ErrorCategory.DATA_SAVING;
      
      const userMessage = createUserFriendlyMessage(error, errorCategory, errorId, 'handleSave');

      toast.error(userMessage, {
        description: `错误ID: ${errorId}`,
        duration: 5000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (account: Account) => {
    setAccountToDelete(account);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!accountToDelete) return;

    setIsDeleting(true);
    try {
      logInfo('开始删除账号', {
        operation: 'delete_account',
        accountId: accountToDelete.id,
        accountName: accountToDelete.name,
        timestamp: new Date().toISOString()
      });

      await accountService.delete(accountToDelete.id);
      
      logInfo('账号删除成功', {
        operation: 'delete_account',
        accountId: accountToDelete.id,
        accountName: accountToDelete.name
      });

      toast.success(`账号 "${accountToDelete.name}" 已删除`);
      setDeleteConfirmOpen(false);
      setAccountToDelete(null);
      await loadAccounts();
    } catch (error: any) {
      const errorId = generateErrorId();
      
      logError(error, {
        operation: 'delete_account',
        accountId: accountToDelete.id,
        accountName: accountToDelete.name,
        component: 'Accounts',
        errorId,
        timestamp: new Date().toISOString()
      });

      const errorCategory = error.message?.includes('NetworkError') || error.message?.includes('网络') 
        ? ErrorCategory.NETWORK 
        : ErrorCategory.DATA_DELETION;
      
      const userMessage = createUserFriendlyMessage(error, errorCategory, errorId, 'handleDeleteConfirm');

      toast.error(userMessage, {
        description: `错误ID: ${errorId}`,
        duration: 5000,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleActive = async (account: Account) => {
    try {
      logInfo('切换账号激活状态', {
        operation: 'toggle_account_active',
        accountId: account.id,
        accountName: account.name,
        currentStatus: account.is_active,
        newStatus: !account.is_active
      });

      await accountService.toggleActive(account.id);
      
      logInfo('账号状态切换成功', {
        operation: 'toggle_account_active',
        accountId: account.id,
        newStatus: !account.is_active
      });

      toast.success(`账号已${account.is_active ? '停用' : '激活'}`);
      await loadAccounts();
    } catch (error: any) {
      const errorId = generateErrorId();
      
      logError(error, {
        operation: 'toggle_account_active',
        accountId: account.id,
        component: 'Accounts',
        errorId
      });

      toast.error('状态切换失败，请重试', {
        description: `错误ID: ${errorId}`,
        duration: 5000,
      });
    }
  };

  const handlePasteCookie = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setFormData(prev => ({ ...prev, cookie: text }));
      
      // ✅ 自动提取用户名
      const username = extractUsernameFromCookie(text);
      if (username && username !== '未知用户') {
        setFormData(prev => ({ ...prev, name: username, cookie: text }));
        toast.success(`Cookie 已粘贴，检测到用户名：${username}`);
      } else {
        toast.success('Cookie 已粘贴');
      }
    } catch (error) {
      toast.error('粘贴失败，请手动复制');
    }
  };

  // ✅ 从 Cookie 中提取用户名
  const extractUsernameFromCookie = (cookieString: string): string => {
    if (!cookieString) return '未知用户';
    
    try {
      // 方法1: 尝试从 _nk_ 字段提取（URL 编码的用户名）
      const nkMatch = cookieString.match(/_nk_=([^;]+)/);
      if (nkMatch) {
        try {
          const username = decodeURIComponent(nkMatch[1]);
          if (username) {
            console.log(`[前端] 从 _nk_ 提取用户名: ${username}`);
            return username;
          }
        } catch (err) {
          console.error(`[前端] 解码 _nk_ 失败:`, err);
        }
      }
      
      // 方法2: 尝试从 tracknick 字段提取
      const tracknickMatch = cookieString.match(/tracknick=([^;]+)/);
      if (tracknickMatch) {
        try {
          const username = decodeURIComponent(tracknickMatch[1]);
          if (username) {
            console.log(`[前端] 从 tracknick 提取用户名: ${username}`);
            return username;
          }
        } catch (err) {
          console.error(`[前端] 解码 tracknick 失败:`, err);
        }
      }
      
      // 方法3: 尝试从 lgc 字段提取（登录账号）
      const lgcMatch = cookieString.match(/lgc=([^;]+)/);
      if (lgcMatch) {
        try {
          const username = decodeURIComponent(lgcMatch[1]);
          if (username) {
            console.log(`[前端] 从 lgc 提取用户名: ${username}`);
            return username;
          }
        } catch (err) {
          console.error(`[前端] 解码 lgc 失败:`, err);
        }
      }
      
      console.log(`[前端] 未能从 Cookie 中提取用户名`);
      return '未知用户';
    } catch (error) {
      console.error(`[前端] 提取用户名失败:`, error);
      return '未知用户';
    }
  };
  
  // 🆕 发送短信验证码
  const handleSendSmsCode = async () => {
    if (!smsPhone.trim()) {
      toast.error('请输入手机号');
      return;
    }
    
    // 简单验证手机号格式
    if (!/^1[3-9]\d{9}$/.test(smsPhone.trim())) {
      toast.error('请输入有效的11位手机号');
      return;
    }
    
    setSmsSending(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/make-server-c6898dcb/auth/sms/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          phone: smsPhone.trim(),
        }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || '发送验证码失败');
      }
      
      setSmsSessionId(data.data.sessionId);
      toast.success('验证码已发送，请查收短信');
      
      // 启动倒计时
      setSmsCountdown(60);
      const timer = setInterval(() => {
        setSmsCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      console.error('[SMS] 发送验证码失败:', error);
      toast.error(error.message || '发送验证码失败，请重试');
    } finally {
      setSmsSending(false);
    }
  };
  
  // 🆕 短信验证码登录
  const handleSmsLogin = async () => {
    if (!smsPhone.trim()) {
      toast.error('请输入手机号');
      return;
    }
    
    if (!smsCode.trim()) {
      toast.error('请输入验证码');
      return;
    }
    
    if (!smsSessionId) {
      toast.error('请先发送验证码');
      return;
    }
    
    setSmsLoggingIn(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/make-server-c6898dcb/auth/sms/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          sessionId: smsSessionId,
          smsCode: smsCode.trim(),
        }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || '登录失败');
      }
      
      // ✅ 登录成功，填充表单
      setFormData(prev => ({
        ...prev,
        cookie: data.data.cookie,
        name: data.data.username,
      }));
      
      toast.success(`登录成功！已获取账号：${data.data.username}`, {
        duration: 3000,
      });
      
      // 清空短信表单
      setSmsPhone('');
      setSmsCode('');
      setSmsSessionId('');
    } catch (error: any) {
      console.error('[SMS] 登录失败:', error);
      toast.error(error.message || '登录失败，请检查验证码');
    } finally {
      setSmsLoggingIn(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto" />
          <p className="text-gray-600">加载账号列表...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">👥 账号管理</h1>
          <p className="text-sm text-gray-600 mt-1">
            管理您的淘宝/天猫账号，Cookie 会安全加密存储
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            刷新
          </Button>
          <Button
            onClick={handleAdd}
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            添加账号
          </Button>
        </div>
      </div>

      {/* 账号列表 */}
      {accounts.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">暂无账号</p>
              <p className="text-sm text-gray-400 mb-4">
                点击右上角"添加账号"按钮添加您的第一个账号
              </p>
              <Button
                onClick={handleAdd}
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                立即添加
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map(account => (
            <Card key={account.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      account.is_active 
                        ? 'bg-green-100' 
                        : 'bg-gray-100'
                    }`}>
                      <User className={`w-5 h-5 ${
                        account.is_active 
                          ? 'text-green-600' 
                          : 'text-gray-400'
                      }`} />
                    </div>
                    <div>
                      <CardTitle className="text-base">{account.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {new Date(account.created_at).toLocaleDateString('zh-CN')}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge 
                    variant={account.is_active ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {account.is_active ? '激活' : '停用'}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600 flex items-center">
                      <Lock className="w-3 h-3 mr-1" />
                      Cookie (加密)
                    </span>
                  </div>
                  <div className="font-mono text-xs text-gray-500 truncate">
                    {account.cookie.substring(0, 40)}...
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleToggleActive(account)}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    {account.is_active ? (
                      <>
                        <XCircle className="w-4 h-4 mr-1" />
                        停用
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        激活
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => handleEdit(account)}
                    variant="outline"
                    size="sm"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => handleDeleteClick(account)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 添加/编辑对话框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingAccount ? '编辑账号' : '添加账号'}
            </DialogTitle>
            <DialogDescription>
              {editingAccount 
                ? '修改账号信息和 Cookie' 
                : '选择扫码登录或手动输入 Cookie'}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={loginMethod} onValueChange={(v) => setLoginMethod(v as 'qrcode' | 'manual' | 'sms')}>
            <TabsList className="grid w-full grid-cols-3"> {/* ← 改为 3 列 */}
              <TabsTrigger value="qrcode" disabled={!!editingAccount}>
                <QrCode className="w-4 h-4 mr-2" />
                扫码登录
              </TabsTrigger>
              <TabsTrigger value="manual">
                <Keyboard className="w-4 h-4 mr-2" />
                手动输入
              </TabsTrigger>
              <TabsTrigger value="sms" disabled={!!editingAccount}>
                <Smartphone className="w-4 h-4 mr-2" />
                短信登录
              </TabsTrigger>
            </TabsList>

            {/* 扫码登录标签页 */}
            <TabsContent value="qrcode" className="space-y-4">
              {/* 二维码登录组件 */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <QRCodeLogin onSuccess={handleQRCodeSuccess} />
              </div>

              {formData.cookie && formData.name && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-green-800">
                      <p className="font-medium mb-1">✅ 登录成功</p>
                      <p className="text-xs">
                        账号名称：<span className="font-semibold">{formData.name}</span>
                      </p>
                      <p className="text-xs mt-1">
                        Cookie 已获取，点击保存按钮完成添加
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* 手动输入标签页 */}
            <TabsContent value="manual" className="space-y-4">
              {/* 推荐提示 */}
              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-300 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                    ⭐
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-orange-900 mb-1">💡 推荐使用此方法！</p>
                    <p className="text-sm text-orange-800">
                      在浏览器中登录后复制 Cookie，可以 <strong>100% 避免风控问题</strong>，且操作简单快捷。
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">账号名称</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="例如：主账号、小号1"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Cookie 字符串</label>
                  <Button
                    onClick={handlePasteCookie}
                    variant="ghost"
                    size="sm"
                    type="button"
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    粘贴
                  </Button>
                </div>
                <Textarea
                  value={formData.cookie}
                  onChange={(e) => setFormData(prev => ({ ...prev, cookie: e.target.value }))}
                  placeholder="cookie2=xxx; _m_h5_tk=xxx; _tb_token_=xxx; ..."
                  rows={6}
                  className="font-mono text-xs"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 space-y-2">
                  <p className="font-medium">💡 如何获取 Cookie（推荐方法）</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>打开浏览器，访问 <a href="https://www.taobao.com" target="_blank" rel="noopener noreferrer" className="underline font-semibold">https://www.taobao.com</a></li>
                    <li>使用您的淘宝账号登录（扫码或密码登录均可）</li>
                    <li>登录成功后，按 <kbd className="px-1 py-0.5 bg-white border rounded text-xs">F12</kbd> 打开开发者工具</li>
                    <li>点击顶部的 <strong>"Application"</strong> 或 <strong>"应用程序"</strong> 标签</li>
                    <li>左侧菜单找到 <strong>"Cookies"</strong> → <strong>"https://www.taobao.com"</strong></li>
                    <li>按 <kbd className="px-1 py-0.5 bg-white border rounded text-xs">Ctrl+A</kbd> 全选所有 Cookie，右键复制</li>
                    <li>点击上方的"粘贴"按钮，或按 <kbd className="px-1 py-0.5 bg-white border rounded text-xs">Ctrl+V</kbd> 粘贴</li>
                  </ol>
                  <div className="mt-3 p-2 bg-white rounded border border-blue-300">
                    <p className="text-xs font-semibold mb-1">🎯 必需的关键 Cookie：</p>
                    <ul className="text-xs space-y-0.5 text-blue-700">
                      <li>• <code className="bg-blue-100 px-1 rounded">cookie2</code> - 登录凭证</li>
                      <li>• <code className="bg-blue-100 px-1 rounded">t</code> - 用户令牌</li>
                      <li>• <code className="bg-blue-100 px-1 rounded">_tb_token_</code> - 防伪令牌</li>
                      <li>• <code className="bg-blue-100 px-1 rounded">_nk_</code> - 用户名（用于自动识别账号）</li>
                    </ul>
                  </div>
                  <p className="text-xs mt-2 font-semibold text-green-700">
                    ✅ 系统会自动检测用户名并加密存储 Cookie，确保账号安全
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* 短信登录标签页 */}
            <TabsContent value="sms" className="space-y-4">
              {/* 短信登录组件 */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="space-y-2">
                  <label className="text-sm font-medium">手机号</label>
                  <Input
                    value={smsPhone}
                    onChange={(e) => setSmsPhone(e.target.value)}
                    placeholder="请输入您的手机号"
                    type="tel"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">验证码</label>
                    <Button
                      onClick={handleSendSmsCode}
                      variant="ghost"
                      size="sm"
                      type="button"
                      disabled={smsSending || smsCountdown > 0}
                    >
                      {smsCountdown > 0 ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          {smsCountdown}秒后重试
                        </>
                      ) : (
                        '发送验证码'
                      )}
                    </Button>
                  </div>
                  <Input
                    value={smsCode}
                    onChange={(e) => setSmsCode(e.target.value)}
                    placeholder="请输入验证码"
                    type="text"
                  />
                </div>

                <Button
                  onClick={handleSmsLogin}
                  disabled={smsLoggingIn}
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                >
                  {smsLoggingIn ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      登录中...
                    </>
                  ) : (
                    '登录'
                  )}
                </Button>
              </div>

              {formData.cookie && formData.name && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-green-800">
                      <p className="font-medium mb-1">✅ 登录成功</p>
                      <p className="text-xs">
                        账号名称：<span className="font-semibold">{formData.name}</span>
                      </p>
                      <p className="text-xs mt-1">
                        Cookie 已获取，点击保存按钮完成添加
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              onClick={() => setIsDialogOpen(false)}
              variant="outline"
              disabled={isSaving}
            >
              取消
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  保存中...
                </>
              ) : (
                '保存'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除账号 <span className="font-semibold">{accountToDelete?.name}</span> 吗？
              此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  删除中...
                </>
              ) : (
                '确认删除'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}