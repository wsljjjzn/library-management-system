from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.deps import RequireRoles, get_current_user, get_db
from app.models.book import Book
from app.models.borrow import BorrowRecord
from app.models.category import Category
from app.models.user import User
from app.schemas.book import BookCreate, BookListResponse, BookOut, BookUpdate
from app.schemas.response import ApiResponse

router = APIRouter()

@router.get("", response_model=ApiResponse[BookListResponse])
def list_books(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    keyword: Optional[str] = None,
    category_id: Optional[int] = None,
    available_only: bool = False,
    db: Session = Depends(get_db)
):
    query = db.query(Book)

    if keyword:
        pattern = f"%{keyword.strip()}%"
        query = query.filter(
            or_(
                Book.title.ilike(pattern),
                Book.author.ilike(pattern),
                Book.isbn.ilike(pattern),
                Book.publisher.ilike(pattern)
            )
        )

    if category_id:
        query = query.filter(Book.category_id == category_id)

    if available_only:
        query = query.filter(Book.available_copies > 0)

    total = query.count()
    books = query.order_by(Book.id.desc()).offset((page - 1) * page_size).limit(page_size).all()

    items = []
    for b in books:
        b_out = BookOut.model_validate(b)
        b_out.category_name = b.category.name if b.category else ""
        items.append(b_out)

    return ApiResponse(data=BookListResponse(total=total, items=items))

@router.get("/{book_id}", response_model=ApiResponse[BookOut])
def get_book(book_id: int, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="图书不存在")
    b_out = BookOut.model_validate(book)
    b_out.category_name = book.category.name if book.category else ""
    return ApiResponse(data=b_out)

@router.post("", response_model=ApiResponse[BookOut])
def create_book(
    book_in: BookCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRoles(["admin", "librarian"]))
):
    if db.query(Book).filter(Book.isbn == book_in.isbn).first():
        raise HTTPException(status_code=400, detail="该 ISBN 的图书已存在，若为增补册数请在编辑页增加总册数")

    cat = db.query(Category).filter(Category.id == book_in.category_id).first()
    if not cat:
        raise HTTPException(status_code=400, detail="所选分类不存在")

    book = Book(
        isbn=book_in.isbn,
        title=book_in.title,
        author=book_in.author,
        publisher=book_in.publisher,
        publish_date=book_in.publish_date,
        category_id=book_in.category_id,
        total_copies=book_in.total_copies,
        available_copies=book_in.total_copies,  # 新增图书初始全部在架
        location=book_in.location,
        cover_url=book_in.cover_url,
        summary=book_in.summary
    )
    db.add(book)
    db.commit()
    db.refresh(book)
    b_out = BookOut.model_validate(book)
    b_out.category_name = cat.name
    return ApiResponse(message="新书编目入库成功", data=b_out)

@router.put("/{book_id}", response_model=ApiResponse[BookOut])
def update_book(
    book_id: int,
    book_in: BookUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRoles(["admin", "librarian"]))
):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="图书不存在")

    update_data = book_in.model_dump(exclude_unset=True)

    # 如果调整了总册数，需同步维护在架数量与已借数量一致性
    if "total_copies" in update_data:
        new_total = update_data["total_copies"]
        borrowed_count = book.total_copies - book.available_copies
        if new_total < borrowed_count:
            raise HTTPException(
                status_code=400,
                detail=f"修改失败：当前已有 {borrowed_count} 册被借出未还，总藏书量不能小于当前借出册数！"
            )
        book.available_copies = new_total - borrowed_count
        book.total_copies = new_total

    for field, val in update_data.items():
        if field != "total_copies":
            setattr(book, field, val)

    db.commit()
    db.refresh(book)
    b_out = BookOut.model_validate(book)
    b_out.category_name = book.category.name if book.category else ""
    return ApiResponse(message="图书资料已更新", data=b_out)

@router.delete("/{book_id}", response_model=ApiResponse[None])
def delete_book(
    book_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRoles(["admin"]))
):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="图书不存在")

    if book.available_copies < book.total_copies:
        borrowed_cnt = book.total_copies - book.available_copies
        raise HTTPException(
            status_code=400,
            detail=f"下架失败：该图书尚有 {borrowed_cnt} 册在外借阅中，严禁下架删除！"
        )

    # 清理该图书借还历史流水或限制
    db.query(BorrowRecord).filter(BorrowRecord.book_id == book_id).delete()
    db.delete(book)
    db.commit()
    return ApiResponse(message="图书已成功下架注销")
