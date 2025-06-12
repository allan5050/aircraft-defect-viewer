# main.py
from fastapi import FastAPI, Query, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel
import sqlite3
import json
from pathlib import Path
from functools import lru_cache
from analytics import DefectAnalyzer
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import time

# Rate limiter setup - uses memory storage for development, Redis in production
limiter = Limiter(key_func=get_remote_address)

# Pydantic models
class Defect(BaseModel):
    id: str
    aircraft_registration: str
    reported_at: str
    defect_type: str
    description: str
    severity: str

class DefectResponse(BaseModel):
    data: List[Defect]
    total: int
    page: int
    page_size: int
    has_more: bool

class AnalyticsResponse(BaseModel):
    severity_distribution: Dict[str, int]
    top_aircraft: List[Dict[str, Any]]
    total_defects: int
    high_severity_count: int
    recent_defects_7d: int
    total_unique_aircraft: int

class InsightRequest(BaseModel):
    defects: List[Defect]

# Initialize FastAPI
app = FastAPI(
    title="Aircraft Defect Analytics API",
    description="API for providing analytics and insights on aircraft maintenance defects. Core defect data is served by Supabase.",
    version="1.0.0"
)

# Add rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite/React default ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup - used as fallback when Supabase is not available
DB_PATH = "defects.db"

# Simple cache variables for analytics
_last_analytics_result = None
_last_analytics_time = 0

