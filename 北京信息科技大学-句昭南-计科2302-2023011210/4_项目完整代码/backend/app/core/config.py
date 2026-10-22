import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "LibraryHub 图书借阅管理系统"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "library-hub-secret-jwt-key-2026-production")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 小时
    ALGORITHM: str = "HS256"

    # 数据库路径：支持本地开发和 Docker 容器挂载
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:////app/data/library.db")

    # 借阅业务规则
    DEFAULT_BORROW_DAYS: int = 30
    DEFAULT_MAX_BORROWS: int = 5
    DAILY_PENALTY_FEE: float = 0.5  # 每日逾期罚金 0.5 元

    model_config = SettingsConfigDict(case_sensitive=True)

settings = Settings()

