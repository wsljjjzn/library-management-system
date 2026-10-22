from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.api import api_router
from app.core.config import settings
from app.db.base import Base
from app.db.init_db import init_db
from app.db.session import SessionLocal, engine

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 服务启动时自动执行 DDL 建表与数据种子初始化
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        init_db(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="高可用、高并发图书借阅管理系统 API 接口平台",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# 允许跨域请求配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 统一异常拦截处理，确保返回结构遵循统一 API 规范
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    # 针对未捕获异常返回统一格式
    return JSONResponse(
        status_code=500,
        content={
            "code": 500,
            "message": f"系统内部异常: {str(exc)}",
            "data": None
        }
    )

# 注册 API v1 路由
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health", tags=["探针监控"])
@app.get("/api/v1/health", tags=["探针监控"])
def health_check():
    return {"status": "ok", "app": settings.PROJECT_NAME, "version": "1.0.0"}
