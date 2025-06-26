# backend/api/routers/analytics.py
import sqlite3
import time
from fastapi import APIRouter, Depends, Request
from backend.analytics import DefectAnalyzer

from backend.database.connection import get_db_connection
from backend.database import repositories
from backend.schemas.defects import AnalyticsResponse, InsightRequest
from backend.core.ratelimit import limiter

router = APIRouter()

# Simple in-memory cache for analytics to reduce database load.
# In production, this would be a distributed cache like Redis.
_last_analytics_result = None
_last_analytics_time = 0

@router.get("/api/analytics", response_model=AnalyticsResponse, tags=["Analytics"])
@limiter.limit("20/minute")
def get_analytics(
    request: Request,
    conn: sqlite3.Connection = Depends(get_db_connection)
):
    """
    Retrieves defect analytics, optimized for performance.

    This endpoint uses database-level calculations instead of fetching all data,
    and results are cached in-memory for 5 minutes to reduce database load in a
    multi-user environment.
    """
    global _last_analytics_result, _last_analytics_time
    
    current_time = time.time()
    
    # Check if we have a cached result that is less than 5 minutes old
    if (_last_analytics_result and current_time - _last_analytics_time < 300):
        return _last_analytics_result
    
    # If cache is stale or empty, calculate fresh analytics
    analytics_data = repositories.get_full_analytics(conn)
    result = AnalyticsResponse(**analytics_data)

    _last_analytics_result = result
    _last_analytics_time = current_time
    
    return result

@router.post("/api/insights", tags=["Analytics"])
@limiter.limit("30/minute")
async def get_insights(request: Request, insight_request: InsightRequest):
    """
    Runs advanced analytics on a given set of defects.

    This endpoint uses the `DefectAnalyzer` class to perform manual, in-depth
    analysis on a list of defects provided in the request body.
    """
    if not insight_request.defects:
        return {
            "daily_defect_rate": 0.0,
            "total_defects": 0,
            "date_range_days": 0
        }

    # The DefectAnalyzer expects a list of dicts
    defects_data = [d.model_dump() for d in insight_request.defects]
    analyzer = DefectAnalyzer(defects=defects_data)

    daily_rate = analyzer.calculate_daily_defect_rate()
    total_defects = len(insight_request.defects)
    
    dates = [analyzer._parse_date(d.reported_at) for d in insight_request.defects]
    date_range_days = 0
    if dates:
        min_date = min(dates)
        max_date = max(dates)
        # Add 1 to make the range inclusive
        date_range_days = (max_date - min_date).days + 1

    return {
        "daily_defect_rate": daily_rate,
        "total_defects": total_defects,
        "date_range_days": date_range_days
    } 