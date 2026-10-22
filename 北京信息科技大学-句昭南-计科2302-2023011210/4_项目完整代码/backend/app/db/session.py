import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

Base = declarative_base()

def get_database_url() -> str:
    env_url = os.getenv("DATABASE_URL")
    if env_url:
        return env_url
    # 检查是否在 Docker 容器中
    if os.path.exists("/app/data"):
        return "sqlite:////app/data/library.db"
    # 本地开发环境：在 backend 根目录下生成
    local_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
    db_path = os.path.join(local_dir, "library.db")
    return f"sqlite:///{db_path}"

db_url = get_database_url()
engine = create_engine(
    db_url,
    connect_args={"check_same_thread": False} if db_url.startswith("sqlite") else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
