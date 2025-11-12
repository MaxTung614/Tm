"""
天猫礼享金抢购工具 - 异常处理和错误管理模块
提供统一的异常处理、错误日志记录和错误报告功能
"""
import traceback
from typing import Optional, Dict, Any, Callable
from datetime import datetime
from loguru import logger
import functools
import json
from enum import Enum
from dataclasses import dataclass
import asyncio
from fastapi import Request, HTTPException, Response
from fastapi.responses import JSONResponse
import sys


class ErrorLevel(Enum):
    """错误级别"""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class ErrorCategory(Enum):
    """错误分类"""
    NETWORK = "network"
    AUTHENTICATION = "authentication"
    AUTHORIZATION = "authorization"
    VALIDATION = "validation"
    BUSINESS_LOGIC = "business_logic"
    SYSTEM = "system"
    UNKNOWN = "unknown"


@dataclass
class ErrorInfo:
    """错误信息"""
    id: str
    timestamp: datetime
    level: ErrorLevel
    category: ErrorCategory
    message: str
    details: Optional[Dict[str, Any]] = None
    stack_trace: Optional[str] = None
    user_id: Optional[str] = None
    request_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = None


class ErrorHandler:
    """全局错误处理器"""
    
    def __init__(self):
        self.error_storage = []
        self.max_storage_size = 1000
        self.error_callbacks = []
        
    def register_error_callback(self, callback: Callable[[ErrorInfo], None]):
        """注册错误回调函数"""
        self.error_callbacks.append(callback)
    
    def create_error_info(
        self,
        exception: Exception,
        level: ErrorLevel = ErrorLevel.ERROR,
        category: ErrorCategory = ErrorCategory.UNKNOWN,
        user_id: Optional[str] = None,
        request_id: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None,
        details: Optional[Dict[str, Any]] = None
    ) -> ErrorInfo:
        """创建错误信息"""
        
        # 生成错误ID
        error_id = f"ERR_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{id(exception)}"
        
        # 获取堆栈跟踪
        stack_trace = None
        if level in [ErrorLevel.ERROR, ErrorLevel.CRITICAL]:
            stack_trace = traceback.format_exc()
        
        # 构建详细信息
        error_details = {
            "exception_type": type(exception).__name__,
            "exception_message": str(exception),
        }
        if details:
            error_details.update(details)
        
        error_info = ErrorInfo(
            id=error_id,
            timestamp=datetime.now(),
            level=level,
            category=category,
            message=str(exception),
            details=error_details,
            stack_trace=stack_trace,
            user_id=user_id,
            request_id=request_id,
            context=context or {}
        )
        
        return error_info
    
    def log_error(self, error_info: ErrorInfo):
        """记录错误日志"""
        
        # 添加到存储
        self.error_storage.append(error_info)
        if len(self.error_storage) > self.max_storage_size:
            self.error_storage.pop(0)
        
        # 记录到日志
        log_message = f"[{error_info.category.value.upper()}] {error_info.message}"
        if error_info.context:
            log_message += f" Context: {json.dumps(error_info.context, ensure_ascii=False, default=str)}"
        
        if error_info.level == ErrorLevel.CRITICAL:
            logger.critical(log_message)
        elif error_info.level == ErrorLevel.ERROR:
            logger.error(log_message)
        elif error_info.level == ErrorLevel.WARNING:
            logger.warning(log_message)
        else:
            logger.info(log_message)
        
        # 如果有堆栈跟踪，记录到文件
        if error_info.stack_trace:
            logger.error(f"Stack trace for {error_info.id}:\n{error_info.stack_trace}")
        
        # 调用注册的回调
        for callback in self.error_callbacks:
            try:
                callback(error_info)
            except Exception as e:
                logger.error(f"Error in error callback: {e}")
    
    def handle_exception(
        self,
        exception: Exception,
        level: ErrorLevel = ErrorLevel.ERROR,
        category: ErrorCategory = ErrorCategory.UNKNOWN,
        user_id: Optional[str] = None,
        request_id: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> ErrorInfo:
        """处理异常"""
        
        error_info = self.create_error_info(
            exception=exception,
            level=level,
            category=category,
            user_id=user_id,
            request_id=request_id,
            context=context
        )
        
        self.log_error(error_info)
        
        return error_info
    
    def get_recent_errors(self, limit: int = 50) -> list[ErrorInfo]:
        """获取最近的错误"""
        return self.error_storage[-limit:]
    
    def get_errors_by_category(self, category: ErrorCategory) -> list[ErrorInfo]:
        """按分类获取错误"""
        return [error for error in self.error_storage if error.category == category]
    
    def clear_errors(self):
        """清除错误记录"""
        self.error_storage.clear()


# 全局错误处理器实例
error_handler = ErrorHandler()


def exception_handler(
    level: ErrorLevel = ErrorLevel.ERROR,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    log_args: bool = True,
    log_result: bool = False
):
    """异常处理装饰器"""
    
    def decorator(func: Callable):
        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs):
            try:
                result = await func(*args, **kwargs)
                if log_result:
                    logger.info(f"Function {func.__name__} completed successfully")
                return result
            except Exception as e:
                context = {
                    "function": func.__name__,
                    "args": str(args) if log_args else None,
                    "kwargs": str(kwargs) if log_args else None
                }
                error_handler.handle_exception(
                    exception=e,
                    level=level,
                    category=category,
                    context=context
                )
                raise
        
        @functools.wraps(func)
        def sync_wrapper(*args, **kwargs):
            try:
                result = func(*args, **kwargs)
                if log_result:
                    logger.info(f"Function {func.__name__} completed successfully")
                return result
            except Exception as e:
                context = {
                    "function": func.__name__,
                    "args": str(args) if log_args else None,
                    "kwargs": str(kwargs) if log_args else None
                }
                error_handler.handle_exception(
                    exception=e,
                    level=level,
                    category=category,
                    context=context
                )
                raise
        
        # 决定使用同步还是异步包装器
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper
    
    return decorator


