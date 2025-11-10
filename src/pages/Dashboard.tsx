import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { 
  Gift, 
  Sparkles, 
  TrendingUp, 
  Clock,
  CheckCircle2,
  RefreshCw,
  Zap,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { giftService, statsService } from '../lib/api-services';

interface RedPacket {
  id: string;
  benefitCode: string;
  name: string;
  amount: string;
  coinCost: number;
  type: 'phone' | 'cash' | 'coupon';
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
      // 并发请求红包列表和统计数据
      const [giftsResponse, statsResponse] = await Promise.all([
        giftService.getGiftList({ status: 'available' }),
        statsService.getDashboardStats(),
      ]);

      if (giftsResponse.success && giftsResponse.data) {
        setRedPackets(giftsResponse.data.gifts || []);
      }

      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      }
    } catch (error: any) {
      console.error('加载数据失败:', error);
      toast.error(error.message || '加载数据失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 刷新红包列表
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const response = await giftService.getGiftList({ status: 'available' });
      
      if (response.success && response.data) {
        setRedPackets(response.data.gifts || []);
        toast.success('刷新成功');
      } else {
        throw new Error(response.message || '刷新失败');
      }
    } catch (error: any) {
      console.error('刷新失败:', error);
      toast.error(error.message || '刷新失败');
    } finally {
      setIsRefreshing(false);
    }
  };

  // 抢购单个红包
  const handleClaim = async (packet: RedPacket) => {
    if (claimingIds.has(packet.id)) return;

    setClaimingIds(prev => new Set(prev).add(packet.id));
    
    try {
      const response = await giftService.grabGift(packet.id);
      
      if (response.success) {
        toast.success(`成功抢购 ${packet.name}！`);
        
        // 更新红包状态
        setRedPackets(prev =>
          prev.map(p => p.id === packet.id ? { ...p, status: 'claimed' as const } : p)
        );
        
        // 刷新用户余额
        await refreshUser();
        
        // 刷新统计数据
        loadData();
      } else {
        throw new Error(response.message || '抢购失败');
      }
    } catch (error: any) {
      console.error('抢购失败:', error);
      toast.error(error.message || '抢购失败，请重试');
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
      toast.warning('没有可抢购的红包');
      return;
    }

    const giftIds = availablePackets.map(p => p.id);
    setIsRefreshing(true);
    
    try {
      const response = await giftService.batchGrabGifts(giftIds);
      
      if (response.success && response.data) {
        const { success, failed } = response.data;
        toast.success(`成功抢购 ${success} 个红包${failed > 0 ? `，失败 ${failed} 个` : ''}`);
        
        // 刷新数据
        await loadData();
        await refreshUser();
      } else {
        throw new Error(response.message || '批量抢购失败');
      }
    } catch (error: any) {
      console.error('批量抢购失败:', error);
      toast.error(error.message || '批量抢购失败');
    } finally {
      setIsRefreshing(false);
    }
  };

  // 获取类型图标
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'phone':
        return '📱';
      case 'cash':
        return '💰';
      case 'coupon':
        return '🎫';
      default:
        return '🎁';
    }
  };

  // 获取类型文本
  const getTypeText = (type: string) => {
    switch (type) {
      case 'phone':
        return '话费';
      case 'cash':
        return '现金';
      case 'coupon':
        return '优惠券';
      default:
        return '未知';
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
          <h1 className="text-2xl font-bold text-gray-900">抢购中心</h1>
          <p className="text-sm text-gray-600 mt-1">实时监控，快速抢购</p>
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
              <CardTitle>可用红包</CardTitle>
              <CardDescription>点击立即抢购，先到先得</CardDescription>
            </div>
            <Badge variant="secondary">{redPackets.length} 个可用</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {redPackets.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">暂无可用红包</p>
              <p className="text-sm text-gray-400">请稍后刷新查看</p>
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
                        <span className="text-2xl">{getTypeIcon(packet.type)}</span>
                        <div>
                          <CardTitle className="text-base">{packet.name}</CardTitle>
                          <CardDescription className="text-xs">
                            {packet.benefitCode}
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
                        {packet.amount}
                      </span>
                      <span className="text-xs text-gray-500">
                        需 {packet.coinCost} 金币
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
