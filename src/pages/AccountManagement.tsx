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
  Copy
} from 'lucide-react';
import {
  logError,
  logInfo,
  logWarning,
  ErrorCategory,
  generateErrorId,
  createUserFriendlyMessage
} from '../lib/error-handler';

export default function AccountManagement() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // 添加/编辑对话框状态
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    cookie: '',
  });
  const [isSaving, setIsSaving] = useState(false);

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
        component: 'AccountManagement',
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
    setIsDialogOpen(true);
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      cookie: account.cookie,
    });
    setIsDialogOpen(true);
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
        component: 'AccountManagement',
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
        component: 'AccountManagement',
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
        component: 'AccountManagement',
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
      toast.success('Cookie 已粘贴');
    } catch (error) {
      toast.error('粘贴失败，请手动复制');
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAccount ? '编辑账号' : '添加账号'}
            </DialogTitle>
            <DialogDescription>
              {editingAccount 
                ? '修改账号信息和 Cookie' 
                : '添加新的淘宝/天猫账号'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
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
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">如何获取 Cookie？</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>使用 Chrome 打开 <a href="https://pages.tmall.com/wow/an/tmall/user-growth/share-benefit-exchange" target="_blank" rel="noopener noreferrer" className="underline font-semibold">天猫礼享金页面</a></li>
                  <li>按 F12 打开开发者工具</li>
                  <li>切换到 Application → Cookies → https://pages.tmall.com</li>
                  <li>复制所有 Cookie 值</li>
                </ol>
              </div>
            </div>
          </div>

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