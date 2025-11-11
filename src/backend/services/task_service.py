"""
任务服务
"""
import uuid
from datetime import datetime
from loguru import logger
from typing import List, Optional
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.date import DateTrigger
from apscheduler.triggers.cron import CronTrigger

from backend.services.gift_service import GiftService


class TaskService:
    """任务服务类"""
    
    def __init__(self):
        self.scheduler = BackgroundScheduler()
        self.scheduler.start()
        self.tasks = {}  # 存储任务信息
        self.gift_service = GiftService()
    
    async def get_task_list(self) -> List[dict]:
        """
        获取任务列表
        """
        try:
            return list(self.tasks.values())
        except Exception as e:
            logger.error(f"获取任务列表失败: {str(e)}")
            raise
    
    async def create_task(self, name: str, gift_id: str, scheduled_time: str, repeat_type: str) -> dict:
        """
        创建新任务
        """
        try:
            task_id = str(uuid.uuid4())
            
            # 解析调度时间
            scheduled_dt = datetime.fromisoformat(scheduled_time.replace('Z', '+00:00'))
            
            # 创建触发器
            if repeat_type == "once":
                trigger = DateTrigger(run_date=scheduled_dt)
            elif repeat_type == "daily":
                trigger = CronTrigger(hour=scheduled_dt.hour, minute=scheduled_dt.minute)
            elif repeat_type == "weekly":
                trigger = CronTrigger(
                    day_of_week=scheduled_dt.weekday(),
                    hour=scheduled_dt.hour,
                    minute=scheduled_dt.minute
                )
            else:
                raise ValueError(f"不支持的重复类型: {repeat_type}")
            
            # 添加任务到调度器
            job = self.scheduler.add_job(
                self._execute_task,
                trigger=trigger,
                args=[task_id, gift_id],
                id=task_id
            )
            
            # 计算下次执行时间
            next_run = job.next_run_time.isoformat() if job.next_run_time else None
            
            # 保存任务信息
            task = {
                "id": task_id,
                "name": name,
                "giftId": gift_id,
                "giftName": None,
                "scheduledTime": scheduled_time,
                "repeatType": repeat_type,
                "status": "pending",
                "lastRun": None,
                "nextRun": next_run,
                "createdAt": datetime.now().isoformat()
            }
            
            self.tasks[task_id] = task
            
            logger.info(f"任务创建成功: {task_id}")
            return task
        except Exception as e:
            logger.error(f"创建任务失败: {str(e)}")
            raise
    
    async def update_task(self, task_id: str, name: Optional[str] = None, 
                         scheduled_time: Optional[str] = None, 
                         repeat_type: Optional[str] = None) -> dict:
        """
        更新任务
        """
        try:
            if task_id not in self.tasks:
                raise ValueError("任务不存在")
            
            task = self.tasks[task_id]
            
            # 更新字段
            if name:
                task["name"] = name
            if scheduled_time:
                task["scheduledTime"] = scheduled_time
            if repeat_type:
                task["repeatType"] = repeat_type
            
            # 如果修改了时间或重复类型，需要重新调度
            if scheduled_time or repeat_type:
                # 移除旧任务
                self.scheduler.remove_job(task_id)
                
                # 重新添加（这里简化处理，实际应该重用 create_task 的逻辑）
                scheduled_dt = datetime.fromisoformat(scheduled_time or task["scheduledTime"])
                if repeat_type == "once" or (not repeat_type and task["repeatType"] == "once"):
                    trigger = DateTrigger(run_date=scheduled_dt)
                elif repeat_type == "daily" or (not repeat_type and task["repeatType"] == "daily"):
                    trigger = CronTrigger(hour=scheduled_dt.hour, minute=scheduled_dt.minute)
                else:
                    trigger = CronTrigger(
                        day_of_week=scheduled_dt.weekday(),
                        hour=scheduled_dt.hour,
                        minute=scheduled_dt.minute
                    )
                
                job = self.scheduler.add_job(
                    self._execute_task,
                    trigger=trigger,
                    args=[task_id, task["giftId"]],
                    id=task_id
                )
                
                task["nextRun"] = job.next_run_time.isoformat() if job.next_run_time else None
            
            logger.info(f"任务更新成功: {task_id}")
            return task
        except Exception as e:
            logger.error(f"更新任务失败: {str(e)}")
            raise
    
    async def delete_task(self, task_id: str):
        """
        删除任务
        """
        try:
            if task_id not in self.tasks:
                raise ValueError("任务不存在")
            
            # 从调度器移除
            try:
                self.scheduler.remove_job(task_id)
            except:
                pass
            
            # 从存储删除
            del self.tasks[task_id]
            
            logger.info(f"任务删除成功: {task_id}")
        except Exception as e:
            logger.error(f"删除任务失败: {str(e)}")
            raise
    
    async def start_task(self, task_id: str):
        """
        启动任务
        """
        try:
            if task_id not in self.tasks:
                raise ValueError("任务不存在")
            
            task = self.tasks[task_id]
            
            # 恢复调度器中的任务
            try:
                self.scheduler.resume_job(task_id)
            except:
                # 如果任务不在调度器中，重新添加
                scheduled_dt = datetime.fromisoformat(task["scheduledTime"])
                if task["repeatType"] == "once":
                    trigger = DateTrigger(run_date=scheduled_dt)
                elif task["repeatType"] == "daily":
                    trigger = CronTrigger(hour=scheduled_dt.hour, minute=scheduled_dt.minute)
                else:
                    trigger = CronTrigger(
                        day_of_week=scheduled_dt.weekday(),
                        hour=scheduled_dt.hour,
                        minute=scheduled_dt.minute
                    )
                
                self.scheduler.add_job(
                    self._execute_task,
                    trigger=trigger,
                    args=[task_id, task["giftId"]],
                    id=task_id
                )
            
            task["status"] = "running"
            
            logger.info(f"任务启动成功: {task_id}")
        except Exception as e:
            logger.error(f"启动任务失败: {str(e)}")
            raise
    
    async def stop_task(self, task_id: str):
        """
        停止任务
        """
        try:
            if task_id not in self.tasks:
                raise ValueError("任务不存在")
            
            task = self.tasks[task_id]
            
            # 暂停调度器中的任务
            try:
                self.scheduler.pause_job(task_id)
            except:
                pass
            
            task["status"] = "pending"
            
            logger.info(f"任务停止成功: {task_id}")
        except Exception as e:
            logger.error(f"停止任务失败: {str(e)}")
            raise
    
    async def get_task_logs(self, task_id: str) -> List[dict]:
        """
        获取任务日志
        """
        try:
            # 暂时返回模拟日志
            return [
                {
                    "timestamp": datetime.now().isoformat(),
                    "level": "info",
                    "message": "任务执行成功"
                }
            ]
        except Exception as e:
            logger.error(f"获取任务日志失败: {str(e)}")
            raise
    
    async def _execute_task(self, task_id: str, gift_id: str):
        """
        执行任务（内部方法）
        """
        try:
            logger.info(f"执行任务: {task_id}, 礼品: {gift_id}")
            
            if task_id not in self.tasks:
                logger.warning(f"任务不存在: {task_id}")
                return
            
            task = self.tasks[task_id]
            task["status"] = "running"
            
            # 执行抢购
            result = await self.gift_service.grab_gift(gift_id)
            
            # 更新任务状态
            task["lastRun"] = datetime.now().isoformat()
            
            if result.get("success"):
                logger.info(f"任务执行成功: {task_id}")
                if task["repeatType"] == "once":
                    task["status"] = "completed"
                else:
                    task["status"] = "pending"
            else:
                logger.error(f"任务执行失败: {task_id}, 原因: {result.get('message')}")
                if task["repeatType"] == "once":
                    task["status"] = "failed"
                else:
                    task["status"] = "pending"
            
            # 更新下次执行时间
            job = self.scheduler.get_job(task_id)
            if job and job.next_run_time:
                task["nextRun"] = job.next_run_time.isoformat()
            else:
                task["nextRun"] = None
                
        except Exception as e:
            logger.error(f"任务执行异常: {task_id}, 错误: {str(e)}")
            if task_id in self.tasks:
                self.tasks[task_id]["status"] = "failed"