def init_database():
    """Initialize SQLite database with sample data if it doesn't exist."""
    if not Path(DB_PATH).exists():
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Create table
        cursor.execute("""
            CREATE TABLE defects (
                id TEXT PRIMARY KEY,
                aircraft_registration TEXT,
                reported_at TEXT,
                defect_type TEXT,
                description TEXT,
                severity TEXT
            )
        """)
        
        # Create indexes for performance
        cursor.execute("CREATE INDEX idx_aircraft_registration ON defects(aircraft_registration)")
        cursor.execute("CREATE INDEX idx_severity ON defects(severity)")
        cursor.execute("CREATE INDEX idx_reported_at_desc ON defects(reported_at DESC)")
        
        # Load sample data
        data_file = Path(__file__).parent.parent / "data" / "SMALL_air_defects.json"
        if data_file.exists():
            with open(data_file, 'r') as f:
                defects = json.load(f)
            
            for defect in defects:
                cursor.execute("""
                    INSERT INTO defects (id, aircraft_registration, reported_at, defect_type, description, severity)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    defect['id'],
                    defect['aircraft_registration'],
                    defect['reported_at'],
                    defect['defect_type'],
                    defect['description'],
                    defect['severity']
                ))
        
        conn.commit()
        conn.close()

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    init_database()

# API Endpoints
@app.get("/api/health")
@limiter.limit("60/minute")  # Health checks are frequent
async def health_check(request: Request):
    """Health check endpoint."""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.get("/api/defects", response_model=DefectResponse)
@limiter.limit("120/minute")  # Main data endpoint - higher limit for user interaction
def get_defects(
    request: Request,
    aircraft_registration: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100)
):
    """Get defects with optional filtering and pagination (fallback endpoint)."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Build query
    conditions = []
    params = []
    
    if aircraft_registration:
        conditions.append("aircraft_registration = ?")
        params.append(aircraft_registration)
    
    if severity:
        conditions.append("severity = ?")
        params.append(severity)
    
    where_clause = " WHERE " + " AND ".join(conditions) if conditions else ""
    
    # Get total count
    count_query = f"SELECT COUNT(*) FROM defects{where_clause}"
    cursor.execute(count_query, params)
    total = cursor.fetchone()[0]
    
    # Get paginated data
    offset = (page - 1) * page_size
    data_query = f"""
        SELECT id, aircraft_registration, reported_at, defect_type, description, severity
        FROM defects{where_clause}
        ORDER BY reported_at DESC
        LIMIT ? OFFSET ?
    """
    cursor.execute(data_query, params + [page_size, offset])
    
    defects = [
        Defect(
            id=row[0],
            aircraft_registration=row[1],
            reported_at=row[2],
            defect_type=row[3],
            description=row[4],
            severity=row[5]
        )
        for row in cursor.fetchall()
    ]
    
    conn.close()
    
    return DefectResponse(
        data=defects,
        total=total,
        page=page,
        page_size=page_size,
        has_more=(offset + page_size) < total
    )

@app.get("/api/aircraft")
@limiter.limit("30/minute")  # Less frequent endpoint
def get_aircraft(request: Request):
    """Get list of distinct aircraft registrations (fallback endpoint)."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("SELECT DISTINCT aircraft_registration FROM defects ORDER BY aircraft_registration")
    aircraft_list = [row[0] for row in cursor.fetchall()]
    
    conn.close()
    
    return {"aircraft": aircraft_list}

@app.get("/api/aircraft/search")
@limiter.limit("60/minute")  # Search endpoint - moderate usage
def search_aircraft(request: Request, q: str = Query(..., min_length=2)):
    """Search aircraft registrations by partial match (fallback endpoint)."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Use SQL LIKE for partial matching
    search_pattern = f"%{q}%"
    cursor.execute(
        "SELECT DISTINCT aircraft_registration FROM defects WHERE aircraft_registration LIKE ? ORDER BY aircraft_registration LIMIT 50",
        (search_pattern,)
    )
    aircraft_list = [row[0] for row in cursor.fetchall()]
    
    conn.close()
    
    return {"aircraft": aircraft_list}

@app.get("/api/analytics", response_model=AnalyticsResponse)
@limiter.limit("20/minute")  # Analytics - expensive operation, lower limit
def get_analytics(request: Request):
    """
    Get defect analytics - optimized for performance.
    Uses database-level calculations instead of fetching all data.
    Cached for 5 minutes to reduce database load.
    """
    global _last_analytics_result, _last_analytics_time
    
    current_time = time.time()
    
    # Check if we have cached data less than 5 minutes old
    if (_last_analytics_result is not None and 
        current_time - _last_analytics_time < 300):  # 5 minutes
        return _last_analytics_result
    
    # Calculate fresh analytics
    result = get_analytics_from_db()
    _last_analytics_result = result
    _last_analytics_time = current_time
    
    return result

def get_analytics_from_db():
    """Calculate analytics directly in the database for optimal performance."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Get severity distribution
    cursor.execute("""
        SELECT severity, COUNT(*) as count 
        FROM defects 
        GROUP BY severity
    """)
    severity_dist = {row[0]: row[1] for row in cursor.fetchall()}
    
    # Get top problematic aircraft
    cursor.execute("""
        SELECT aircraft_registration, COUNT(*) as defect_count 
        FROM defects 
        GROUP BY aircraft_registration 
        ORDER BY defect_count DESC 
        LIMIT 10
    """)
    top_aircraft = [
        {"aircraft": row[0], "count": row[1]} 
        for row in cursor.fetchall()
    ]
    
    # Get total defects
    cursor.execute("SELECT COUNT(*) FROM defects")
    total_defects = cursor.fetchone()[0]
    
    # Get high severity count
    cursor.execute("SELECT COUNT(*) FROM defects WHERE severity = 'High'")
    high_severity = cursor.fetchone()[0]
    
    # Get recent defects (last 7 days) - optimized query
    cursor.execute("""
        SELECT COUNT(*) FROM defects 
        WHERE datetime(reported_at) > datetime('now', '-7 days')
    """)
    recent_defects = cursor.fetchone()[0]
    
    # Get total unique aircraft count
    cursor.execute("SELECT COUNT(DISTINCT aircraft_registration) FROM defects")
    total_unique_aircraft = cursor.fetchone()[0]
    
    conn.close()
    
    return AnalyticsResponse(
        severity_distribution=severity_dist,
        top_aircraft=top_aircraft,
        total_defects=total_defects,
        high_severity_count=high_severity,
        recent_defects_7d=recent_defects,
        total_unique_aircraft=total_unique_aircraft
    )

@app.post("/api/insights")
@limiter.limit("30/minute")  # Insights - computational endpoint, moderate limit
async def get_insights(request: Request, insight_request: InsightRequest):
    """
    Run advanced analytics on a given set of defects.
    This uses the manual DefectAnalyzer class.
    """
    if not insight_request.defects:
        return {
            "daily_defect_rate": 0.0,
            "total_defects": 0,
            "date_range_days": 0
        }

    analyzer = DefectAnalyzer(defects=[d.dict() for d in insight_request.defects])

    # Calculate daily defect rate across all aircraft
    daily_rate = analyzer.calculate_daily_defect_rate()
    
    # Additional context information
    total_defects = len(insight_request.defects)
    
    # Calculate date range for context
    dates = [analyzer._parse_date(d.reported_at) for d in insight_request.defects]
    date_range_days = 0
    if dates:
        min_date = min(dates)
        max_date = max(dates)
        date_range_days = (max_date - min_date).days + 1

    return {
        "daily_defect_rate": daily_rate,
        "total_defects": total_defects,
        "date_range_days": date_range_days
    }

# Run with: uvicorn main:app --reload --port 8000
