"""
风控参数相关 API
"""
from fastapi import APIRouter, HTTPException
from loguru import logger
from pydantic import BaseModel

from backend.models.schemas import ApiResponse
from backend.services.risk_params_service import RiskParamsService
from backend.utils.error_handler import exception_handler, ErrorCategory, ErrorLevel

router = APIRouter()
risk_params_service = RiskParamsService()


class UpdateRiskParamsRequest(BaseModel):
    """更新风控参数请求"""
    ua: str = ""
    umidToken: str = ""
    asac: str = ""


@router.get("/get")
@exception_handler(
    level=ErrorLevel.INFO,
    category=ErrorCategory.BUSINESS_LOGIC,
    log_args=False,
    log_result=True
)
async def get_risk_params():
    """
    获取风控参数
    """
    params = await risk_params_service.get_params()
    validation = risk_params_service.get_validation_status()
    
    return ApiResponse(
        success=True,
        message="获取成功",
        data={
            "params": params,
            "validation": validation
        }
    )


@router.post("/update")
@exception_handler(
    level=ErrorLevel.INFO,
    category=ErrorCategory.BUSINESS_LOGIC,
    log_args=True,
    log_result=True
)
async def update_risk_params(request: UpdateRiskParamsRequest):
    """
    更新风控参数
    """
    await risk_params_service.update_params({
        "ua": request.ua,
        "umidToken": request.umidToken,
        "asac": request.asac
    })
    
    return ApiResponse(
        success=True,
        message="风控参数更新成功"
    )


@router.get("/validate")
@exception_handler(
    level=ErrorLevel.INFO,
    category=ErrorCategory.BUSINESS_LOGIC,
    log_args=False,
    log_result=True
)
async def validate_risk_params():
    """
    验证风控参数完整性
    """
    validation = risk_params_service.get_validation_status()
    
    return ApiResponse(
        success=validation["isValid"],
        message="验证完成",
        data=validation
    )
