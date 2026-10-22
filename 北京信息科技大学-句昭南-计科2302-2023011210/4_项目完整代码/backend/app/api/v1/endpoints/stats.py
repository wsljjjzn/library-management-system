from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.schemas.response import ApiResponse
from app.services.stats_service import StatsService

router = APIRouter()

@router.get("/overview", response_model=ApiResponse[dict])
def get_stats_overview(db: Session = Depends(get_db)):
    data = StatsService.get_overview(db)
    return ApiResponse(data=data)

@router.get("/trends", response_model=ApiResponse[dict])
def get_stats_trends(db: Session = Depends(get_db)):
    data = StatsService.get_trends(db)
    return ApiResponse(data=data)
