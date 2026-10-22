from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.deps import RequireRoles, get_current_user, get_db
from app.core.security import get_password_hash
from app.models.user import User
from app.schemas.response import ApiResponse
from app.schemas.user import UserOut, UserUpdate, UserWithStats
from app.services.borrow_service import BorrowService

router = APIRouter()

@router.get("", response_model=ApiResponse[dict])
def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    keyword: Optional[str] = None,
    role: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRoles(["admin", "librarian"]))
):
    query = db.query(User)
    if keyword:
        p = f"%{keyword.strip()}%"
        query = query.filter(
            or_(
                User.username.ilike(p),
                User.full_name.ilike(p),
                User.card_number.ilike(p),
                User.email.ilike(p),
                User.phone.ilike(p)
            )
        )
    if role:
        query = query.filter(User.role == role)

    total = query.count()
    users = query.order_by(User.id.desc()).offset((page - 1) * page_size).limit(page_size).all()

    items = []
    for u in users:
        cnt, overdue = BorrowService.get_user_borrow_stats(db, u.id)
        u_out = UserWithStats.model_validate(u)
        u_out.current_borrow_count = cnt
        u_out.has_overdue = overdue
        items.append(u_out)

    return ApiResponse(data={"total": total, "items": items})

@router.put("/{user_id}", response_model=ApiResponse[UserOut])
def update_user(
    user_id: int,
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRoles(["admin"]))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    update_data = user_in.model_dump(exclude_unset=True)
    if "password" in update_data and update_data["password"]:
        user.hashed_password = get_password_hash(update_data.pop("password"))

    for f, v in update_data.items():
        setattr(user, f, v)

    db.commit()
    db.refresh(user)
    return ApiResponse(message="读者档案与借书权限已更新", data=UserOut.model_validate(user))

@router.put("/{user_id}/status", response_model=ApiResponse[UserOut])
def toggle_user_status(
    user_id: int,
    is_active: bool,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRoles(["admin"]))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="严禁停用自身超级管理员账号！")

    user.is_active = is_active
    db.commit()
    db.refresh(user)
    action_text = "启用" if is_active else "冻结停用"
    return ApiResponse(message=f"该读者账号已成功{action_text}", data=UserOut.model_validate(user))
