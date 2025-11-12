import { toast } from 'sonner';
import { giftService, statService } from '../lib/api-services';
import { 
  logError, 
  logWarning, 
  logInfo, 
  ErrorCategory, 
  ErrorLevel,
  errorHandler,
  createUserFriendlyMessage,
  generateErrorId,
  getErrorMessage
} from '../lib/error-handler';
import { safeFetch } from '../lib/network-interceptor';

interface RedPacket {
  id: string;
  benefitCode: string;
  name: string;
  amount: string;
  coinCost: number;
  type: 'redPacket';  // 只保留红包类型
  status: 'available' | 'claimed' | 'expired';
  expireTime?: string;
  description?: string;
}

interface DashboardStats {
  totalGrabbed: number;
  successRate: number;
  totalAmount: number;
  todayGrabbed: number;
}

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const [redPackets, setRedPackets] = useState<RedPacket[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalGrabbed: 0,
    successRate: 0,
    totalAmount: 0,
    todayGrabbed: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [claimingIds, setClaimingIds] = useState<Set<string>>(new Set());

  // 加载数据
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      logInfo('开始加载仪表板数据', { 
        operation: 'load_dashboard_data',
        timestamp: new Date().toISOString()
      });

      // 并发请求红包列表和统计数据，只获取红包类型
      const [giftsResponse, statsResponse] = await Promise.all([
        giftService.getGiftList({ status: 'available', type: 'redPacket' }),  // 只获取红包
        statService.getStatsOverview(),
      ]);

      if (giftsResponse.success && giftsResponse.data) {
        const giftCount = giftsResponse.data.gifts?.length || 0;
        logInfo(`成功加载 ${giftCount} 个可用红包`, {
          operation: 'load_gifts',
          giftCount,
          giftIds: giftsResponse.data.gifts?.map(g => g.id) || []
        });
        setRedPackets(giftsResponse.data.gifts || []);
      }

      if (statsResponse.success && statsResponse.data) {
        logInfo('成功加载统计数据', {
          operation: 'load_stats',
          stats: statsResponse.data
        });
        setStats(statsResponse.data);
      }

      if (!giftsResponse.success) {
        throw new Error(`获取红包列表失败: ${giftsResponse.message || '未知错误'}`);
      }

      if (!statsResponse.success) {
        throw new Error(`获取统计数据失败: ${statsResponse.message || '未知错误'}`);
      }

      logInfo('仪表板数据加载完成');

    } catch (error: any) {
      const errorId = generateErrorId();
      
      logError(error, {
        operation: 'load_dashboard_data',
        component: 'Dashboard',
        errorId,
        timestamp: new Date().toISOString()
      });

      // 使用统一的错误处理生成用户友好提示
      const errorCategory = error.message?.includes('NetworkError') || error.message?.includes('网络') ? ErrorCategory.NETWORK :
                           error.message?.includes('401') ? ErrorCategory.AUTHENTICATION :
                           ErrorCategory.DATA_FETCHING;
      
      const userMessage = createUserFriendlyMessage(error, errorCategory, errorId, 'loadData');

      toast.error(userMessage, {
        description: `错误ID: ${errorId}`,
        duration: 5000,
      });

    } finally {
      setIsLoading(false);
    }
  };

  // 刷新红包列表
  const handleRefresh = async () => {
    if (isRefreshing) {
      logWarning('刷新操作正在进行中，忽略重复请求', {
        operation: 'refresh_gifts',
        alreadyRefreshing: true
      });
      return;
    }

    setIsRefreshing(true);
    try {
      logInfo('开始刷新红包列表', {
        operation: 'refresh_gifts',
        timestamp: new Date().toISOString()
      });

      const response = await giftService.getGiftList({ status: 'available', type: 'redPacket' });  // 只获取红包
      
      if (response.success && response.data) {
        const newGiftCount = response.data.gifts?.length || 0;
        const oldGiftCount = redPackets.length;
        
        logInfo(`刷新成功，获得 ${newGiftCount} 个红包（之前 ${oldGiftCount} 个）`, {
          operation: 'refresh_gifts',
          newGiftCount,
          oldGiftCount,
          changes: newGiftCount - oldGiftCount
        });

        setRedPackets(response.data.gifts || []);
        
        // 显示差异提示
        const changeText = newGiftCount > oldGiftCount 
          ? `新增 ${newGiftCount - oldGiftCount} 个红包` 
          : newGiftCount < oldGiftCount 
          ? `减少 ${oldGiftCount - newGiftCount} 个红包`
          : '红包数量无变化';
          
        toast.success(`刷新成功！${changeText}`, {
          duration: 3000,
        });
      } else {
        throw new Error(response.message || '刷新失败');
      }

      logInfo('红包列表刷新完成');

    } catch (error: any) {
      const errorId = generateErrorId();
      
      logError(error, {
        operation: 'refresh_gifts',
        component: 'Dashboard',
        errorId,
        timestamp: new Date().toISOString()
      });

      // 使用统一的错误处理生成用户友好提示
      const errorCategory = error.message?.includes('NetworkError') || error.message?.includes('网络') ? ErrorCategory.NETWORK :
                           error.message?.includes('401') ? ErrorCategory.AUTHENTICATION :
                           ErrorCategory.DATA_REFRESH;
      
      const userMessage = createUserFriendlyMessage(error, errorCategory, errorId, 'handleRefresh');

      toast.error(userMessage, {
        description: `错误ID: ${errorId}`,
        duration: 5000,
      });

    } finally {
      setIsRefreshing(false);
    }
  };

  // 抢购单个红包
  const handleClaim = async (packet: RedPacket) => {
    if (claimingIds.has(packet.id)) {
      logWarning('红包正在抢购中，忽略重复请求', {
        operation: 'claim_gift',
        giftId: packet.id,
        giftName: packet.name,
        alreadyClaiming: true
      });
      return;
    }

    // 检查网络状态
    if (!navigator.onLine) {
      logError('网络连接已断开，无法进行抢购操作', {
        operation: 'claim_gift',
        giftId: packet.id,
        giftName: packet.name,
        networkStatus: 'offline'
      });

      toast.error('网络连接已断开，请检查网络设置后重试', {
        duration: 5000,
      });
      return;
    }

    setClaimingIds(prev => new Set(prev).add(packet.id));

    try {
      logInfo(`开始抢购红包: ${packet.name}`, {
        operation: 'claim_gift',
        giftId: packet.id,
        giftName: packet.name,
        giftAmount: packet.amount,
        coinCost: packet.coinCost,
        timestamp: new Date().toISOString()
      });

      const response = await giftService.grabGift(packet.id);
      
      if (response.success) {
        logInfo(`成功抢购红包: ${packet.name}`, {
          operation: 'claim_gift',
          giftId: packet.id,
          giftName: packet.name,
          amount: packet.amount,
          success: true
        });
        
        toast.success(`🎉 成功抢购 ${packet.name}！获得 ${packet.amount}`, {
          duration: 4000,
        });
        
        // 更新红包状态为已抢购
        setRedPackets(prev =>
          prev.map(p => p.id === packet.id ? { ...p, status: 'claimed' as const } : p)
        );
        
        // 刷新用户余额和统计数据
        try {
          await Promise.all([refreshUser(), loadData()]);
          logInfo('用户数据和统计数据刷新完成', {
            operation: 'claim_gift_post_process',
            giftId: packet.id
          });
        } catch (refreshError) {
          // 刷新失败不影响抢购成功的结果，只记录日志
          logWarning('抢购成功但数据刷新失败', {
            operation: 'claim_gift_post_process',
            giftId: packet.id,
            error: refreshError
          });
        }

      } else {
        throw new Error(response.message || '抢购失败');
      }

    } catch (error: any) {
      const errorId = generateErrorId();
      
      logError(error, {
        operation: 'claim_gift',
        giftId: packet.id,
        giftName: packet.name,
        component: 'Dashboard',
        errorId,
        timestamp: new Date().toISOString()
      });

      // 使用统一的错误处理生成用户友好提示
      const errorCategory = error.message?.includes('timeout') || error.message?.includes('超时') ? ErrorCategory.NETWORK_TIMEOUT :
                           error.message?.includes('401') ? ErrorCategory.AUTHENTICATION :
                           error.message?.includes('already_claimed') ? ErrorCategory.RESOURCE_CONFLICT :
                           ErrorCategory.GIFT_OPERATION;
      
      const userMessage = createUserFriendlyMessage(error, errorCategory, errorId, 'handleClaim');

      // 对于已抢购的情况，立即更新状态
      if (error.message?.includes('already_claimed')) {
        setRedPackets(prev =>
          prev.map(p => p.id === packet.id ? { ...p, status: 'claimed' as const } : p)
        );
      }

      toast.error(userMessage, {
        description: `错误ID: ${errorId}`,
        duration: 5000,
      });

    } finally {
      setClaimingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(packet.id);
        return newSet;
      });
    }
  };

  // 批量抢购
  const handleBatchClaim = async () => {
    const availablePackets = redPackets.filter(p => p.status === 'available');
    
    if (availablePackets.length === 0) {
      logWarning('没有可用的红包进行批量抢购', {
        operation: 'batch_claim_gifts',
        availableCount: 0,
        reason: 'no_available_packets'
      });
      toast.warning('没有可抢购的红包', {
        duration: 3000,
      });
      return;
    }

    // 检查网络状态
    if (!navigator.onLine) {
      logError('网络连接已断开，无法进行批量抢购', {
        operation: 'batch_claim_gifts',
        availableCount: availablePackets.length,
        networkStatus: 'offline'
      });

      toast.error('网络连接已断开，请检查网络设置后重试', {
        duration: 5000,
      });
      return;
    }

    const giftIds = availablePackets.map(p => p.id);
    const totalValue = availablePackets.reduce((sum, p) => sum + parseFloat(p.amount.replace(/[^\d.]/g, '')), 0);
    
    setIsRefreshing(true);
    
    try {
      logInfo(`开始批量抢购 ${availablePackets.length} 个红包，总价值约 ${totalValue} 元`, {
        operation: 'batch_claim_gifts',
        giftIds,
        giftCount: availablePackets.length,
        totalValue,
        giftNames: availablePackets.map(p => p.name),
        timestamp: new Date().toISOString()
      });

      const response = await giftService.batchGrabGifts(giftIds);
      
      if (response.success && response.data) {
        const { success, failed } = response.data;
        const successRate = availablePackets.length > 0 ? Math.round((success / availablePackets.length) * 100) : 0;
        
        logInfo(`批量抢购完成: 成功 ${success} 个，失败 ${failed} 个，成功率 ${successRate}%`, {
          operation: 'batch_claim_gifts',
          success,
          failed,
          successRate,
          totalAttempted: availablePackets.length
        });

        // 刷新数据
        try {
          await Promise.all([loadData(), refreshUser()]);
          logInfo('批量抢购后数据刷新完成');
        } catch (refreshError) {
          logWarning('批量抢购成功但数据刷新失败', {
            operation: 'batch_claim_post_refresh',
            error: refreshError
          });
        }

        // 根据结果显示不同的提示
        if (success > 0) {
          const successMessage = `🎉 成功抢购 ${success} 个红包${failed > 0 ? `，失败 ${failed} 个` : ''}`;
          const successRateMessage = `成功率: ${successRate}%`;
          
          if (failed === 0) {
            toast.success(successMessage, {
              description: successRateMessage,
              duration: 5000,
            });
          } else {
            toast.warning(successMessage, {
              description: `${successRateMessage} - 请检查失败原因后重试`,
              duration: 7000,
            });
          }
        } else {
          toast.error(`���量抢购全部失败 (${failed} 个)，请稍后重试`, {
            duration: 5000,
          });
        }

      } else {
        throw new Error(response.message || '批量抢购失败');
      }

    } catch (error: any) {
      const errorId = generateErrorId();
      
      logError(error, {
        operation: 'batch_claim_gifts',
        giftIds,
        giftCount: availablePackets.length,
        component: 'Dashboard',
        errorId,
        timestamp: new Date().toISOString()
      });

      // 使用统一的错误处理生成用户友好提示
      const errorCategory = error.message?.includes('timeout') || error.message?.includes('超时') ? ErrorCategory.NETWORK_TIMEOUT :
                           error.message?.includes('401') ? ErrorCategory.AUTHENTICATION :
                           error.message?.includes('rate_limit') ? ErrorCategory.RATE_LIMIT :
                           ErrorCategory.BATCH_OPERATION;
      
      const userMessage = createUserFriendlyMessage(error, errorCategory, errorId, 'handleBatchClaim');

      toast.error(userMessage, {
        description: `错误ID: ${errorId}`,
        duration: 6000,
      });

    } finally {
      setIsRefreshing(false);
    }
  };

  // 获取类型图标 - 简化为只显示红包
  const getTypeIcon = (type: string) => {
    return '💰';  // 统一使用红包图标
  };

  // 获取类型文本 - 简化为只显示红包
  const getTypeText = (type: string) => {
    return '现金红包';  // 统一显示为现金红包
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
          <h1 className="text-2xl font-bold text-gray-900">🎁 红包抢购中心</h1>
          <p className="text-sm text-gray-600 mt-1">天猫礼享金自动抢购，一键领取所有红包</p>
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
            onClick={handleBatchClaim}
            disabled={isRefreshing}
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            size="sm"
          >
            <Zap className="w-4 h-4 mr-2" />
            一键抢购
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>累计抢购</CardDescription>
            <CardTitle className="text-3xl">{stats.totalGrabbed}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-green-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>持续增长</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>成功率</CardDescription>
            <CardTitle className="text-3xl">{stats.successRate}%</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-blue-600">
              <Sparkles className="w-4 h-4 mr-1" />
              <span>表现优异</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>总金额</CardDescription>
            <CardTitle className="text-3xl">¥{stats.totalAmount}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-orange-600">
              <Gift className="w-4 h-4 mr-1" />
              <span>收益丰厚</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>今日抢购</CardDescription>
            <CardTitle className="text-3xl">{stats.todayGrabbed}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-purple-600">
              <Clock className="w-4 h-4 mr-1" />
              <span>今天表现</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 红包列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>💰 可用红包列表</CardTitle>
              <CardDescription>系统自动加载所有可抢红包，点击一键抢购即可全部领取</CardDescription>
            </div>
            <Badge variant="secondary" className="bg-orange-100 text-orange-700">{redPackets.length} 个可抢</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {redPackets.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">暂无可抢红包</p>
              <p className="text-sm text-gray-400">请点击右上角"刷新"按钮重新获取</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {redPackets.map(packet => (
                <Card
                  key={packet.id}
                  className={`relative overflow-hidden transition-all ${
                    packet.status === 'claimed'
                      ? 'opacity-60'
                      : 'hover:shadow-lg hover:scale-[1.02]'
                  }`}
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-200 to-red-200 rounded-bl-full opacity-20" />
                  
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">💰</span>
                        <div>
                          <CardTitle className="text-base">{packet.name || '现金红包'}</CardTitle>
                          <CardDescription className="text-xs">
                            ID: {packet.benefitCode.slice(0, 8)}...
                          </CardDescription>
                        </div>
                      </div>
                      <Badge
                        variant={packet.status === 'available' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {packet.status === 'available' ? '可抢' : '已抢'}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <div className="flex items-baseline space-x-1">
                      <span className="text-2xl font-bold text-orange-600">
                        ¥{packet.amount}
                      </span>
                      <span className="text-xs text-gray-500">
                        现金红包
                      </span>
                    </div>

                    {packet.description && (
                      <p className="text-xs text-gray-600">{packet.description}</p>
                    )}

                    {packet.expireTime && (
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock className="w-3 h-3 mr-1" />
                        <span>截止: {packet.expireTime}</span>
                      </div>
                    )}

                    <Button
                      onClick={() => handleClaim(packet)}
                      disabled={packet.status !== 'available' || claimingIds.has(packet.id)}
                      className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                      size="sm"
                    >
                      {claimingIds.has(packet.id) ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          抢购中...
                        </>
                      ) : packet.status === 'claimed' ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          已抢购
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 mr-2" />
                          立即抢购
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}