async def handle_fastapi_exception(request: Request, exc: Exception) -> Response:
    """FastAPI全局异常处理器"""
    
    # 确定错误级别和分类
    if isinstance(exc, HTTPException):
        level = ErrorLevel.WARNING if exc.status_code < 500 else ErrorLevel.ERROR
        category = ErrorCategory.AUTHENTICATION if exc.status_code == 401 else \
                  ErrorCategory.AUTHORIZATION if exc.status_code == 403 else \
                  ErrorCategory.VALIDATION
    else:
        level = ErrorLevel.ERROR
        category = ErrorCategory.SYSTEM
    
    # 记录错误
    error_info = error_handler.handle_exception(
        exception=exc,
        level=level,
        category=category,
        context={
            "method": request.method,
            "url": str(request.url),
            "client_ip": request.client.host if request.client else None,
            "user_agent": request.headers.get("user-agent")
        }
    )
    
    # 返回错误响应
    return JSONResponse(
        status_code=500 if level == ErrorLevel.ERROR else 400,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "服务器内部错误" if level == ErrorLevel.ERROR else "请求处理失败",
                "error_id": error_info.id,
                "details": str(exc) if level == ErrorLevel.ERROR else None
            },
            "timestamp": datetime.now().isoformat()
        }
    )


def setup_error_logging():
    """设置错误日志配置"""
    
    # 错误日志配置
    error_log_config = {
        "rotation": "1 day",
        "retention": "30 days", 
        "level": "ERROR",
        "format": "{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} | {extra[error_id]} | {message}",
        "compression": "zip"
    }
    
    # 添加错误日志处理器
    logger.add("logs/error.log", **error_log_config)
    
    # 业务日志配置
    business_log_config = {
        "rotation": "1 day",
        "retention": "7 days",
        "level": "INFO",
        "format": "{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} | {message}"
    }
    
    logger.add("logs/business.log", **business_log_config)


# 自动设置日志
setup_error_logging()
