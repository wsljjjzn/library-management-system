from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base

class BorrowRecord(Base):
    __tablename__ = "borrow_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    record_no = Column(String(40), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    book_id = Column(Integer, ForeignKey("books.id", ondelete="RESTRICT"), nullable=False, index=True)
    borrow_date = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    due_date = Column(DateTime, nullable=False, index=True)
    return_date = Column(DateTime, nullable=True)
    status = Column(String(20), nullable=False, default="BORROWED", index=True)  # BORROWED, RETURNED, OVERDUE
    renew_count = Column(Integer, nullable=False, default=0)
    overdue_days = Column(Integer, nullable=False, default=0)
    penalty_fee = Column(Float, nullable=False, default=0.0)
    remark = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="borrows")
    book = relationship("Book", back_populates="borrows")
