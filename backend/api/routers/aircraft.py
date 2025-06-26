# backend/api/routers/aircraft.py
import sqlite3
from typing import List
from fastapi import APIRouter, Depends, Query, Request

from backend.database.connection import get_db_connection
from backend.database import repositories
from backend.core.ratelimit import limiter

router = APIRouter()

@router.get("/api/aircraft", response_model=dict, tags=["Aircraft"])
@limiter.limit("30/minute")
def get_aircraft(
    request: Request,
    conn: sqlite3.Connection = Depends(get_db_connection)
):
    """Retrieves a list of all distinct aircraft registrations."""
    aircraft_list = repositories.get_distinct_aircraft(conn)
    return {"aircraft": aircraft_list}

@router.get("/api/aircraft/search", response_model=dict, tags=["Aircraft"])
@limiter.limit("60/minute")
def search_aircraft(
    request: Request,
    q: str = Query(..., min_length=2, description="Search query for aircraft registration"),
    conn: sqlite3.Connection = Depends(get_db_connection)
):
    """Searches for aircraft registrations by partial match."""
    aircraft_list = repositories.search_aircraft_by_registration(conn, q)
    return {"aircraft": aircraft_list} 