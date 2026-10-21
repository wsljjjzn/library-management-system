from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field

class BookBase(BaseModel):
    isbn: str = Field(..., min_length=10, max_length=20)
    title: str = Field(..., min_length=1, max_length=200)
    author: str = Field(..., min_length=1, max_length=100)
    publisher: Optional[str] = None
    publish_date: Optional[str] = None
    category_id: int
    total_copies: int = Field(1, ge=1)
    location: Optional[str] = "1F-A01"
    cover_url: Optional[str] = None
    summary: Optional[str] = None

class BookCreate(BookBase):
    pass

class BookUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    publisher: Optional[str] = None
    publish_date: Optional[str] = None
    category_id: Optional[int] = None
    total_copies: Optional[int] = None
    location: Optional[str] = None
    cover_url: Optional[str] = None
    summary: Optional[str] = None

class BookOut(BookBase):
    id: int
    available_copies: int
    created_at: datetime
    updated_at: datetime
    category_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class BookListResponse(BaseModel):
    total: int
    items: List[BookOut]
