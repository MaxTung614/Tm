"""
礼品相关 API
"""
from fastapi import APIRouter, HTTPException, Query
from loguru import logger
from typing import Optional

from backend.models.schemas import (
    ApiResponse, GiftListRequest, GiftGrabRequest, BatchGrabRequest
)
from backend.services.gift_service import GiftService

router = APIRouter()
gift_service = GiftService()


@router.get("/list")
async def get_gift_list(
    status: Optional[str] = Query(None, description="状态筛选"),
    type: Optional[str] = Query(None, description="类型筛选: redPacket"),
    page: int = Query(1, ge=1, description="页码"),
    pageSize: int = Query(20, ge=1, le=100, description="每页数量")
):
    """
    获取礼品列表
    """
    try:
        logger.info(f"获取礼品列表: status={status}, type={type}, page={page}, pageSize={pageSize}")
        
        result = await gift_service.get_gift_list(status, type, page, pageSize)
        
        return ApiResponse(
            success=True,
            message="获取成功",
            data=result
        )
    except Exception as e:
        logger.error(f"获取礼品列表失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/grab")
async def grab_gift(request: GiftGrabRequest):
    """
    抢购单个礼品
    """
    try:
        logger.info(f"抢购礼品: {request.giftId}")
        
        result = await gift_service.grab_gift(request.giftId)
        
        if not result.get("success"):
            return ApiResponse(
                success=False,
                message=result.get("message", "抢购失败"),
                data=result
            )
        
        return ApiResponse(
            success=True,
            message="抢购成功",
            data=result
        )
    except Exception as e:
        logger.error(f"抢购失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/batch-grab")
async def batch_grab_gifts(request: BatchGrabRequest):
    """
    批量抢购礼品
    """
    try:
        logger.info(f"批量抢购: {len(request.giftIds)} 个礼品")
        
        result = await gift_service.batch_grab_gifts(request.giftIds)
        
        return ApiResponse(
            success=True,
            message="批量抢购完成",
            data=result
        )
    except Exception as e:
        logger.error(f"批量抢购失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status/{gift_id}")
async def get_gift_status(gift_id: str):
    """
    获取礼品状态
    """
    try:
        logger.info(f"获取礼品状态: {gift_id}")
        
        result = await gift_service.get_gift_status(gift_id)
        
        return ApiResponse(
            success=True,
            message="获取成功",
            data=result
        )
    except Exception as e:
        logger.error(f"获取礼品状态失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))