"""
定时任务相关 API
"""
from fastapi import APIRouter, HTTPException
from loguru import logger

from backend.models.schemas import (
    ApiResponse, TaskCreateRequest, TaskUpdateRequest, TaskActionRequest
)
from backend.services.task_service import TaskService
from backend.utils.error_handler import exception_handler, ErrorCategory, ErrorLevel

router = APIRouter()
task_service = TaskService()


@router.get("/list")
@exception_handler(
    level=ErrorLevel.INFO,
    category=ErrorCategory.BUSINESS_LOGIC,
    log_args=False,
    log_result=True
)
async def get_task_list():
    """
    获取任务列表
    """
    tasks = await task_service.get_task_list()
    
    return ApiResponse(
        success=True,
        message="获取成功",
        data={"tasks": tasks}
    )


@router.post("/create")
@exception_handler(
    level=ErrorLevel.INFO,
    category=ErrorCategory.BUSINESS_LOGIC,
    log_args=True,
    log_result=True
)
async def create_task(request: TaskCreateRequest):
    """
    创建新任务
    """
    task = await task_service.create_task(
        name=request.name,
        gift_id=request.giftId,
        scheduled_time=request.scheduledTime,
        repeat_type=request.repeatType
    )
    
    return ApiResponse(
        success=True,
        message="任务创建成功",
        data=task
    )


@router.post("/update")
@exception_handler(
    level=ErrorLevel.INFO,
    category=ErrorCategory.BUSINESS_LOGIC,
    log_args=True,
    log_result=True
)
async def update_task(request: TaskUpdateRequest):
    """
    更新任务
    """
    task = await task_service.update_task(
        task_id=request.taskId,
        name=request.name,
        scheduled_time=request.scheduledTime,
        repeat_type=request.repeatType
    )
    
    return ApiResponse(
        success=True,
        message="任务更新成功",
        data=task
    )


@router.post("/delete")
@exception_handler(
    level=ErrorLevel.INFO,
    category=ErrorCategory.BUSINESS_LOGIC,
    log_args=True,
    log_result=True
)
async def delete_task(request: TaskActionRequest):
    """
    删除任务
    """
    await task_service.delete_task(request.taskId)
    
    return ApiResponse(
        success=True,
        message="任务删除成功"
    )


@router.post("/start")
@exception_handler(
    level=ErrorLevel.INFO,
    category=ErrorCategory.BUSINESS_LOGIC,
    log_args=True,
    log_result=True
)
async def start_task(request: TaskActionRequest):
    """
    启动任务
    """
    await task_service.start_task(request.taskId)
    
    return ApiResponse(
        success=True,
        message="任务已启动"
    )


@router.post("/stop")
@exception_handler(
    level=ErrorLevel.INFO,
    category=ErrorCategory.BUSINESS_LOGIC,
    log_args=True,
    log_result=True
)
async def stop_task(request: TaskActionRequest):
    """
    停止任务
    """
    await task_service.stop_task(request.taskId)
    
    return ApiResponse(
        success=True,
        message="任务已停止"
    )


@router.get("/logs/{task_id}")
@exception_handler(
    level=ErrorLevel.INFO,
    category=ErrorCategory.BUSINESS_LOGIC,
    log_args=True,
    log_result=True
)
async def get_task_logs(task_id: str):
    """
    获取任务日志
    """
    logs = await task_service.get_task_logs(task_id)
    
    return ApiResponse(
        success=True,
        message="获取成功",
        data={"logs": logs}
    )
