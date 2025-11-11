"""
定时任务相关 API
"""
from fastapi import APIRouter, HTTPException
from loguru import logger

from backend.models.schemas import (
    ApiResponse, TaskCreateRequest, TaskUpdateRequest, TaskActionRequest
)
from backend.services.task_service import TaskService

router = APIRouter()
task_service = TaskService()


@router.get("/list")
async def get_task_list():
    """
    获取任务列表
    """
    try:
        logger.info("获取任务列表")
        
        tasks = await task_service.get_task_list()
        
        return ApiResponse(
            success=True,
            message="获取成功",
            data={"tasks": tasks}
        )
    except Exception as e:
        logger.error(f"获取任务列表失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/create")
async def create_task(request: TaskCreateRequest):
    """
    创建新任务
    """
    try:
        logger.info(f"创建任务: {request.name}")
        
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
    except Exception as e:
        logger.error(f"创建任务失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/update")
async def update_task(request: TaskUpdateRequest):
    """
    更新任务
    """
    try:
        logger.info(f"更新任务: {request.taskId}")
        
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
    except Exception as e:
        logger.error(f"更新任务失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/delete")
async def delete_task(request: TaskActionRequest):
    """
    删除任务
    """
    try:
        logger.info(f"删除任务: {request.taskId}")
        
        await task_service.delete_task(request.taskId)
        
        return ApiResponse(
            success=True,
            message="任务删除成功"
        )
    except Exception as e:
        logger.error(f"删除任务失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/start")
async def start_task(request: TaskActionRequest):
    """
    启动任务
    """
    try:
        logger.info(f"启动任务: {request.taskId}")
        
        await task_service.start_task(request.taskId)
        
        return ApiResponse(
            success=True,
            message="任务已启动"
        )
    except Exception as e:
        logger.error(f"启动任务失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/stop")
async def stop_task(request: TaskActionRequest):
    """
    停止任务
    """
    try:
        logger.info(f"停止任务: {request.taskId}")
        
        await task_service.stop_task(request.taskId)
        
        return ApiResponse(
            success=True,
            message="任务已停止"
        )
    except Exception as e:
        logger.error(f"停止任务失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/logs/{task_id}")
async def get_task_logs(task_id: str):
    """
    获取任务日志
    """
    try:
        logger.info(f"获取任务日志: {task_id}")
        
        logs = await task_service.get_task_logs(task_id)
        
        return ApiResponse(
            success=True,
            message="获取成功",
            data={"logs": logs}
        )
    except Exception as e:
        logger.error(f"获取任务日志失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
