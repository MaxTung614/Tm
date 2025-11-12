"""
监控 API 路由
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from loguru import logger

from backend.services.websocket_monitor_service import (
    get_monitor_service,
    get_optimized_monitor_service
)
from backend.services.gift_service import GiftService

router = APIRouter(prefix="/api/monitor", tags=["monitor"])

# 初始化服务
monitor_service = get_monitor_service()
optimized_service = get_optimized_monitor_service()
gift_service = GiftService()


class StartMonitorRequest(BaseModel):
    """启动监控请求"""
    account_id: str
    gift_ids: Optional[List[str]] = None
    check_interval: Optional[float] = 0.5
    use_adaptive: Optional[bool] = True  # 是否使用自适应监控


class MonitorResponse(BaseModel):
    """监控响应"""
    success: bool
    monitor_id: Optional[str] = None
    config: Optional[dict] = None
    error: Optional[str] = None


@router.post("/start", response_model=MonitorResponse)
async def start_monitor(request: StartMonitorRequest):
    """
    启动礼包监控
    """
    try:
        # 生成监控ID
        monitor_id = f"monitor_{request.account_id}_{int(datetime.now().timestamp())}"
        
        # 定义状态变化回调
        async def on_status_change(change_info: dict):
            """状态变化回调 - 触发抢购"""
            if change_info.get('became_available'):
                logger.info(
                    f"🎯 触发抢购: {change_info['gift_name']} "
                    f"{change_info['gift_amount']}元"
                )
                
                # 这里可以触发自动抢购
                # await gift_service.redeem_gift(...)
                
                # 记录触发时间
                logger.success(
                    f"⚡ 响应时间: {change_info['response_time_ms']:.2f}ms"
                )
        
        # 选择监控服务
        if request.use_adaptive:
            # 使用自适应监控
            result = await optimized_service.start_adaptive_monitor(
                monitor_id=monitor_id,
                account_id=request.account_id,
                gift_ids=request.gift_ids,
                min_interval=0.3,  # 300ms
                max_interval=2.0,  # 2s
                on_status_change=on_status_change
            )
        else:
            # 使用固定间隔监控
            result = await monitor_service.start_monitor(
                monitor_id=monitor_id,
                account_id=request.account_id,
                gift_ids=request.gift_ids,
                check_interval=request.check_interval,
                on_status_change=on_status_change
            )
        
        if result['success']:
            return MonitorResponse(
                success=True,
                monitor_id=monitor_id,
                config=result.get('config')
            )
        else:
            return MonitorResponse(
                success=False,
                error=result.get('error')
            )
            
    except Exception as e:
        logger.error(f"启动监控失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/stop/{monitor_id}")
async def stop_monitor(monitor_id: str):
    """
    停止监控任务
    """
    try:
        # 尝试从两个服务中停止
        result = await monitor_service.stop_monitor(monitor_id)
        if not result['success']:
            result = await optimized_service.stop_monitor(monitor_id)
        
        if result['success']:
            return result
        else:
            raise HTTPException(status_code=404, detail=result.get('error'))
            
    except Exception as e:
        logger.error(f"停止监控失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status/{monitor_id}")
async def get_monitor_status(monitor_id: str):
    """
    获取监控状态
    """
    try:
        # 尝试从两个服务中获取
        status = await monitor_service.get_monitor_status(monitor_id)
        if not status['success']:
            status = await optimized_service.get_monitor_status(monitor_id)
        
        if status['success']:
            return status
        else:
            raise HTTPException(status_code=404, detail=status.get('error'))
            
    except Exception as e:
        logger.error(f"获取监控状态失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/list")
async def list_monitors():
    """
    获取所有监控任务
    """
    try:
        # 合并两个服务的监控列表
        monitors = await monitor_service.get_all_monitors()
        optimized_monitors = await optimized_service.get_all_monitors()
        
        all_monitors = monitors + optimized_monitors
        
        return {
            'success': True,
            'monitors': all_monitors,
            'total': len(all_monitors)
        }
        
    except Exception as e:
        logger.error(f"获取监控列表失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/performance")
async def get_performance():
    """
    获取性能统计
    """
    try:
        # 获取两个服务的性能摘要
        basic_perf = await monitor_service.get_performance_summary()
        optimized_perf = await optimized_service.get_performance_summary()
        
        # 合并统计
        total_stats = {
            'total_monitors': basic_perf['total_monitors'] + optimized_perf['total_monitors'],
            'active_monitors': basic_perf['active_monitors'] + optimized_perf['active_monitors'],
            'total_checks': basic_perf['total_checks'] + optimized_perf['total_checks'],
            'total_state_changes': basic_perf['total_state_changes'] + optimized_perf['total_state_changes'],
            'basic_service': basic_perf,
            'optimized_service': optimized_perf,
            'timestamp': basic_perf['timestamp']
        }
        
        # 计算整体平均响应时间
        if total_stats['total_state_changes'] > 0:
            total_stats['overall_avg_response_ms'] = (
                basic_perf['overall_avg_response_ms'] * basic_perf['total_state_changes'] +
                optimized_perf['overall_avg_response_ms'] * optimized_perf['total_state_changes']
            ) / total_stats['total_state_changes']
        else:
            total_stats['overall_avg_response_ms'] = 0
        
        return {
            'success': True,
            'stats': total_stats
        }
        
    except Exception as e:
        logger.error(f"获取性能统计失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/cleanup")
async def cleanup_monitors():
    """
    清理已停止的监控任务
    """
    try:
        result1 = await monitor_service.cleanup_stopped_monitors()
        result2 = await optimized_service.base_service.cleanup_stopped_monitors()
        
        total_cleaned = result1['cleaned_count'] + result2['cleaned_count']
        
        return {
            'success': True,
            'cleaned_count': total_cleaned
        }
        
    except Exception as e:
        logger.error(f"清理监控失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# 导入datetime
from datetime import datetime
