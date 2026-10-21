from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.deps import RequireRoles, get_current_user, get_db
from app.models.book import Book
from app.models.category import Category
from app.models.user import User
from app.schemas.category import CategoryCreate, CategoryOut, CategoryUpdate
from app.schemas.response import ApiResponse

router = APIRouter()

@router.get("", response_model=ApiResponse[List[CategoryOut]])
def list_categories(db: Session = Depends(get_db)):
    cats = db.query(Category).order_by(Category.sort_order.asc(), Category.id.asc()).all()
    result = []
    for c in cats:
        cnt = db.query(func.count(Book.id)).filter(Book.category_id == c.id).scalar() or 0
        c_out = CategoryOut.model_validate(c)
        c_out.book_count = cnt
        result.append(c_out)
    return ApiResponse(data=result)

@router.post("", response_model=ApiResponse[CategoryOut])
def create_category(
    cat_in: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRoles(["admin", "librarian"]))
):
    if db.query(Category).filter(Category.name == cat_in.name).first():
        raise HTTPException(status_code=400, detail="分类名称已存在")
    if db.query(Category).filter(Category.code == cat_in.code).first():
        raise HTTPException(status_code=400, detail="分类编码已存在")

    cat = Category(**cat_in.model_dump())
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return ApiResponse(message="分类创建成功", data=CategoryOut.model_validate(cat))

@router.put("/{cat_id}", response_model=ApiResponse[CategoryOut])
def update_category(
    cat_id: int,
    cat_in: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRoles(["admin", "librarian"]))
):
    cat = db.query(Category).filter(Category.id == cat_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="分类不存在")

    update_data = cat_in.model_dump(exclude_unset=True)
    if "name" in update_data and update_data["name"] != cat.name:
        if db.query(Category).filter(Category.name == update_data["name"]).first():
            raise HTTPException(status_code=400, detail="分类名称已存在")
    if "code" in update_data and update_data["code"] != cat.code:
        if db.query(Category).filter(Category.code == update_data["code"]).first():
            raise HTTPException(status_code=400, detail="分类编码已存在")

    for field, val in update_data.items():
        setattr(cat, field, val)
    db.commit()
    db.refresh(cat)
    return ApiResponse(message="分类更新成功", data=CategoryOut.model_validate(cat))

@router.delete("/{cat_id}", response_model=ApiResponse[None])
def delete_category(
    cat_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRoles(["admin"]))
):
    cat = db.query(Category).filter(Category.id == cat_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="分类不存在")

    book_cnt = db.query(func.count(Book.id)).filter(Book.category_id == cat_id).scalar() or 0
    if book_cnt > 0:
        raise HTTPException(status_code=400, detail=f"该分类下尚有关联的 {book_cnt} 本图书，无法直接删除！请先将图书移至其他分类")

    db.delete(cat)
    db.commit()
    return ApiResponse(message="分类删除成功")
