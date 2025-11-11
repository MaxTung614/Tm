"""
统计相关 API
"""
from fastapi import APIRouter, HTTPException, Query
from loguru import logger
from typing import Optional

from backend.models.schemas import ApiResponse
from backend.services.stats_service import StatsService

router = APIRouter()
stats_service = StatsService()


@router.get("/dashboard")
async def get_dashboard_stats():
    """
    获取仪表板统计数据
    """
    try:
        logger.info("获取仪表板统计")
        
        stats = await stats_service.get_dashboard_stats()
        
        return ApiResponse(
            success=True,
            message="获取成功",
            data=stats
        )
    except Exception as e:
        logger.error(f"获取统计数据失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history")
async def get_history(
    start_date: Optional[str] = Query(None, description="开始日期"),
    end_date: Optional[str] = Query(None, description="结束日期"),
    page: int = Query(1, ge=1, description="页码"),
    pageSize: int = Query(20, ge=1, le=100, description="每页数量")
):
    """
    获取历史记录
    """
    try:
        logger.info(f"获取历史记录: {start_date} ~ {end_date}")
        
        history = await stats_service.get_history(start_date, end_date, page, pageSize)
        
        return ApiResponse(
            success=True,
            message="获取成功",
            data=history
        )
    except Exception as e:
        logger.error(f"获取历史记录失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
