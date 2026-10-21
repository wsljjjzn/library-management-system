from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from app.db.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(64), nullable=False, default="")
    email = Column(String(120), unique=True, index=True, nullable=False)
    phone = Column(String(20), nullable=True)
    role = Column(String(20), nullable=False, default="reader")  # reader, librarian, admin
    card_number = Column(String(32), unique=True, index=True, nullable=False)
    max_borrow_count = Column(Integer, nullable=False, default=5)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    borrows = relationship("BorrowRecord", back_populates="user", cascade="all, delete-orphan")
