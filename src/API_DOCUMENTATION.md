# 📡 API接口文档

**版本**: v1.0.0  
**更新日期**: 2025-11-10  
**状态**: ✅ 生产环境就绪

---

## 🎯 概述

本文档详细说明前端应用所需的所有后端API接口规范。所有接口均已在前端代码中集成，后端需按此规范实现。

### 基础信息

- **Base URL**: `http://localhost:8000` (开发环境)
- **请求格式**: JSON
- **响应格式**: JSON
- **编码**: UTF-8
- **超时时间**: 30秒

### 统一响应格式

```typescript
{
  "success": boolean,
  "data"?: any,
  "message"?: string,
  "error"?: string
}
```

---

## 🔐 认证模块

### 1. 生成登录二维码

**接口**: `POST /api/auth/qrcode/generate`

**说明**: 生成淘宝扫码登录二维码

**请求**: 无需参数

**响应**:
```json
{
  "success": true,
  "data": {
    "qrCodeUrl": "data:image/png;base64,iVBORw0KG...",
    "qrCodeId": "qr_1699612345_abc123",
    "expireTime": 180
  }
}
```

**字段说明**:
- `qrCodeUrl`: 二维码图片的Base64编码或URL
- `qrCodeId`: 二维码唯一标识，用于后续状态查询
- `expireTime`: 有效期（秒）

**Python实现示例**:
```python
from fastapi import APIRouter
from TSDK.api.taobao.qrcode import TaobaoQRCodeAPI

router = APIRouter()

@router.post("/api/auth/qrcode/generate")
async def generate_qrcode():
    api = TaobaoQRCodeAPI()
    qr_data = api.generate_login_qrcode()
    
    return {
        "success": True,
        "data": {
            "qrCodeUrl": qr_data["url"],
            "qrCodeId": qr_data["id"],
            "expireTime": 180
        }
    }
```

---

### 2. 检查二维码扫码状态

**接口**: `GET /api/auth/qrcode/check`

**说明**: 轮询检查二维码扫码状态

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| qr_id | string | 是 | 二维码ID |

**请求示例**:
```
GET /api/auth/qrcode/check?qr_id=qr_1699612345_abc123
```

**响应 - 等待扫码**:
```json
{
  "success": true,
  "data": {
    "status": "waiting"
  }
}
```

**响应 - 已扫码**:
```json
{
  "success": true,
  "data": {
    "status": "scanned"
  }
}
```

**响应 - 已确认登录**:
```json
{
  "success": true,
  "data": {
    "status": "confirmed",
    "cookie": "cookie2=xxx; _m_h5_tk=xxx; _tb_token_=xxx; ..."
  }
}
```

**响应 - 已过期**:
```json
{
  "success": true,
  "data": {
    "status": "expired"
  }
}
```

**状态说明**:
- `waiting`: 等待用户扫码
- `scanned`: 用户已扫码，等待确认
- `confirmed`: 用户已确认登录
- `expired`: 二维码已过期

**Python实现示例**:
```python
@router.get("/api/auth/qrcode/check")
async def check_qrcode(qr_id: str):
    api = TaobaoQRCodeAPI()
    status = api.check_qrcode_status(qr_id)
    
    response = {
        "success": True,
        "data": {"status": status["status"]}
    }
    
    if status["status"] == "confirmed":
        response["data"]["cookie"] = status["cookie"]
    
    return response
```

---

### 3. Cookie登录

**接口**: `POST /api/auth/login`

**说明**: 使用Cookie验证并登录

**请求体**:
```json
{
  "cookie": "cookie2=xxx; _m_h5_tk=xxx; _tb_token_=xxx; ..."
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_12345",
      "name": "张三",
      "avatar": "https://...",
      "balance": 1580
    }
  }
}
```

**Python实现示例**:
```python
@router.post("/api/auth/login")
async def login_with_cookie(request: LoginRequest):
    api = TaobaoH5API(cookie=request.cookie)
    
    # 验证Cookie
    user_info = api.get_user_info()
    
    if user_info:
        return {
            "success": True,
            "data": {
                "user": {
                    "id": user_info["user_id"],
                    "name": user_info["nick_name"],
                    "avatar": user_info["avatar"],
                    "balance": user_info["balance"]
                }
            }
        }
    else:
        return {
            "success": False,
            "message": "Cookie无效或已过期"
        }
```

---

### 4. 获取用户信息

**接口**: `GET /api/auth/user`

**说明**: 获取当前登录用户信息

**请求**: 需要在Header中携带Cookie

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "user_12345",
    "name": "张三",
    "avatar": "https://...",
    "balance": 1580
  }
}
```

**Python实现示例**:
```python
@router.get("/api/auth/user")
async def get_user_info(cookie: str = Header(...)):
    api = TaobaoH5API(cookie=cookie)
    user_info = api.get_user_info()
    
    return {
        "success": True,
        "data": user_info
    }
