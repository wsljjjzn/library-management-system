import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.deps import get_current_user, get_db
from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.user import User
from app.schemas.response import ApiResponse
from app.schemas.token import Token
from app.schemas.user import UserCreate, UserLogin, UserOut, UserWithStats
from app.services.borrow_service import BorrowService

router = APIRouter()

@router.post("/register", response_model=ApiResponse[UserOut])
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == user_in.username).first():
        raise HTTPException(status_code=400, detail="该用户名已被占用，请更换其他用户名")
    if db.query(User).filter(User.email == user_in.email).first():
        raise HTTPException(status_code=400, detail="该电子邮箱已被绑定")

    card_number = f"CARD-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:4].upper()}"
    new_user = User(
        username=user_in.username,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        email=user_in.email,
        phone=user_in.phone,
        role="reader",
        card_number=card_number,
        max_borrow_count=settings.DEFAULT_MAX_BORROWS,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return ApiResponse(message="注册成功，已为您自动开通专属读者借书证", data=new_user)

@router.post("/login", response_model=ApiResponse[dict])
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == login_in.username).first()
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户名或登录密码错误"
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="该用户账户已被冻结停用，请联系管理员")

    access_token = create_access_token(subject=user.id, role=user.role)
    return ApiResponse(
        message="登录成功",
        data={
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "username": user.username,
                "full_name": user.full_name,
                "role": user.role,
                "email": user.email,
                "card_number": user.card_number,
                "max_borrow_count": user.max_borrow_count
            }
        }
    )

@router.get("/me", response_model=ApiResponse[UserWithStats])
def get_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    current_count, has_overdue = BorrowService.get_user_borrow_stats(db, current_user.id)
    user_data = UserWithStats.model_validate(current_user)
    user_data.current_borrow_count = current_count
    user_data.has_overdue = has_overdue
    return ApiResponse(data=user_data)
