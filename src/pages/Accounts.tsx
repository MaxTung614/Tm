import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { 
  Users, 
  UserPlus, 
  RefreshCw, 
  CheckCircle2, 
  Trash2,
  AlertCircle,
  Loader2,
  ArrowRightLeft
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface Account {
  account_id: string;
  account_name: string;
  login_time: string;
  last_used: string;
  status: string;
  notes?: string;
}

export default function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [currentAccount, setCurrentAccount] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [accountsRes, currentRes] = await Promise.all([
        fetch('http://localhost:8000/api/accounts/list'),
        fetch('http://localhost:8000/api/accounts/current')
      ]);

      const accountsData = await accountsRes.json();
      const currentData = await currentRes.json();

      if (accountsData.success) {
        setAccounts(accountsData.data.accounts || []);
      }

      if (currentData.success && currentData.data) {
        setCurrentAccount(currentData.data);
      }
    } catch (error: any) {
      console.error('加载数据失败:', error);
      toast.error('加载数据失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadData();
      toast.success('刷新成功');
    } catch (error: any) {
      toast.error('刷新失败');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSwitch = async (accountId: string) => {
    setSwitchingId(accountId);
    try {
      const response = await fetch('http://localhost:8000/api/accounts/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_id: accountId })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('切换账号成功');
        await loadData();
      } else {
        throw new Error(data.message || '切换失败');
      }
    } catch (error: any) {
      console.error('切换账号失败:', error);
      toast.error(error.message || '切换账号失败');
    } finally {
      setSwitchingId(null);
    }
  };

  const handleDelete = async (accountId: string, accountName: string) => {
    if (!confirm(`确定要删除账号"${accountName}"吗？`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/accounts/${accountId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        toast.success('删除成功');
        await loadData();
      } else {
        throw new Error(data.message || '删除失败');
      }
    } catch (error: any) {
      console.error('删除失败:', error);
      toast.error(error.message || '删除失败');
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
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">👥 账号管理</h1>
          <p className="text-sm text-gray-600 mt-1">管理多个账号，共享风控参数</p>
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
        </div>
      </div>

      {/* 当前账号 */}
      {currentAccount && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <CardTitle className="text-base">当前使用的账号</CardTitle>
              </div>
              <Badge className="bg-green-600">活跃</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">{currentAccount.account_name}</span>
                <span className="text-sm text-gray-500">ID: {currentAccount.account_id}</span>
              </div>
              <div className="text-sm text-gray-600">
                登录时间: {currentAccount.login_time}
              </div>
              {currentAccount.notes && (
                <div className="text-sm text-gray-600">
                  备注: {currentAccount.notes}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 账号列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>所有账号</CardTitle>
              <CardDescription>点击切换按钮使用不同账号</CardDescription>
            </div>
            <Badge variant="secondary">{accounts.length} 个账号</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">暂无账号</p>
              <p className="text-sm text-gray-400">请先扫码登录添加账号</p>
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.map(account => {
                const isCurrent = currentAccount?.account_id === account.account_id;
                const isSwitching = switchingId === account.account_id;

                return (
                  <Card
                    key={account.account_id}
                    className={`transition-all ${
                      isCurrent
                        ? 'border-orange-500 bg-orange-50'
                        : 'hover:shadow-md'
                    }`}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-medium text-gray-900">{account.account_name}</h3>
                            {isCurrent && (
                              <Badge className="bg-green-600 text-xs">当前</Badge>
                            )}
                            <Badge variant="secondary" className="text-xs">
                              {account.status === 'active' ? '正常' : '异常'}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div>ID: {account.account_id}</div>
                            <div>登录: {account.login_time}</div>
                            <div>最后使用: {account.last_used}</div>
                            {account.notes && <div>备注: {account.notes}</div>}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {!isCurrent && (
                            <Button
                              onClick={() => handleSwitch(account.account_id)}
                              disabled={isSwitching}
                              size="sm"
                              className="bg-orange-500 hover:bg-orange-600"
                            >
                              {isSwitching ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  切换中
                                </>
                              ) : (
                                <>
                                  <ArrowRightLeft className="w-4 h-4 mr-2" />
                                  切换
                                </>
                              )}
                            </Button>
                          )}
                          <Button
                            onClick={() => handleDelete(account.account_id, account.account_name)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 说明卡片 */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-blue-600" />
            重要说明
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-700 space-y-2">
          <div>✅ <strong>一套参数，多个账号：</strong>风控参数（ua、umidToken、asac）所有账号共享</div>
          <div>✅ <strong>切换账号：</strong>只需切换 Cookie，风控参数自动使用</div>
          <div>⚠️ <strong>设备一致：</strong>所有账号必须使用同一设备扫码登录</div>
          <div>⚠️ <strong>Cookie 维护：</strong>Cookie 通常 1-7 天过期，需定期重新登录</div>
          <div>📱 <strong>添加账号：</strong>前往登录页面，扫码后账号自动添加到此处</div>
        </CardContent>
      </Card>
    </div>
  );
}