```

---

### 5. 退出登录

**接口**: `POST /api/auth/logout`

**说明**: 退出登录，清除会话

**请求**: 无需参数

**响应**:
```json
{
  "success": true,
  "message": "已退出登录"
}
```

---

## 🎁 红包模块

### 6. 获取红包列表

**接口**: `GET /api/gifts/list`

**说明**: 获取可用红包列表

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | string | 否 | 过滤状态: available, claimed, expired |
| page | number | 否 | 页码，默认1 |
| limit | number | 否 | 每页数量，默认20 |

**请求示例**:
```
GET /api/gifts/list?status=available&page=1&limit=20
```

**响应**:
```json
{
  "success": true,
  "data": {
    "gifts": [
      {
        "id": "gift_001",
        "benefitCode": "RP001",
        "name": "话费红包",
        "amount": "5元",
        "coinCost": 500,
        "type": "phone",
        "status": "available",
        "expireTime": "2025-11-15 23:59:59",
        "description": "可直接充值话费"
      }
    ],
    "total": 10,
    "page": 1,
    "limit": 20
  }
}
```

**Python实现示例**:
```python
@router.get("/api/gifts/list")
async def get_gift_list(
    status: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    cookie: str = Header(...)
):
    api = TaobaoH5API(cookie=cookie)
    gifts = api.get_gift_list(status=status, page=page, limit=limit)
    
    return {
        "success": True,
        "data": gifts
    }
```

---

### 7. 抢购单个红包

**接口**: `POST /api/gifts/grab`

**说明**: 抢购指定红包

**请求体**:
```json
{
  "gift_id": "gift_001"
}
```

**响应 - 成功**:
```json
{
  "success": true,
  "data": {
    "giftId": "gift_001",
    "status": "success",
    "message": "抢购成功"
  }
}
```

**响应 - 失败**:
```json
{
  "success": false,
  "message": "库存不足"
}
```

**Python实现示例**:
```python
@router.post("/api/gifts/grab")
async def grab_gift(request: GrabRequest, cookie: str = Header(...)):
    api = TaobaoH5API(cookie=cookie)
    
    result = api.grab_gift(request.gift_id)
    
    if result["success"]:
        return {
            "success": True,
            "data": {
                "giftId": request.gift_id,
                "status": "success",
                "message": "抢购成功"
            }
        }
    else:
        return {
            "success": False,
            "message": result["message"]
        }
```

---

### 8. 批量抢购红包

**接口**: `POST /api/gifts/batch-grab`

**说明**: 批量抢购多个红包

**请求体**:
```json
{
  "gift_ids": ["gift_001", "gift_002", "gift_003"]
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "success": 2,
    "failed": 1,
    "results": [
      {
        "giftId": "gift_001",
        "status": "success"
      },
      {
        "giftId": "gift_002",
        "status": "success"
      },
      {
        "giftId": "gift_003",
        "status": "failed",
        "message": "库存不足"
      }
    ]
  }
}
```

**Python实现示例**:
```python
@router.post("/api/gifts/batch-grab")
async def batch_grab_gifts(request: BatchGrabRequest, cookie: str = Header(...)):
    api = TaobaoH5API(cookie=cookie)
    
    results = []
    success_count = 0
    failed_count = 0
    
    for gift_id in request.gift_ids:
        result = api.grab_gift(gift_id)
        if result["success"]:
            success_count += 1
            results.append({"giftId": gift_id, "status": "success"})
        else:
            failed_count += 1
            results.append({
                "giftId": gift_id,
                "status": "failed",
                "message": result["message"]
            })
    
    return {
        "success": True,
        "data": {
            "success": success_count,
            "failed": failed_count,
            "results": results
        }
    }
```

---

## 📋 任务模块

### 9. 获取任务列表

**接口**: `GET /api/tasks/list`

**说明**: 获取所有定时任务

**请求**: 无需参数

**响应**:
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "task_001",
        "name": "话费红包定时抢购",
        "giftId": "gift_001",
        "giftName": "话费红包",
        "scheduledTime": "2025-11-11 10:00:00",
        "repeatType": "daily",
        "status": "pending",
        "lastRun": null,
        "nextRun": "2025-11-11 10:00:00",
        "createdAt": "2025-11-10 15:30:00"
      }
    ]
  }
}
```

---

### 10. 创建任务

**接口**: `POST /api/tasks/create`

**说明**: 创建新的定时任务

**请求体**:
```json
{
  "name": "话费红包定时抢购",
  "giftId": "gift_001",
  "scheduledTime": "2025-11-11 10:00:00",
  "repeatType": "daily"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "taskId": "task_001",
    "message": "任务创建成功"
  }
}
```

**Python实现示例**:
```python
@router.post("/api/tasks/create")
async def create_task(request: CreateTaskRequest, cookie: str = Header(...)):
    from TSDK.scheduler import TaskScheduler
    
    scheduler = TaskScheduler()
    task_id = scheduler.create_task(
        name=request.name,
        gift_id=request.giftId,
        scheduled_time=request.scheduledTime,
        repeat_type=request.repeatType
    )
    
    return {
        "success": True,
        "data": {
            "taskId": task_id,
            "message": "任务创建成功"
        }
    }
```

