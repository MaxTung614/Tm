"""
天猫礼享金抢购工具 - FastAPI 后端服务
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
import sys

# 导入路由
from backend.api import auth, gifts, tasks, settings, stats, risk_params, accounts

# 配置日志
logger.remove()
logger.add(sys.stdout, level="INFO")
logger.add("logs/app.log", rotation="500 MB", level="DEBUG")

# 创建 FastAPI 应用
app = FastAPI(
    title="天猫礼享金抢购工具 API",
    description="自动化抢购系统后端服务",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(auth.router, prefix="/api/auth", tags=["认证"])
app.include_router(gifts.router, prefix="/api/gifts", tags=["礼品"])
app.include_router(tasks.router, prefix="/api/tasks", tags=["任务"])
app.include_router(settings.router, prefix="/api/settings", tags=["设置"])
app.include_router(stats.router, prefix="/api/stats", tags=["统计"])
app.include_router(risk_params.router, prefix="/api/risk-params", tags=["风控参数"])
app.include_router(accounts.router, prefix="/api/accounts", tags=["账号管理"])


@app.get("/")
async def root():
    """根路径"""
    return {
        "message": "天猫礼享金抢购工具 API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """健康检查"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )