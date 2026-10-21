from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    full_name: str = Field(..., min_length=1, max_length=64)
    email: str = Field(..., pattern=r"^[\w\.-]+@[\w\.-]+\.\w+$")
    phone: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=100)

class UserLogin(BaseModel):
    username: str
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = Field(None, pattern=r"^[\w\.-]+@[\w\.-]+\.\w+$")
    phone: Optional[str] = None
    password: Optional[str] = None
    max_borrow_count: Optional[int] = None
    is_active: Optional[bool] = None

class UserOut(UserBase):
    id: int
    role: str
    card_number: str
    max_borrow_count: int
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class UserWithStats(UserOut):
    current_borrow_count: int = 0
    has_overdue: bool = False