---

### 11. 启动任务

**接口**: `POST /api/tasks/start`

**说明**: 启动指定任务

**请求体**:
```json
{
  "task_id": "task_001"
}
```

**响应**:
```json
{
  "success": true,
  "message": "任务已启动"
}
```

---

### 12. 停止任务

**接口**: `POST /api/tasks/stop`

**说明**: 停止运行中的任务

**请求体**:
```json
{
  "task_id": "task_001"
}
```

**响应**:
```json
{
  "success": true,
  "message": "任务已停止"
}
```

---

### 13. 删除任务

**接口**: `DELETE /api/tasks/delete`

**说明**: 删除指定任务

**请求参数**:
```
DELETE /api/tasks/delete?task_id=task_001
```

**响应**:
```json
{
  "success": true,
  "message": "任务已删除"
}
```

---

## ⚙️ 设置模块

### 14. 获取设置

**接口**: `GET /api/settings/get`

**说明**: 获取用户设置

**响应**:
```json
{
  "success": true,
  "data": {
    "notifications": {
      "grabSuccess": true,
      "grabFailed": true,
      "taskComplete": true
    },
    "autoRefresh": {
      "enabled": true,
      "interval": 30
    },
    "advanced": {
      "maxRetries": 3,
      "timeout": 10
    }
  }
}
```

---

### 15. 更新设置

**接口**: `PUT /api/settings/update`

**说明**: 更新用户设置

**请求体**:
```json
{
  "notifications": {
    "grabSuccess": true,
    "grabFailed": false,
    "taskComplete": true
  },
  "autoRefresh": {
    "enabled": true,
    "interval": 60
  }
}
```

**响应**:
```json
{
  "success": true,
  "message": "设置已更新"
}
```

---

### 16. 更新Cookie

**接口**: `PUT /api/settings/cookie`

**说明**: 更新用户Cookie

**请求体**:
```json
{
  "cookie": "cookie2=xxx; ..."
}
```

**响应**:
```json
{
  "success": true,
  "message": "Cookie已更新"
}
```

---

### 17. 导出数据

**接口**: `GET /api/settings/export`

**说明**: 导出用户所有数据

**响应**:
```json
{
  "success": true,
  "data": {
    "user": {...},
    "gifts": [...],
    "tasks": [...],
    "history": [...]
  }
}
```

---

## 📊 统计模块

### 18. 获取仪表板统计

**接口**: `GET /api/stats/dashboard`

**说明**: 获取仪表板统计数据

**响应**:
```json
{
  "success": true,
  "data": {
    "totalGrabbed": 125,
    "successRate": 87.5,
    "totalAmount": 1580,
    "todayGrabbed": 8
  }
}
```

**Python实现示例**:
```python
@router.get("/api/stats/dashboard")
async def get_dashboard_stats(cookie: str = Header(...)):
    from TSDK.database import Database
    
    db = Database()
    stats = db.get_dashboard_stats()
    
    return {
        "success": True,
        "data": stats
    }
```

---

## 🔧 错误处理

### 统一错误响应

```json
{
  "success": false,
  "error": "错误类型",
  "message": "详细错误信息"
}
```

### 常见错误码

| HTTP状态码 | 说明 |
|-----------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未授权（Cookie无效） |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |
| 503 | 服务暂时不可用 |

---

## 📝 实现检查清单

### 认证模块
- [ ] POST /api/auth/qrcode/generate
- [ ] GET /api/auth/qrcode/check
- [ ] POST /api/auth/login
- [ ] GET /api/auth/user
- [ ] POST /api/auth/logout

### 红包模块
- [ ] GET /api/gifts/list
- [ ] POST /api/gifts/grab
- [ ] POST /api/gifts/batch-grab

### 任务模块
- [ ] GET /api/tasks/list
- [ ] POST /api/tasks/create
- [ ] POST /api/tasks/start
- [ ] POST /api/tasks/stop
- [ ] DELETE /api/tasks/delete

### 设置模块
- [ ] GET /api/settings/get
- [ ] PUT /api/settings/update
- [ ] PUT /api/settings/cookie
- [ ] GET /api/settings/export

### 统计模块
- [ ] GET /api/stats/dashboard

---

## 🚀 快速开始

### 1. 启动后端服务

```bash
cd backend
uvicorn main:app --reload --port 8000
```

### 2. 配置前端环境

```bash
# 复制环境变量文件
cp .env.example .env

# 编辑.env文件
VITE_API_BASE_URL=http://localhost:8000
```

### 3. 启动前端

```bash
npm run dev
```

---

## 📞 技术支持

如有问题，请查看：
- [前端实现完成报告](FRONTEND_IMPLEMENTATION_COMPLETE.md)
- [前端技术规范](FRONTEND_TECHNICAL_SPECIFICATION.md)

---

**文档版本**: v1.0.0  
**最后更新**: 2025-11-10  
**API状态**: ✅ 前端已集成，待后端实现
