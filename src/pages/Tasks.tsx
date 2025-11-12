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
import { toast } from 'sonner';
import { taskService } from '../lib/api-services';
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
    if (!navigator.onLine) {
      logWarning('网络连接已断开，无法加载任务列表', {
        operation: 'load_tasks',
        component: 'Tasks'
      });
      
      toast.error('网络连接已断开，请检查网络设置后重试', {
        duration: 5000,
      });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    try {
      logInfo('开始加载任务列表', {
        operation: 'load_tasks',
        timestamp: new Date().toISOString()
      });

      const response = await taskService.getTaskList();
      
      if (response.success && response.data) {
        const taskList = response.data.tasks || [];
        
        logInfo(`任务列表加载完成，共 ${taskList.length} 个任务`, {
          operation: 'load_tasks',
          taskCount: taskList.length,
          timestamp: new Date().toISOString()
        });

        setTasks(taskList);
      } else {
        throw new Error(response.message || '响应数据格式异常');
      }

    } catch (error: any) {
      const errorInfo = logError(error, {
        operation: 'load_tasks',
        component: 'Tasks',
        timestamp: new Date().toISOString()
      });

      // 使用统一的错误处理生成用户友好提示
      const errorCategory = error.message?.includes('timeout') ? ErrorCategory.NETWORK_TIMEOUT :
                           error.message?.includes('401') ? ErrorCategory.AUTHENTICATION :
                           error.message?.includes('network') ? ErrorCategory.NETWORK :
                           ErrorCategory.DATA_FETCHING;
      
      const errorId = generateErrorId();
      const userMessage = createUserFriendlyMessage(error, errorCategory, errorId, 'loadTasks');

      toast.error(userMessage, {
        description: `错误ID: ${errorId}`,
        duration: 6000,
      });

    } finally {
      setIsLoading(false);
    }
  };

  // 创建任务
  const handleCreateTask = async () => {
    // 表单验证
    if (!newTask.name?.trim()) {
      logWarning('任务创建失败：任务名称不能为空', {
        operation: 'create_task',
        reason: 'empty_task_name'
      });
      
      toast.error('请填写任务名称', {
        duration: 3000,
      });
      return;
    }

    if (!newTask.giftId?.trim()) {
      logWarning('任务创建失败：红包ID不能为空', {
        operation: 'create_task',
        reason: 'empty_gift_id',
        taskName: newTask.name
      });
      
      toast.error('请填写红包ID', {
        duration: 3000,
      });
      return;
    }

    if (!newTask.scheduledTime) {
      logWarning('任务创建失败：执行时间不能为空', {
        operation: 'create_task',
        reason: 'empty_scheduled_time',
        taskName: newTask.name,
        giftId: newTask.giftId
      });
      
      toast.error('请选择执行时间', {
        duration: 3000,
      });
      return;
    }

    // 检查时间是否在未来
    const scheduledDate = new Date(newTask.scheduledTime);
    const now = new Date();
    
    if (scheduledDate <= now) {
      logWarning('任务创建失败：执行时间不能是过去时间', {
        operation: 'create_task',
        reason: 'invalid_scheduled_time',
        taskName: newTask.name,
        scheduledTime: newTask.scheduledTime,
        currentTime: now.toISOString()
      });
      
      toast.error('执行时间必须是未来时间', {
        duration: 3000,
      });
      return;
    }

    // 检查网络状态
    if (!navigator.onLine) {
      logError('网络连接已断开，无法创建任务', {
        operation: 'create_task',
        taskName: newTask.name,
        networkStatus: 'offline'
      });

      toast.error('网络连接已断开，请检查网络设置后重试', {
        duration: 5000,
      });
      return;
    }

    try {
      logInfo('开始创建任务', {
        operation: 'create_task',
        taskName: newTask.name,
        giftId: newTask.giftId,
        scheduledTime: newTask.scheduledTime,
        repeatType: newTask.repeatType,
        timestamp: new Date().toISOString()
      });

      toast.loading('正在创建任务...', { id: 'create-task' });

      // 调用API创建任务
      const response = await taskService.createTask(newTask);
      
      if (response.success && response.data) {
        const createdTask = response.data;
        
        logInfo('任务创建成功', {
          operation: 'create_task',
          taskId: createdTask.id,
          taskName: createdTask.name,
          success: true
        });

        toast.success('任务创建成功！', {
          description: `任务 "${createdTask.name}" 已创建`,
          duration: 4000,
          id: 'create-task'
        });

        // 重置表单
        setNewTask({
          name: '',
          giftId: '',
          scheduledTime: '',
          repeatType: 'once',
        });
        
        setIsDialogOpen(false);
        
        // 重新加载任务列表
        await loadTasks();
        
      } else {
        throw new Error(response.message || '创建任务失败');
      }

    } catch (error: any) {
      const errorId = generateErrorId();
      
      logError('任务创建失败', {
        operation: 'create_task',
        taskName: newTask.name,
        error: error.message,
        errorId,
        timestamp: new Date().toISOString()
      });

      // 生成用户友好的错误消息
      const errorCategory = error.message?.includes('timeout') ? ErrorCategory.NETWORK_TIMEOUT :
                           error.message?.includes('401') ? ErrorCategory.AUTHENTICATION :
                           error.message?.includes('network') ? ErrorCategory.NETWORK :
                           ErrorCategory.DATA_OPERATION;
      
      const userMessage = createUserFriendlyMessage(error, errorCategory, errorId, 'createTask');
      
      toast.error(userMessage, {
        description: `错误ID: ${errorId}`,
        duration: 6000,
        id: 'create-task'
      });
    }
  };

  /**
   * 执行任务操作（启动/停止/删除）的通用方法
   * 包含重试机制和统一错误处理
   */
  const executeTaskOperation = async (
    operation: 'start' | 'stop' | 'delete',
    taskId: string,
    taskName: string,
    taskServiceMethod: (id: string) => Promise<any>
  ): Promise<void> => {
    // 检查网络状态
    if (!navigator.onLine) {
      const operationName = operation === 'start' ? '启动' : operation === 'stop' ? '停止' : '删除';
      logError(`网络连接已断开，无法${operationName}任务`, {
        operation: `${operation}_task`,
        taskId,
        taskName,
        networkStatus: 'offline'
      });

      toast.error(`网络连接已断开，无法${operationName}任务，请检查网络设置后重试`, {
        duration: 5000,
      });
      return;
    }

    setActioningIds(prev => new Set(prev).add(taskId));
    
    try {
      logInfo(`开始${operation === 'start' ? '启动' : operation === 'stop' ? '停止' : '删除'}任务: ${taskName}`, {
        operation: `${operation}_task`,
        taskId,
        taskName,
        timestamp: new Date().toISOString()
      });

      // 显示加载状态
      const operationName = operation === 'start' ? '启动' : operation === 'stop' ? '停止' : '删除';
      toast.loading(`正在${operationName}任务...`, { id: `task-${operation}-${taskId}` });

      const response = await taskServiceMethod(taskId);
      
      if (response.success) {
        logInfo(`任务${operation === 'start' ? '启动' : operation === 'stop' ? '停止' : '删除'}成功: ${taskName}`, {
          operation: `${operation}_task`,
          taskId,
          taskName,
          success: true
        });

        const successMessages = {
          start: { title: '任务已启动', description: `${taskName} 正在运行中` },
          stop: { title: '任务已停止', description: `${taskName} 已暂停` },
          delete: { title: '任务已删除', description: `${taskName} 已被移除` }
        };

        const successMsg = successMessages[operation];
        
        toast.success(successMsg.title, {
          description: successMsg.description,
          duration: 4000,
          id: `task-${operation}-${taskId}`
        });

        await loadTasks();

      } else {
        throw new Error(response.message || '启动任务失败');
      }

    } catch (error: any) {
      const errorId = generateErrorId();
      
      logError(error, {
        operation: 'start_task',
        taskId,
        taskName,
        component: 'Tasks',
        errorId,
        timestamp: new Date().toISOString()
      });

      // 使用统一的错误处理生成用户友好提示
      const errorCategory = error.message?.includes('timeout') ? ErrorCategory.NETWORK_TIMEOUT :
                           error.message?.includes('401') ? ErrorCategory.AUTHENTICATION :
                           error.message?.includes('not_found') ? ErrorCategory.RESOURCE_NOT_FOUND :
                           error.message?.includes('already_running') ? ErrorCategory.BUSINESS_LOGIC :
                           ErrorCategory.TASK_OPERATION;
      
      const userMessage = createUserFriendlyMessage(error, errorCategory, errorId, 'handleStartTask');

      toast.error(userMessage, {
        description: `错误ID: ${errorId}`,
        duration: 5000,
      });

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
    const task = tasks.find(t => t.id === taskId);
    const taskName = task?.name || '未知任务';
    
    // 检查网络状态
    if (!navigator.onLine) {
      logError('网络连接已断开，无法停止任务', {
        operation: 'stop_task',
        taskId,
        taskName,
        networkStatus: 'offline'
      });

      toast.error('网络连接已断开，请检查网络设置后重试', {
        duration: 5000,
      });
      return;
    }

    setActioningIds(prev => new Set(prev).add(taskId));
    
    try {
      logInfo(`开始停止任务: ${taskName}`, {
        operation: 'stop_task',
        taskId,
        taskName,
        timestamp: new Date().toISOString()
      });

      const response = await taskService.stopTask(taskId);
      
      if (response.success) {
        logInfo(`任务停止成功: ${taskName}`, {
          operation: 'stop_task',
          taskId,
          taskName
        });

        toast.success('任务已停止', {
          description: `${taskName} 已停止运行`,
          duration: 3000,
        });

        await loadTasks();

      } else {
        throw new Error(response.message || '停止任务失败');
      }

    } catch (error: any) {
      const errorId = generateErrorId();
      
      logError(error, {
        operation: 'stop_task',
        taskId,
        taskName,
        component: 'Tasks',
        errorId,
        timestamp: new Date().toISOString()
      });

      // 使用统一的错误处理生成用户友好提示
      const errorCategory = error.message?.includes('timeout') ? ErrorCategory.NETWORK_TIMEOUT :
                           error.message?.includes('401') ? ErrorCategory.AUTHENTICATION :
                           error.message?.includes('not_found') ? ErrorCategory.RESOURCE_NOT_FOUND :
                           error.message?.includes('not_running') ? ErrorCategory.BUSINESS_LOGIC :
                           ErrorCategory.TASK_OPERATION;
      
      const userMessage = createUserFriendlyMessage(error, errorCategory, errorId, 'handleStopTask');

      toast.error(userMessage, {
        description: `错误ID: ${errorId}`,
        duration: 5000,
      });

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
    const task = tasks.find(t => t.id === taskId);
    const taskName = task?.name || '未知任务';
    
    // 显示确认对话框
    const confirmed = window.confirm(`确定要删除任务 "${taskName}" 吗？\n\n此操作不可恢复。`);
    
    if (!confirmed) {
      logInfo('用户取消删除任务', {
        operation: 'delete_task',
        taskId,
        taskName,
        reason: 'user_cancelled'
      });
      return;
    }

    // 检查网络状态
    if (!navigator.onLine) {
      logError('网络连接已断开，无法删除任务', {
        operation: 'delete_task',
        taskId,
        taskName,
        networkStatus: 'offline'
      });

      toast.error('网络连接已断开，请检查网络设置后重试', {
        duration: 5000,
      });
      return;
    }

    setActioningIds(prev => new Set(prev).add(taskId));
    
    try {
      logInfo(`开始删除任务: ${taskName}`, {
        operation: 'delete_task',
        taskId,
        taskName,
        timestamp: new Date().toISOString()
      });

      const response = await taskService.deleteTask(taskId);
      
      if (response.success) {
        logInfo(`任务删除成功: ${taskName}`, {
          operation: 'delete_task',
          taskId,
          taskName,
          deletedAt: new Date().toISOString()
        });

        toast.success('任务已删除', {
          description: `${taskName} 已从任务列表中移除`,
          duration: 3000,
        });

        await loadTasks();

      } else {
        throw new Error(response.message || '删除任务失败');
      }

    } catch (error: any) {
      const errorId = generateErrorId();
      
      logError(error, {
        operation: 'delete_task',
        taskId,
        taskName,
        component: 'Tasks',
        errorId,
        timestamp: new Date().toISOString()
      });

      // 使用统一的错误处理生成用户友好提示
      const errorCategory = error.message?.includes('timeout') ? ErrorCategory.NETWORK_TIMEOUT :
                           error.message?.includes('401') ? ErrorCategory.AUTHENTICATION :
                           error.message?.includes('not_found') ? ErrorCategory.RESOURCE_NOT_FOUND :
                           error.message?.includes('running') ? ErrorCategory.BUSINESS_LOGIC :
                           ErrorCategory.TASK_OPERATION;
      
      const userMessage = createUserFriendlyMessage(error, errorCategory, errorId, 'handleDeleteTask');

      toast.error(userMessage, {
        description: `错误ID: ${errorId}`,
        duration: 5000,
      });

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
