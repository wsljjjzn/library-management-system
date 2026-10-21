from fastapi import APIRouter
from app.api.v1.endpoints import auth, books, borrows, categories, stats, users

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["认证与鉴权"])
api_router.include_router(categories.router, prefix="/categories", tags=["图书分类管理"])
api_router.include_router(books.router, prefix="/books", tags=["馆藏书目管理与检索"])
api_router.include_router(borrows.router, prefix="/borrows", tags=["借还流转与续借业务"])
api_router.include_router(users.router, prefix="/users", tags=["读者证件与用户管理"])
api_router.include_router(stats.router, prefix="/stats", tags=["运营看板与决策统计"])
