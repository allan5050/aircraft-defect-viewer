# backend/database/connection.py
import sqlite3
from pathlib import Path
from fastapi import HTTPException

DB_PATH = Path(__file__).parent.parent / "defects.db"

def get_db_connection():
    """
    Dependency to get a database connection.

    Yields a database connection and cursor, ensuring the connection is closed
    after the request is finished. This pattern is crucial for managing database
    resources efficiently and preventing connection leaks.

    Raises:
        HTTPException: If the database file is not found.
    """
    if not DB_PATH.exists():
        raise HTTPException(
            status_code=503, 
            detail="Fallback database not available. Please run initialization."
        )
    
    try:
        conn = sqlite3.connect(DB_PATH)
        # Use a row factory to get dictionary-like results
        conn.row_factory = sqlite3.Row
        yield conn
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    finally:
        if 'conn' in locals() and conn:
            conn.close() 