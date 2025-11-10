"""
淘宝/天猫相关的数据类型定义
"""

from dataclasses import dataclass
from typing import Optional, Dict, Any
from datetime import datetime


@dataclass
class UserInfo:
    """用户信息"""
    user_id: str
    nick: str
    avatar: Optional[str] = None
    cookies: Optional[Dict[str, str]] = None


@dataclass
class QRCodeInfo:
    """二维码信息"""
    qr_id: str
    qr_url: str
    qr_image: str
    expire_time: datetime
    status: str = "pending"  # pending, scanned, confirmed, expired


@dataclass
class Product:
    """商品信息"""
    product_id: str
    title: str
    price: float
    stock: int
    image_url: Optional[str] = None
    detail_url: Optional[str] = None


@dataclass
class SnatchTask:
    """抢购任务"""
    task_id: str
    product_id: str
    user_id: str
    start_time: datetime
    status: str = "pending"  # pending, running, success, failed
    retry_count: int = 0
    max_retries: int = 10
    result: Optional[Dict[str, Any]] = None


@dataclass
class OrderResult:
    """订单结果"""
    success: bool
    order_id: Optional[str] = None
    message: str = ""
    timestamp: Optional[datetime] = None
