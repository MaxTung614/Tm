"""
账号管理 API
"""
from fastapi import APIRouter, HTTPException
from loguru import logger
from pydantic import BaseModel
from typing import Optional

from backend.models.schemas import ApiResponse
from backend.services.account_service import AccountService
from backend.utils.error_handler import exception_handler, ErrorCategory, ErrorLevel

router = APIRouter()
account_service = AccountService()


class AddAccountRequest(BaseModel):
    """添加账号请求"""
    account_name: str
    cookies: str
    notes: Optional[str] = ""


class UpdateCookieRequest(BaseModel):
    """更新 Cookie 请求"""
    cookies: str


class SwitchAccountRequest(BaseModel):
    """切换账号请求"""
    account_id: str


@router.get("/list")
@exception_handler(
    level=ErrorLevel.INFO,
    category=ErrorCategory.BUSINESS_LOGIC,
    log_args=False,
    log_result=True
)
async def get_accounts():
    """
    获取所有账号列表
    """
    accounts = account_service.get_all_accounts()
    
    return ApiResponse(
        success=True,
        message="获取成功",
        data={
            "accounts": accounts,
            "total": len(accounts)
        }
    )


@router.get("/current")
@exception_handler(
    level=ErrorLevel.INFO,
    category=ErrorCategory.BUSINESS_LOGIC,
    log_args=False,
    log_result=True
)
async def get_current_account():
    """
    获取当前使用的账号
    """
    account = account_service.get_current_account()
    
    if not account:
        return ApiResponse(
            success=False,
            message="当前没有活跃账号",
            data=None
        )
    
    # 不返回 Cookie（安全考虑）
    safe_account = {
        "account_id": account.get("account_id"),
        "account_name": account.get("account_name"),
        "login_time": account.get("login_time"),
        "last_used": account.get("last_used"),
        "status": account.get("status"),
        "notes": account.get("notes")
    }
    
    return ApiResponse(
        success=True,
        message="获取成功",
        data=safe_account
    )


@router.get("/{account_id}")
@exception_handler(
    level=ErrorLevel.INFO,
    category=ErrorCategory.BUSINESS_LOGIC,
    log_args=True,
    log_result=True
)
async def get_account(account_id: str):
    """
    获取指定账号信息
    """
    account = account_service.get_account(account_id)
    
    if not account:
        return ApiResponse(
            success=False,
            message="账号不存在",
            data=None
        )
    
    # 不返回 Cookie（安全考虑）
    safe_account = {
        "account_id": account.get("account_id"),
        "account_name": account.get("account_name"),
        "login_time": account.get("login_time"),
        "last_used": account.get("last_used"),
        "status": account.get("status"),
        "notes": account.get("notes")
    }
    
    return ApiResponse(
        success=True,
        message="获取成功",
        data=safe_account
    )


@router.post("/add")
@exception_handler(
    level=ErrorLevel.INFO,
    category=ErrorCategory.BUSINESS_LOGIC,
    log_args=True,
    log_result=True
)
async def add_account(request: AddAccountRequest):
    """
    添加新账号
    """
    account_id = account_service.add_account_from_qrcode(
        account_name=request.account_name,
        cookies=request.cookies,
        notes=request.notes
    )
    
    if not account_id:
        return ApiResponse(
            success=False,
            message="添加账号失败",
            data=None
        )
    
    return ApiResponse(
        success=True,
        message="添加账号成功",
        data={
            "account_id": account_id,
            "account_name": request.account_name
        }
    )


@router.put("/{account_id}/cookie")
@exception_handler(
    level=ErrorLevel.INFO,
    category=ErrorCategory.BUSINESS_LOGIC,
    log_args=True,
    log_result=True
)
async def update_cookie(account_id: str, request: UpdateCookieRequest):
    """
    更新账号的 Cookie
    """
    success = account_service.update_account_cookie(
        account_id=account_id,
        cookies=request.cookies
    )
    
    if not success:
        return ApiResponse(
            success=False,
            message="更新 Cookie 失败",
            data=None
        )
    
    return ApiResponse(
        success=True,
        message="更新 Cookie 成功",
        data={"account_id": account_id}
    )


@router.post("/switch")
@exception_handler(
    level=ErrorLevel.INFO,
    category=ErrorCategory.BUSINESS_LOGIC,
    log_args=True,
    log_result=True
)
async def switch_account(request: SwitchAccountRequest):
    """
    切换到指定账号
    """
    success = account_service.switch_account(request.account_id)
    
    if not success:
        return ApiResponse(
            success=False,
            message="切换账号失败",
            data=None
        )
    
    return ApiResponse(
        success=True,
        message="切换账号成功",
        data={"account_id": request.account_id}
    )


@router.delete("/{account_id}")
@exception_handler(
    level=ErrorLevel.INFO,
    category=ErrorCategory.BUSINESS_LOGIC,
    log_args=True,
    log_result=True
)
async def delete_account(account_id: str):
    """
    删除账号
    """
    success = account_service.delete_account(account_id)
    
    if not success:
        return ApiResponse(
            success=False,
            message="删除账号失败",
            data=None
        )
    
    return ApiResponse(
        success=True,
        message="删除账号成功",
        data={"account_id": account_id}
    )


@router.get("/{account_id}/validate")
@exception_handler(
    level=ErrorLevel.INFO,
    category=ErrorCategory.BUSINESS_LOGIC,
    log_args=True,
    log_result=True
)
async def validate_account(account_id: str):
    """
    验证账号状态
    """
    result = account_service.validate_account(account_id)
    
    return ApiResponse(
        success=result.get("valid", False),
        message=result.get("message", "验证失败"),
        data=result
    )
