import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.deps import get_db
from app.db.base import Base
from app.db.init_db import init_db
from app.main import app

# 使用 StaticPool 保证内存数据库在多个 session 间共享
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

Base.metadata.create_all(bind=test_engine)
init_session = TestingSessionLocal()
init_db(init_session)
init_session.close()


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_admin_login():
    response = client.post("/api/v1/auth/login", json={
        "username": "admin",
        "password": "admin123"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["code"] == 200
    assert "access_token" in data["data"]
    assert data["data"]["user"]["role"] == "admin"

def test_reader_registration_and_login():
    # 注册新读者
    reg_resp = client.post("/api/v1/auth/register", json={
        "username": "testreader",
        "password": "readerpassword",
        "full_name": "测试读者",
        "email": "testreader@test.com",
        "phone": "13811112222"
    })
    assert reg_resp.status_code == 200
    reg_data = reg_resp.json()
    assert reg_data["data"]["card_number"].startswith("CARD-")

    # 登录测试
    login_resp = client.post("/api/v1/auth/login", json={
        "username": "testreader",
        "password": "readerpassword"
    })
    assert login_resp.status_code == 200
    token = login_resp.json()["data"]["access_token"]
    assert token is not None

def test_book_search_and_list():
    response = client.get("/api/v1/books?keyword=计算机")
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["total"] >= 1
    assert any("计算机" in item["title"] for item in data["items"])

def test_borrow_and_return_cycle():
    # 读者登录
    login_resp = client.post("/api/v1/auth/login", json={
        "username": "reader",
        "password": "reader123"
    })
    token = login_resp.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 获取一本书
    book_resp = client.get("/api/v1/books")
    books = book_resp.json()["data"]["items"]
    target_book = None
    for b in books:
        if b["available_copies"] > 0:
            target_book = b
            break
    assert target_book is not None
    orig_available = target_book["available_copies"]

    # 1. 发起借阅
    borrow_resp = client.post("/api/v1/borrows/borrow", headers=headers, json={
        "book_id": target_book["id"]
    })
    assert borrow_resp.status_code == 200
    borrow_data = borrow_resp.json()["data"]
    record_id = borrow_data["id"]
    assert borrow_data["status"] == "BORROWED"

    # 验证库存原子扣减
    updated_book_resp = client.get(f"/api/v1/books/{target_book['id']}")
    assert updated_book_resp.json()["data"]["available_copies"] == orig_available - 1

    # 2. 测试续借（允许1次）
    renew_resp = client.post(f"/api/v1/borrows/renew/{record_id}", headers=headers)
    assert renew_resp.status_code == 200
    assert renew_resp.json()["data"]["renew_count"] == 1

    # 3. 再次续借应被拦截拒绝
    renew_fail_resp = client.post(f"/api/v1/borrows/renew/{record_id}", headers=headers)
    assert renew_fail_resp.status_code == 400

    # 4. 还书
    return_resp = client.post(f"/api/v1/borrows/return/{record_id}", headers=headers)
    assert return_resp.status_code == 200
    assert return_resp.json()["data"]["status"] == "RETURNED"

    # 验证库存回补
    restored_book_resp = client.get(f"/api/v1/books/{target_book['id']}")
    assert restored_book_resp.json()["data"]["available_copies"] == orig_available

def test_role_authorization_forbidden():
    # 读者尝试创建分类（只有管理员/馆员允许）
    login_resp = client.post("/api/v1/auth/login", json={
        "username": "reader",
        "password": "reader123"
    })
    token = login_resp.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    forbidden_resp = client.post("/api/v1/categories", headers=headers, json={
        "name": "违规新建分类",
        "code": "BAD001"
    })
    assert forbidden_resp.status_code == 403

def test_stats_overview_and_trends():
    response = client.get("/api/v1/stats/overview")
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["total_titles"] > 0
    assert data["total_volumes"] > 0

    trends_resp = client.get("/api/v1/stats/trends")
    assert trends_resp.status_code == 200
    t_data = trends_resp.json()["data"]
    assert len(t_data["dates"]) == 7
    assert len(t_data["popular_books"]) > 0
