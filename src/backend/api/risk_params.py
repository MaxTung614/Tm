"""
风控参数相关 API
"""
from fastapi import APIRouter, HTTPException
from loguru import logger
from pydantic import BaseModel

from backend.models.schemas import ApiResponse
from backend.services.risk_params_service import RiskParamsService

router = APIRouter()
risk_params_service = RiskParamsService()


class UpdateRiskParamsRequest(BaseModel):
    """更新风控参数请求"""
    ua: str = ""
    umidToken: str = ""
    asac: str = ""


@router.get("/get")
async def get_risk_params():
    """
    获取风控参数
    """
    try:
        logger.info("获取风控参数")
        
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
    except Exception as e:
        logger.error(f"获取风控参数失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/update")
async def update_risk_params(request: UpdateRiskParamsRequest):
    """
    更新风控参数
    """
    try:
        logger.info("更新风控参数")
        
        await risk_params_service.update_params({
            "ua": request.ua,
            "umidToken": request.umidToken,
            "asac": request.asac
        })
        
        return ApiResponse(
            success=True,
            message="风控参数更新成功"
        )
    except Exception as e:
        logger.error(f"更新风控参数失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/validate")
async def validate_risk_params():
    """
    验证风控参数完整性
    """
    try:
        logger.info("验证风控参数")
        
        validation = risk_params_service.get_validation_status()
        
        return ApiResponse(
            success=validation["isValid"],
            message="验证完成",
            data=validation
        )
    except Exception as e:
        logger.error(f"验证风控参数失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
