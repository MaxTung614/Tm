"""
设置相关 API
"""
from fastapi import APIRouter, HTTPException
from loguru import logger

from backend.models.schemas import (
    ApiResponse, Settings, UpdateCookieRequest
)
from backend.services.settings_service import SettingsService
from backend.utils.error_handler import exception_handler, ErrorCategory, ErrorLevel

router = APIRouter()
settings_service = SettingsService()


@router.get("/get")
@exception_handler(
    level=ErrorLevel.INFO,
    category=ErrorCategory.SYSTEM_CONFIG,
    log_args=False,
    log_result=True
)
async def get_settings():
    """
    获取应用设置
    """
    settings = await settings_service.get_settings()
    
    return ApiResponse(
        success=True,
        message="获取成功",
        data=settings
    )


@router.post("/update")
@exception_handler(
    level=ErrorLevel.INFO,
    category=ErrorCategory.SYSTEM_CONFIG,
    log_args=False,
    log_result=True
)
async def update_settings(settings: Settings):
    """
    更新应用设置
    """
    await settings_service.update_settings(settings.dict())
    
    return ApiResponse(
        success=True,
        message="设置已保存"
    )


@router.post("/cookie")
@exception_handler(
    level=ErrorLevel.INFO,
    category=ErrorCategory.SYSTEM_CONFIG,
    log_args=False,
    log_result=True
)
async def update_cookie(request: UpdateCookieRequest):
    """
    更新 Cookie
    """
    await settings_service.update_cookie(request.cookie)
    
    return ApiResponse(
        success=True,
        message="Cookie 已更新"
    )


@router.get("/export")
@exception_handler(
    level=ErrorLevel.INFO,
    category=ErrorCategory.SYSTEM_CONFIG,
    log_args=False,
    log_result=True
)
async def export_data():
    """
    导出数据
    """
    data = await settings_service.export_data()
    
    return ApiResponse(
        success=True,
        message="导出成功",
        data=data
    )
