from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.deps import RequireRoles, get_current_user, get_db
from app.models.book import Book
from app.models.borrow import BorrowRecord
from app.models.user import User
from app.schemas.borrow import BorrowCreate, BorrowListResponse, BorrowOut, BorrowReturn
from app.schemas.response import ApiResponse
from app.services.borrow_service import BorrowService

router = APIRouter()

def _populate_borrow_out(b: BorrowRecord) -> BorrowOut:
    b_out = BorrowOut.model_validate(b)
    if b.book:
        b_out.book_title = b.book.title
        b_out.book_isbn = b.book.isbn
        b_out.book_cover_url = b.book.cover_url
    if b.user:
        b_out.user_name = b.user.full_name or b.user.username
        b_out.user_card_number = b.user.card_number
    return b_out

@router.post("/borrow", response_model=ApiResponse[BorrowOut])
def borrow_book(
    borrow_in: BorrowCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_user_id = current_user.id
    if borrow_in.user_id and current_user.role in ["admin", "librarian"]:
        target_user_id = borrow_in.user_id

    record = BorrowService.borrow_book(db, user_id=target_user_id, book_id=borrow_in.book_id)
    return ApiResponse(message="借阅成功，请妥善保管图书并在借期截止日前归还", data=_populate_borrow_out(record))

@router.post("/return/{record_id}", response_model=ApiResponse[BorrowOut])
def return_book(
    record_id: int,
    return_in: Optional[BorrowReturn] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    remark = return_in.remark if return_in else None
    record = BorrowService.return_book(db, record_id=record_id, operator_user=current_user, remark=remark)
    
    msg = "图书归还成功，库存已实时回补入库"
    if record.overdue_days > 0:
        msg = f"图书归还成功！该书已逾期 {record.overdue_days} 天，产生逾期滞纳金 ￥{record.penalty_fee:.2f}"
    return ApiResponse(message=msg, data=_populate_borrow_out(record))

@router.post("/renew/{record_id}", response_model=ApiResponse[BorrowOut])
def renew_book(
    record_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    record = BorrowService.renew_book(db, record_id=record_id, operator_user=current_user)
    return ApiResponse(
        message=f"续借成功！借期已成功延长30天，最新应还时间为：{record.due_date.strftime('%Y-%m-%d')}",
        data=_populate_borrow_out(record)
    )

@router.get("/my", response_model=ApiResponse[BorrowListResponse])
def get_my_borrows(
    status_filter: Optional[str] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 动态核对并标记已超期记录
    now = datetime.now(timezone.utc)
    active_borrows = db.query(BorrowRecord).filter(
        BorrowRecord.user_id == current_user.id,
        BorrowRecord.status.in_(["BORROWED", "OVERDUE"])
    ).all()
    need_commit = False
    for b in active_borrows:
        due_dt = b.due_date.replace(tzinfo=timezone.utc) if b.due_date.tzinfo is None else b.due_date
        if due_dt < now and b.status != "OVERDUE":
            b.status = "OVERDUE"
            need_commit = True
    if need_commit:
        db.commit()

    query = db.query(BorrowRecord).filter(BorrowRecord.user_id == current_user.id)
    if status_filter:
        query = query.filter(BorrowRecord.status == status_filter)

    total = query.count()
    records = query.order_by(BorrowRecord.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
    items = [_populate_borrow_out(r) for r in records]

    return ApiResponse(data=BorrowListResponse(total=total, items=items))

@router.get("/all", response_model=ApiResponse[BorrowListResponse])
def get_all_borrows(
    keyword: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    current_user: User = Depends(RequireRoles(["admin", "librarian"])),
    db: Session = Depends(get_db)
):
    # 动态标记全馆超期
    now = datetime.now(timezone.utc)
    overdue_candidates = db.query(BorrowRecord).filter(
        BorrowRecord.status == "BORROWED",
        BorrowRecord.due_date < now
    ).all()
    if overdue_candidates:
        for b in overdue_candidates:
            b.status = "OVERDUE"
        db.commit()

    query = db.query(BorrowRecord).join(User, BorrowRecord.user_id == User.id).join(Book, BorrowRecord.book_id == Book.id)

    if keyword:
        pattern = f"%{keyword.strip()}%"
        query = query.filter(
            or_(
                BorrowRecord.record_no.ilike(pattern),
                User.username.ilike(pattern),
                User.full_name.ilike(pattern),
                User.card_number.ilike(pattern),
                Book.title.ilike(pattern),
                Book.isbn.ilike(pattern)
            )
        )

    if status_filter:
        query = query.filter(BorrowRecord.status == status_filter)

    total = query.count()
    records = query.order_by(BorrowRecord.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
    items = [_populate_borrow_out(r) for r in records]

    return ApiResponse(data=BorrowListResponse(total=total, items=items))
