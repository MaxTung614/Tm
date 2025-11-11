"""
数据模型定义
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime


# ============ 通用响应模型 ============
class ApiResponse(BaseModel):
    """API 统一响应格式"""
    success: bool
    message: str = ""
    data: Optional[dict] = None


# ============ 认证相关 ============
class LoginRequest(BaseModel):
    """登录请求"""
    cookie: str = Field(..., description="淘宝 Cookie")


class UserInfo(BaseModel):
    """用户信息"""
    id: str
    nick: str
    avatar: Optional[str] = None
    goldCoin: int = 0
    balance: float = 0.0


class QRCodeResponse(BaseModel):
    """二维码响应"""
    qrId: str
    qrCode: str  # base64 编码的二维码图片
    expireTime: int  # 过期时间（秒）


class QRCodeCheckRequest(BaseModel):
    """二维码检查请求"""
    qrId: str


# ============ 礼品相关 ============
class RedPacket(BaseModel):
    """红包信息"""
    id: str
    benefitCode: str
    name: str
    amount: str
    coinCost: int
    type: Literal["phone", "cash", "coupon"]
    status: Literal["available", "claimed", "expired"]
    expireTime: Optional[str] = None
    description: Optional[str] = None


class GiftListRequest(BaseModel):
    """礼品列表请求"""
    status: Optional[str] = None
    page: int = 1
    pageSize: int = 20


class GiftGrabRequest(BaseModel):
    """抢购请求"""
    giftId: str


class BatchGrabRequest(BaseModel):
    """批量抢购请求"""
    giftIds: List[str]


# ============ 任务相关 ============
class Task(BaseModel):
    """定时任务"""
    id: str
    name: str
    giftId: str
    giftName: Optional[str] = None
    scheduledTime: str
    repeatType: Literal["once", "daily", "weekly"]
    status: Literal["pending", "running", "completed", "failed"]
    lastRun: Optional[str] = None
    nextRun: Optional[str] = None
    createdAt: str


class TaskCreateRequest(BaseModel):
    """创建任务请求"""
    name: str
    giftId: str
    scheduledTime: str
    repeatType: Literal["once", "daily", "weekly"] = "once"


class TaskUpdateRequest(BaseModel):
    """更新任务请求"""
    taskId: str
    name: Optional[str] = None
    scheduledTime: Optional[str] = None
    repeatType: Optional[Literal["once", "daily", "weekly"]] = None


class TaskActionRequest(BaseModel):
    """任务操作请求"""
    taskId: str


# ============ 设置相关 ============
class NotificationSettings(BaseModel):
    """通知设置"""
    grabSuccess: bool = True
    grabFailed: bool = True
    taskComplete: bool = True


class AutoRefreshSettings(BaseModel):
    """自动刷新设置"""
    enabled: bool = True
    interval: int = 30


class AdvancedSettings(BaseModel):
    """高级设置"""
    maxRetries: int = 3
    timeout: int = 10


class Settings(BaseModel):
    """应用设置"""
    notifications: NotificationSettings
    autoRefresh: AutoRefreshSettings
    advanced: AdvancedSettings


class UpdateCookieRequest(BaseModel):
    """更新 Cookie 请求"""
    cookie: str


# ============ 统计相关 ============
class DashboardStats(BaseModel):
    """仪表板统计"""
    totalGrabbed: int = 0
    successRate: float = 0.0
    totalAmount: float = 0.0
    todayGrabbed: int = 0


class HistoryRecord(BaseModel):
    """历史记录"""
    id: str
    giftName: str
    amount: str
    status: Literal["success", "failed"]
    timestamp: str
    reason: Optional[str] = None
