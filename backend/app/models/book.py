from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base

class Book(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    isbn = Column(String(20), unique=True, index=True, nullable=False)
    title = Column(String(200), index=True, nullable=False)
    author = Column(String(100), index=True, nullable=False)
    publisher = Column(String(100), nullable=True)
    publish_date = Column(String(20), nullable=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="RESTRICT"), nullable=False, index=True)
    total_copies = Column(Integer, nullable=False, default=1)
    available_copies = Column(Integer, nullable=False, default=1)
    location = Column(String(50), nullable=True, default="1F-A01")
    cover_url = Column(String(500), nullable=True)
    summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    category = relationship("Category", back_populates="books")
    borrows = relationship("BorrowRecord", back_populates="book")
