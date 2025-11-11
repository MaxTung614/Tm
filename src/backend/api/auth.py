"""
认证相关 API
"""
from fastapi import APIRouter, HTTPException
from loguru import logger
import base64
import uuid
from io import BytesIO
from datetime import datetime, timedelta

from backend.models.schemas import (
    ApiResponse, LoginRequest, UserInfo, 
    QRCodeResponse, QRCodeCheckRequest
)
from backend.services.auth_service import AuthService

router = APIRouter()
auth_service = AuthService()


@router.post("/login")
async def login(request: LoginRequest):
    """
    Cookie 登录
    """
    try:
        logger.info("收到登录请求")
        
        # 验证 Cookie 并获取用户信息
        user_info = await auth_service.login_with_cookie(request.cookie)
        
        if not user_info:
            raise HTTPException(status_code=401, detail="Cookie 无效或已过期")
        
        return ApiResponse(
            success=True,
            message="登录成功",
            data=user_info
        )
    except Exception as e:
        logger.error(f"登录失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/user")
async def get_user_info():
    """
    获取当前用户信息
    """
    try:
        user_info = await auth_service.get_user_info()
        
        if not user_info:
            raise HTTPException(status_code=401, detail="未登录")
        
        return ApiResponse(
            success=True,
            message="获取成功",
            data=user_info
        )
    except Exception as e:
        logger.error(f"获取用户信息失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/logout")
async def logout():
    """
    退出登录
    """
    try:
        await auth_service.logout()
        
        return ApiResponse(
            success=True,
            message="退出成功"
        )
    except Exception as e:
        logger.error(f"退出登录失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/qrcode/generate")
async def generate_qrcode():
    """
    生成登录二维码
    """
    try:
        logger.info("生成二维码")
        
        # 生成二维码
        qr_data = await auth_service.generate_qrcode()
        
        return ApiResponse(
            success=True,
            message="二维码生成成功",
            data=qr_data
        )
    except Exception as e:
        logger.error(f"生成二维码失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/qrcode/check")
async def check_qrcode(request: QRCodeCheckRequest):
    """
    检查二维码扫描状态
    """
    try:
        # 检查二维码状态
        result = await auth_service.check_qrcode(request.qrId)
        
        return ApiResponse(
            success=True,
            message="检查成功",
            data=result
        )
    except Exception as e:
        logger.error(f"检查二维码状态失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
