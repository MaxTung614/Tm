"""
会话健康检查 API 路由
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from loguru import logger
from datetime import datetime

from backend.services.session_health_service import (
    get_session_health_service,
    get_enhanced_health_service
)

router = APIRouter(prefix="/api/session-health", tags=["session-health"])

# 初始化服务
health_service = get_session_health_service()
enhanced_service = get_enhanced_health_service()


class StartHealthCheckRequest(BaseModel):
    """启动健康检查请求"""
    check_interval: Optional[int] = 3600  # 默认1小时
    use_enhanced: Optional[bool] = True  # 是否使用增强服务


class HealthCheckResponse(BaseModel):
    """健康检查响应"""
    success: bool
    message: Optional[str] = None
    data: Optional[dict] = None
    error: Optional[str] = None


@router.post("/start", response_model=HealthCheckResponse)
async def start_health_check(request: StartHealthCheckRequest):
    """
    启动会话健康检查服务
    """
    try:
        # Cookie过期回调
        async def on_cookie_expired(account: dict):
            """Cookie过期处理"""
            logger.warning(
                f"🔔 检测到Cookie过期: {account.get('account_name')} "
                f"(账号ID: {account.get('account_id')})"
            )
            
            # 这里可以发送通知
            # await notification_service.send_notification(...)
        
        # Cookie续期回调
        async def on_cookie_renewed(account: dict):
            """Cookie续期处理"""
            logger.success(
                f"✅ Cookie已恢复: {account.get('account_name')} "
                f"(账号ID: {account.get('account_id')})"
            )
        
        # 选择服务
        service = enhanced_service if request.use_enhanced else health_service
        
        # 启动服务
        result = await service.start(
            check_interval=request.check_interval,
            on_cookie_expired=on_cookie_expired,
            on_cookie_renewed=on_cookie_renewed
        )
        
        if result['success']:
            return HealthCheckResponse(
                success=True,
                message="健康检查服务已启动",
                data=result
            )
        else:
            return HealthCheckResponse(
                success=False,
                error=result.get('error')
            )
    
    except Exception as e:
        logger.error(f"启动健康检查失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/stop")
async def stop_health_check():
    """
    停止会话健康检查服务
    """
    try:
        # 尝试停止两个服务
        result1 = await health_service.stop()
        result2 = await enhanced_service.stop()
        
        # 至少一个成功即可
        if result1['success'] or result2['success']:
            return {
                'success': True,
                'message': '健康检查服务已停止',
                'basic_service': result1,
                'enhanced_service': result2
            }
        else:
            raise HTTPException(status_code=400, detail="服务未运行")
    
    except Exception as e:
        logger.error(f"停止健康检查失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status")
async def get_health_status():
    """
    获取健康检查服务状态
    """
    try:
        basic_status = health_service.get_health_status()
        enhanced_status = enhanced_service.get_health_status()
        
        return {
            'success': True,
            'basic_service': basic_status,
            'enhanced_service': enhanced_status,
            'is_running': basic_status['is_running'] or enhanced_status['is_running']
        }
    
    except Exception as e:
        logger.error(f"获取健康状态失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
async def get_health_stats():
    """
    获取健康检查统计数据
    """
    try:
        basic_stats = health_service.get_stats()
        enhanced_stats = enhanced_service.get_stats()
        
        return {
            'success': True,
            'basic_service': basic_stats,
            'enhanced_service': enhanced_stats,
            'timestamp': datetime.now().isoformat()
        }
    
    except Exception as e:
        logger.error(f"获取统计数据失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/check-all")
async def check_all_accounts():
    """
    立即检查所有账号（不等待定时检查）
    """
    try:
        # 使用正在运行的服务
        if enhanced_service.is_running:
            result = await enhanced_service.check_all_accounts()
        elif health_service.is_running:
            result = await health_service.check_all_accounts()
        else:
            # 如果没有运行，临时创建一个检查
            service = get_enhanced_health_service()
            result = await service.check_all_accounts()
        
        return {
            'success': True,
            'result': result,
            'timestamp': datetime.now().isoformat()
        }
    
    except Exception as e:
        logger.error(f"检查所有账号失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/check-account/{account_id}")
async def check_single_account(account_id: str):
    """
    立即检查指定账号
    """
    try:
        # 使用正在运行的服务
        if enhanced_service.is_running:
            result = await enhanced_service.force_check_account(account_id)
        elif health_service.is_running:
            result = await health_service.force_check_account(account_id)
        else:
            # 如果没有运行，临时创建一个检查
            service = get_enhanced_health_service()
            result = await service.check_account_health(account_id)
        
        if result['success']:
            return {
                'success': True,
                'result': result,
                'timestamp': datetime.now().isoformat()
            }
        else:
            raise HTTPException(status_code=404, detail=result.get('error'))
    
    except Exception as e:
        logger.error(f"检查账号失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
