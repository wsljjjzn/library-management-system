import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.config import settings
from app.models.book import Book
from app.models.borrow import BorrowRecord
from app.models.user import User

class BorrowService:
    @staticmethod
    def get_user_borrow_stats(db: Session, user_id: int) -> Tuple[int, bool]:
        # 统计在借数量与是否有逾期
        active_borrows = db.query(BorrowRecord).filter(
            BorrowRecord.user_id == user_id,
            BorrowRecord.status.in_(["BORROWED", "OVERDUE"])
        ).all()
        
        has_overdue = False
        now = datetime.now(timezone.utc)
        for b in active_borrows:
            due_dt = b.due_date.replace(tzinfo=timezone.utc) if b.due_date.tzinfo is None else b.due_date
            if due_dt < now:
                b.status = "OVERDUE"
                has_overdue = True
        if has_overdue:
            db.commit()

        return len(active_borrows), has_overdue

    @staticmethod
    def borrow_book(db: Session, user_id: int, book_id: int) -> BorrowRecord:
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.is_active:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="读者账户不存在或已被冻结")

        current_count, has_overdue = BorrowService.get_user_borrow_stats(db, user_id)
        if has_overdue:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="您的账户名下存在逾期未归还的图书，系统已暂停您的借阅权限，请先归还并结清超期图书！"
            )

        if current_count >= user.max_borrow_count:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"您当前已借阅 {current_count} 本图书，已达最大在借上限 ({user.max_borrow_count}本)，请先归还部分图书再借！"
            )

        # 检查是否重复借同一本书尚未归还
        already_borrowed = db.query(BorrowRecord).filter(
            BorrowRecord.user_id == user_id,
            BorrowRecord.book_id == book_id,
            BorrowRecord.status.in_(["BORROWED", "OVERDUE"])
        ).first()
        if already_borrowed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="您当前已经借阅了本书尚未归还，不可重复借阅同一书目！"
            )

        # 原子扣减库存校验
        book = db.query(Book).filter(Book.id == book_id).first()
        if not book:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="目标图书不存在")

        if book.available_copies <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="该图书当前所有册数已全部借出，暂无可借在架库存，请稍后再试！"
            )

        # 扣减库存
        book.available_copies -= 1

        now = datetime.now(timezone.utc)
        due_date = now + timedelta(days=settings.DEFAULT_BORROW_DAYS)
        record_no = f"BR-{now.strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

        record = BorrowRecord(
            record_no=record_no,
            user_id=user_id,
            book_id=book_id,
            borrow_date=now,
            due_date=due_date,
            status="BORROWED",
            renew_count=0,
            overdue_days=0,
            penalty_fee=0.0,
            remark="读者线上自主借阅"
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return record

    @staticmethod
    def return_book(db: Session, record_id: int, operator_user: User, remark: Optional[str] = None) -> BorrowRecord:
        record = db.query(BorrowRecord).filter(BorrowRecord.id == record_id).first()
        if not record:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="借阅记录不存在")

        if record.status == "RETURNED":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="该图书此前已归还，无需重复操作")

        # 权限校验：读者只能归还自己的图书，管理员可代还任意图书
        if operator_user.role == "reader" and record.user_id != operator_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="无权操作他人的借阅记录")

        now = datetime.now(timezone.utc)
        record.return_date = now

        # 计算逾期天数与罚金
        due_dt = record.due_date.replace(tzinfo=timezone.utc) if record.due_date.tzinfo is None else record.due_date
        if now > due_dt:
            delta = now - due_dt
            overdue_days = max(1, delta.days)
            record.overdue_days = overdue_days
            record.penalty_fee = round(overdue_days * settings.DAILY_PENALTY_FEE, 2)
            record.status = "RETURNED"
        else:
            record.overdue_days = 0
            record.penalty_fee = 0.0
            record.status = "RETURNED"

        if remark:
            record.remark = remark

        # 回补库存
        book = db.query(Book).filter(Book.id == record.book_id).first()
        if book:
            if book.available_copies < book.total_copies:
                book.available_copies += 1

        db.commit()
        db.refresh(record)
        return record

    @staticmethod
    def renew_book(db: Session, record_id: int, operator_user: User) -> BorrowRecord:
        record = db.query(BorrowRecord).filter(BorrowRecord.id == record_id).first()
        if not record:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="借阅记录不存在")

        if record.status != "BORROWED":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="仅在借中且未逾期的图书支持续借")

        if operator_user.role == "reader" and record.user_id != operator_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="无权操作他人的借阅记录")

        if record.renew_count >= 1:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="该图书已办理过一次续借，根据图书馆规章最多仅能续借一次！")

        now = datetime.now(timezone.utc)
        due_dt = record.due_date.replace(tzinfo=timezone.utc) if record.due_date.tzinfo is None else record.due_date
        if now > due_dt:
            record.status = "OVERDUE"
            db.commit()
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="该图书已超期，无法办理续借手续，请尽快到馆归还！")

        # 延期30天
        record.due_date = due_dt + timedelta(days=settings.DEFAULT_BORROW_DAYS)
        record.renew_count += 1
        db.commit()
        db.refresh(record)
        return record
