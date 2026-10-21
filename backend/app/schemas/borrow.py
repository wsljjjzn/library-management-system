from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict

class BorrowCreate(BaseModel):
    book_id: int
    user_id: Optional[int] = None  # 管理员代办借阅时传，普通用户默认自身

class BorrowReturn(BaseModel):
    remark: Optional[str] = None

class BorrowOut(BaseModel):
    id: int
    record_no: str
    user_id: int
    book_id: int
    borrow_date: datetime
    due_date: datetime
    return_date: Optional[datetime] = None
    status: str
    renew_count: int
    overdue_days: int
    penalty_fee: float
    remark: Optional[str] = None
    created_at: datetime

    # 关联冗余字段展示
    book_title: Optional[str] = None
    book_isbn: Optional[str] = None
    book_cover_url: Optional[str] = None
    user_name: Optional[str] = None
    user_card_number: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class BorrowListResponse(BaseModel):
    total: int
    items: List[BorrowOut]
