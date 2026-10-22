from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.book import Book
from app.models.borrow import BorrowRecord
from app.models.category import Category
from app.models.user import User

class StatsService:
    @staticmethod
    def get_overview(db: Session) -> Dict[str, Any]:
        total_titles = db.query(func.count(Book.id)).scalar() or 0
        total_volumes = db.query(func.sum(Book.total_copies)).scalar() or 0
        available_volumes = db.query(func.sum(Book.available_copies)).scalar() or 0
        borrowed_volumes = total_volumes - available_volumes

        total_readers = db.query(func.count(User.id)).filter(User.role == "reader").scalar() or 0
        active_borrows = db.query(func.count(BorrowRecord.id)).filter(
            BorrowRecord.status.in_(["BORROWED", "OVERDUE"])
        ).scalar() or 0

        # 检查并更新已超期的单据
        now = datetime.now(timezone.utc)
        overdue_borrows = db.query(func.count(BorrowRecord.id)).filter(
            BorrowRecord.status.in_(["BORROWED", "OVERDUE"]),
            BorrowRecord.due_date < now
        ).scalar() or 0

        total_circulations = db.query(func.count(BorrowRecord.id)).scalar() or 0

        return {
            "total_titles": total_titles,
            "total_volumes": total_volumes,
            "available_volumes": available_volumes,
            "borrowed_volumes": max(0, borrowed_volumes),
            "total_readers": total_readers,
            "active_borrows": active_borrows,
            "overdue_borrows": overdue_borrows,
            "total_circulations": total_circulations,
        }

    @staticmethod
    def get_trends(db: Session) -> Dict[str, Any]:
        # 近 7 天借还趋势
        now = datetime.now(timezone.utc)
        dates = []
        borrow_counts = []
        return_counts = []

        for i in range(6, -1, -1):
            day = now - timedelta(days=i)
            day_str = day.strftime("%m-%d")
            dates.append(day_str)

            start_day = datetime(day.year, day.month, day.day, 0, 0, 0, tzinfo=timezone.utc)
            end_day = datetime(day.year, day.month, day.day, 23, 59, 59, tzinfo=timezone.utc)

            b_cnt = db.query(func.count(BorrowRecord.id)).filter(
                BorrowRecord.borrow_date >= start_day,
                BorrowRecord.borrow_date <= end_day
            ).scalar() or 0
            borrow_counts.append(b_cnt)

            r_cnt = db.query(func.count(BorrowRecord.id)).filter(
                BorrowRecord.return_date.isnot(None),
                BorrowRecord.return_date >= start_day,
                BorrowRecord.return_date <= end_day
            ).scalar() or 0
            return_counts.append(r_cnt)

        # 热门图书借阅排行榜 Top 8
        popular_sub = db.query(
            BorrowRecord.book_id,
            func.count(BorrowRecord.id).label("borrow_count")
        ).group_by(BorrowRecord.book_id).subquery()

        popular_books_query = db.query(
            Book.id,
            Book.title,
            Book.author,
            Book.isbn,
            Book.cover_url,
            func.coalesce(popular_sub.c.borrow_count, 0).label("times")
        ).outerjoin(popular_sub, Book.id == popular_sub.c.book_id)\
         .order_by(popular_sub.c.borrow_count.desc().nullslast())\
         .limit(8).all()

        popular_books = [
            {
                "id": b.id,
                "title": b.title,
                "author": b.author,
                "isbn": b.isbn,
                "cover_url": b.cover_url,
                "times": b.times
            }
            for b in popular_books_query
        ]

        # 图书分类占比分布
        categories = db.query(Category).all()
        category_distribution = []
        for cat in categories:
            cnt = db.query(func.count(Book.id)).filter(Book.category_id == cat.id).scalar() or 0
            if cnt > 0:
                category_distribution.append({
                    "name": cat.name,
                    "value": cnt
                })

        return {
            "dates": dates,
            "borrow_counts": borrow_counts,
            "return_counts": return_counts,
            "popular_books": popular_books,
            "category_distribution": category_distribution
        }
