"""
设置相关 API
"""
from fastapi import APIRouter, HTTPException
from loguru import logger

from backend.models.schemas import (
    ApiResponse, Settings, UpdateCookieRequest
)
from backend.services.settings_service import SettingsService

router = APIRouter()
settings_service = SettingsService()


@router.get("/get")
async def get_settings():
    """
    获取应用设置
    """
    try:
        logger.info("获取设置")
        
        settings = await settings_service.get_settings()
        
        return ApiResponse(
            success=True,
            message="获取成功",
            data=settings
        )
    except Exception as e:
        logger.error(f"获取设置失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/update")
async def update_settings(settings: Settings):
    """
    更新应用设置
    """
    try:
        logger.info("更新设置")
        
        await settings_service.update_settings(settings.dict())
        
        return ApiResponse(
            success=True,
            message="设置已保存"
        )
    except Exception as e:
        logger.error(f"更新设置失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/cookie")
async def update_cookie(request: UpdateCookieRequest):
    """
    更新 Cookie
    """
    try:
        logger.info("更新 Cookie")
        
        await settings_service.update_cookie(request.cookie)
        
        return ApiResponse(
            success=True,
            message="Cookie 已更新"
        )
    except Exception as e:
        logger.error(f"更新 Cookie 失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/export")
async def export_data():
    """
    导出数据
    """
    try:
        logger.info("导出数据")
        
        data = await settings_service.export_data()
        
        return ApiResponse(
            success=True,
            message="导出成功",
            data=data
        )
    except Exception as e:
        logger.error(f"导出数据失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
