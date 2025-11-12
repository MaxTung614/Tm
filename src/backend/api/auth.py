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
from backend.utils.error_handler import exception_handler, ErrorCategory, ErrorLevel

router = APIRouter()
auth_service = AuthService()


@router.post("/login")
@exception_handler(
    level=ErrorLevel.INFO,
    category=ErrorCategory.AUTHENTICATION,
    log_args=True,
    log_result=True
)
async def login(request: LoginRequest):
    """
    Cookie 登录
    """
    # 验证 Cookie 并获取用户信息
    user_info = await auth_service.login_with_cookie(request.cookie)
    
    if not user_info:
        raise HTTPException(status_code=401, detail="Cookie 无效或已过期")
    
    return ApiResponse(
        success=True,
        message="登录成功",
        data=user_info
    )


@router.get("/user")
@exception_handler(
    level=ErrorLevel.INFO,
    category=ErrorCategory.AUTHENTICATION,
    log_args=False,
    log_result=True
)
async def get_user_info():
    """
    获取当前用户信息
    """
    user_info = await auth_service.get_user_info()
    
    if not user_info:
        raise HTTPException(status_code=401, detail="未登录")
    
    return ApiResponse(
        success=True,
        message="获取成功",
        data=user_info
    )


@router.post("/logout")
@exception_handler(
    level=ErrorLevel.INFO,
    category=ErrorCategory.AUTHENTICATION,
    log_args=False,
    log_result=True
)
async def logout():
    """
    退出登录
    """
    await auth_service.logout()
    
    return ApiResponse(
        success=True,
        message="退出成功"
    )


@router.post("/qrcode/generate")
@exception_handler(
    level=ErrorLevel.INFO,
    category=ErrorCategory.AUTHENTICATION,
    log_args=False,
    log_result=True
)
async def generate_qrcode():
    """
    生成登录二维码
    """
    # 生成二维码
    qr_data = await auth_service.generate_qrcode()
    
    return ApiResponse(
        success=True,
        message="二维码生成成功",
        data=qr_data
    )


@router.post("/qrcode/check")
@exception_handler(
    level=ErrorLevel.INFO,
    category=ErrorCategory.AUTHENTICATION,
    log_args=True,
    log_result=True
)
async def check_qrcode(request: QRCodeCheckRequest):
    """
    检查二维码扫描状态
    """
    # 检查二维码状态
    result = await auth_service.check_qrcode(request.qrId)
    
    return ApiResponse(
        success=True,
        message="检查成功",
        data=result
    )
