# backend/database/repositories.py
import sqlite3
from typing import Optional, List, Dict, Any

def get_defects_paginated(
    conn: sqlite3.Connection,
    page: int,
    page_size: int,
    aircraft_registration: Optional[str] = None,
    severity: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Retrieves a paginated list of defects from the database with optional filters.

    This function implements efficient, scalable pagination by using `LIMIT` and `OFFSET`
    in the SQL query. It first calculates the total number of records matching the
    filters and then fetches only the records for the requested page.

    Args:
        conn: Active SQLite database connection.
        page: The page number to retrieve (1-indexed).
        page_size: The number of items per page.
        aircraft_registration: Optional filter for aircraft registration.
        severity: Optional filter for defect severity.

    Returns:
        A dictionary containing the list of defects, total count, and pagination details.
    """
    cursor = conn.cursor()
    
    conditions = []
    params = []
    
    if aircraft_registration:
        conditions.append("aircraft_registration = ?")
        params.append(aircraft_registration)
    
    if severity:
        conditions.append("severity = ?")
        params.append(severity)
    
    where_clause = " WHERE " + " AND ".join(conditions) if conditions else ""
    
    # 1. Get total count for pagination
    count_query = f"SELECT COUNT(*) FROM defects{where_clause}"
    cursor.execute(count_query, params)
    total = cursor.fetchone()[0]
    
    # 2. Get the requested page of data
    offset = (page - 1) * page_size
    data_query = f"""
        SELECT id, aircraft_registration, reported_at, defect_type, description, severity
        FROM defects{where_clause}
        ORDER BY reported_at DESC
        LIMIT ? OFFSET ?
    """
    cursor.execute(data_query, params + [page_size, offset])
    
    defects = [dict(row) for row in cursor.fetchall()]
    
    return {
        "data": defects,
        "total": total,
        "page": page,
        "page_size": page_size,
        "has_more": (offset + page_size) < total
    }

def get_distinct_aircraft(conn: sqlite3.Connection) -> List[str]:
    """Retrieves a sorted list of distinct aircraft registrations."""
    cursor = conn.cursor()
    cursor.execute("SELECT DISTINCT aircraft_registration FROM defects ORDER BY aircraft_registration")
    return [row['aircraft_registration'] for row in cursor.fetchall()]

def search_aircraft_by_registration(conn: sqlite3.Connection, query: str) -> List[str]:
    """Searches for aircraft registrations using a partial match."""
    cursor = conn.cursor()
    search_pattern = f"%{query}%"
    cursor.execute(
        "SELECT DISTINCT aircraft_registration FROM defects WHERE aircraft_registration LIKE ? ORDER BY aircraft_registration LIMIT 50",
        (search_pattern,)
    )
    return [row['aircraft_registration'] for row in cursor.fetchall()]

def get_full_analytics(conn: sqlite3.Connection) -> Dict[str, Any]:
    """
    Calculates comprehensive analytics directly in the database for performance.

    This approach is highly scalable as it avoids loading all records into memory.
    All calculations are performed by the database engine using efficient aggregations.

    Args:
        conn: Active SQLite database connection.

    Returns:
        A dictionary containing various analytics metrics.
    """
    cursor = conn.cursor()

    # Severity distribution
    cursor.execute("SELECT severity, COUNT(*) as count FROM defects GROUP BY severity")
    severity_dist = {row['severity']: row['count'] for row in cursor.fetchall()}

    # Top 10 problematic aircraft
    cursor.execute("""
        SELECT aircraft_registration, COUNT(*) as defect_count
        FROM defects
        GROUP BY aircraft_registration
        ORDER BY defect_count DESC
        LIMIT 10
    """)
    top_aircraft = [dict(row) for row in cursor.fetchall()]

    # Total defects
    cursor.execute("SELECT COUNT(*) FROM defects")
    total_defects = cursor.fetchone()[0]

    # High severity count
    cursor.execute("SELECT COUNT(*) FROM defects WHERE severity = 'High'")
    high_severity = cursor.fetchone()[0]

    # Recent defects (last 7 days)
    cursor.execute("SELECT COUNT(*) FROM defects WHERE datetime(reported_at) > datetime('now', '-7 days')")
    recent_defects = cursor.fetchone()[0]

    # Total unique aircraft
    cursor.execute("SELECT COUNT(DISTINCT aircraft_registration) FROM defects")
    total_unique_aircraft = cursor.fetchone()[0]

    return {
        "severity_distribution": severity_dist,
        "top_aircraft": top_aircraft,
        "total_defects": total_defects,
        "high_severity_count": high_severity,
        "recent_defects_7d": recent_defects,
        "total_unique_aircraft": total_unique_aircraft,
    } 