# backend/api/routers/defects.py
import sqlite3
from typing import Optional
from fastapi import APIRouter, Depends, Query, Request

from backend.database.connection import get_db_connection
from backend.database import repositories
from backend.schemas.defects import DefectResponse
from backend.core.ratelimit import limiter


router = APIRouter()

@router.get("/api/defects", response_model=DefectResponse, tags=["Defects"])
@limiter.limit("120/minute")
def get_defects(
    request: Request,
    aircraft_registration: Optional[str] = Query(None, description="Filter by aircraft registration"),
    severity: Optional[str] = Query(None, description="Filter by defect severity"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Number of items per page"),
    conn: sqlite3.Connection = Depends(get_db_connection),
):
    """
    Retrieves a paginated list of defect records.
    
    This endpoint serves as a fallback to the primary Supabase API and provides
    paginated access to the defect data stored in the local SQLite database.
    It supports filtering by aircraft registration and severity.
    """
    result = repositories.get_defects_paginated(
        conn, page, page_size, aircraft_registration, severity
    )
    return DefectResponse(**result) 