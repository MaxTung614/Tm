import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  Clock,
  Play,
  Pause,
  Trash2,
  Plus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { taskService } from '../lib/api-services';

interface Task {
  id: string;
  name: string;
  giftId: string;
  giftName?: string;
  scheduledTime: string;
  repeatType: 'once' | 'daily' | 'weekly';
  status: 'pending' | 'running' | 'completed' | 'failed';
  lastRun?: string;
  nextRun?: string;
  createdAt: string;
}

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [actioningIds, setActioningIds] = useState<Set<string>>(new Set());

  // 新任务表单
  const [newTask, setNewTask] = useState({
    name: '',
    giftId: '',
    scheduledTime: '',
    repeatType: 'once' as 'once' | 'daily' | 'weekly',
  });

  useEffect(() => {
    loadTasks();
  }, []);

  // 加载任务列表
  const loadTasks = async () => {
    setIsLoading(true);
    try {
      const response = await taskService.getTaskList();
      
      if (response.success && response.data) {
        setTasks(response.data.tasks || []);
      }
    } catch (error: any) {
      console.error('加载任务失败:', error);
      toast.error(error.message || '加载任务失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 创建任务
  const handleCreateTask = async () => {
    if (!newTask.name || !newTask.giftId || !newTask.scheduledTime) {
      toast.error('请填写完整信息');
      return;
    }

    try {
      const response = await taskService.createTask(newTask);
      
      if (response.success) {
        toast.success('任务创建成功');
        setIsDialogOpen(false);
        setNewTask({
          name: '',
          giftId: '',
          scheduledTime: '',
          repeatType: 'once',
        });
        loadTasks();
      } else {
        throw new Error(response.message || '创建失败');
      }
    } catch (error: any) {
      console.error('创建任务失败:', error);
      toast.error(error.message || '创建任务失败');
    }
  };

  // 启动任务
  const handleStartTask = async (taskId: string) => {
    setActioningIds(prev => new Set(prev).add(taskId));
    
    try {
      const response = await taskService.startTask(taskId);
      
      if (response.success) {
        toast.success('任务已启动');
        loadTasks();
      } else {
        throw new Error(response.message || '启动失败');
      }
    } catch (error: any) {
      console.error('启动任务失败:', error);
      toast.error(error.message || '启动任务失败');
    } finally {
      setActioningIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
  };

  // 停止任务
  const handleStopTask = async (taskId: string) => {
    setActioningIds(prev => new Set(prev).add(taskId));
    
    try {
      const response = await taskService.stopTask(taskId);
      
      if (response.success) {
        toast.success('任务已停止');
        loadTasks();
      } else {
        throw new Error(response.message || '停止失败');
      }
    } catch (error: any) {
      console.error('停止任务失败:', error);
      toast.error(error.message || '停止任务失败');
    } finally {
      setActioningIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
  };

  // 删除任务
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('确定要删除这个任务吗？')) return;

    setActioningIds(prev => new Set(prev).add(taskId));
    
    try {
      const response = await taskService.deleteTask(taskId);
      
      if (response.success) {
        toast.success('任务已删除');
        loadTasks();
      } else {
        throw new Error(response.message || '删除失败');
      }
    } catch (error: any) {
      console.error('删除任务失败:', error);
      toast.error(error.message || '删除任务失败');
    } finally {
      setActioningIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
  };

  // 获取状态徽章
  const getStatusBadge = (status: Task['status']) => {
    const config = {
      pending: { variant: 'secondary' as const, icon: Clock, text: '等待中' },
      running: { variant: 'default' as const, icon: Play, text: '运行中' },
      completed: { variant: 'default' as const, icon: CheckCircle2, text: '已完成' },
      failed: { variant: 'destructive' as const, icon: XCircle, text: '失败' },
    };

    const { variant, icon: Icon, text } = config[status];
    
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {text}
      </Badge>
    );
  };

  // 获取重复类型文本
  const getRepeatText = (type: string) => {
    const map = {
      once: '执行一次',
      daily: '每天执行',
      weekly: '每周执行',
    };
    return map[type as keyof typeof map] || type;
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
          <h1 className="text-2xl font-bold text-gray-900">定时任务</h1>
          <p className="text-sm text-gray-600 mt-1">自动化抢购，定时执行</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
              <Plus className="w-4 h-4 mr-2" />
              创建任务
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>创建定时任务</DialogTitle>
              <DialogDescription>
                设置任务名称、目标红包和执行时间
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="task-name">任务名称</Label>
                <Input
                  id="task-name"
                  placeholder="例如：话费红包定时抢购"
                  value={newTask.name}
                  onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gift-id">红包ID</Label>
                <Input
                  id="gift-id"
                  placeholder="输入目标红包ID"
                  value={newTask.giftId}
                  onChange={(e) => setNewTask({ ...newTask, giftId: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduled-time">执行时间</Label>
                <Input
                  id="scheduled-time"
                  type="datetime-local"
                  value={newTask.scheduledTime}
                  onChange={(e) => setNewTask({ ...newTask, scheduledTime: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="repeat-type">重复方式</Label>
                <Select
                  value={newTask.repeatType}
                  onValueChange={(value: any) => setNewTask({ ...newTask, repeatType: value })}
                >
                  <SelectTrigger id="repeat-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">执行一次</SelectItem>
                    <SelectItem value="daily">每天执行</SelectItem>
                    <SelectItem value="weekly">每周执行</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleCreateTask}>
                创建
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 任务列表 */}
      <div className="space-y-4">
        {tasks.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">暂无定时任务</p>
              <p className="text-sm text-gray-400 mb-4">创建任务实现自动化抢购</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                创建第一个任务
              </Button>
            </CardContent>
          </Card>
        ) : (
          tasks.map(task => (
            <Card key={task.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{task.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      <span>目标红包: {task.giftName || task.giftId}</span>
                    </CardDescription>
                  </div>
                  {getStatusBadge(task.status)}
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">执行时间</p>
                    <p className="text-sm font-medium">{task.scheduledTime}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">重复方式</p>
                    <p className="text-sm font-medium">{getRepeatText(task.repeatType)}</p>
                  </div>
                  {task.lastRun && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">上次执行</p>
                      <p className="text-sm font-medium">{task.lastRun}</p>
                    </div>
                  )}
                  {task.nextRun && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">下次执行</p>
                      <p className="text-sm font-medium">{task.nextRun}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {task.status === 'pending' || task.status === 'failed' ? (
                    <Button
                      onClick={() => handleStartTask(task.id)}
                      disabled={actioningIds.has(task.id)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {actioningIds.has(task.id) ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4 mr-2" />
                      )}
                      启动
                    </Button>
                  ) : task.status === 'running' ? (
                    <Button
                      onClick={() => handleStopTask(task.id)}
                      disabled={actioningIds.has(task.id)}
                      size="sm"
                      variant="outline"
                    >
                      {actioningIds.has(task.id) ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Pause className="w-4 h-4 mr-2" />
                      )}
                      停止
                    </Button>
                  ) : null}

                  <Button
                    onClick={() => handleDeleteTask(task.id)}
                    disabled={actioningIds.has(task.id)}
                    size="sm"
                    variant="destructive"
                  >
                    {actioningIds.has(task.id) ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-2" />
                    )}
                    删除
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
