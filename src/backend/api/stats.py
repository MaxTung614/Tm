"""
统计相关 API
"""
from fastapi import APIRouter, HTTPException, Query
from loguru import logger
from typing import Optional

from backend.models.schemas import ApiResponse
from backend.services.stats_service import StatsService
from backend.utils.error_handler import exception_handler, ErrorCategory, ErrorLevel

router = APIRouter()
stats_service = StatsService()


@router.get("/dashboard")
@exception_handler(
    level=ErrorLevel.INFO,
    category=ErrorCategory.BUSINESS_LOGIC,
    log_args=False,
    log_result=True
)
async def get_dashboard_stats():
    """
    获取仪表板统计数据
    """
    stats = await stats_service.get_dashboard_stats()
    
    return ApiResponse(
        success=True,
        message="获取成功",
        data=stats
    )


@router.get("/history")
@exception_handler(
    level=ErrorLevel.INFO,
    category=ErrorCategory.BUSINESS_LOGIC,
    log_args=True,
    log_result=True
)
async def get_history(
    start_date: Optional[str] = Query(None, description="开始日期"),
    end_date: Optional[str] = Query(None, description="结束日期"),
    page: int = Query(1, ge=1, description="页码"),
    pageSize: int = Query(20, ge=1, le=100, description="每页数量")
):
    """
    获取历史记录
    """
    history = await stats_service.get_history(start_date, end_date, page, pageSize)
    
    return ApiResponse(
        success=True,
        message="获取成功",
        data=history
    )
