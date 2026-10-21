from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

class CategoryBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=64)
    code: str = Field(..., min_length=1, max_length=20)
    description: Optional[str] = None
    sort_order: int = 0

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    sort_order: Optional[int] = None

class CategoryOut(CategoryBase):
    id: int
    created_at: datetime
    book_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)

