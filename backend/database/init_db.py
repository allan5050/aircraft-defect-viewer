# backend/database/init_db.py
import sqlite3
import json
from pathlib import Path

# The database file will be in the `backend` directory, so we go up one level
DB_PATH = Path(__file__).parent.parent / "defects.db"
DATA_FILE = Path(__file__).parent.parent.parent / "data" / "SMALL_air_defects.json"

def init_database():
    """
    Initializes the SQLite database if it doesn't exist.

    This function creates the `defects` table, defines its schema, and populates it
    with initial data from a JSON file. This serves as the core of the fallback
    system, ensuring the API can provide mock data if the primary database
    (e.g., Supabase) is unavailable.

    - Creates `defects` table.
    - Creates indexes on `aircraft_registration`, `severity`, and `reported_at`
      to optimize query performance.
    - Seeds the table with data from `data/SMALL_air_defects.json`.
    """
    if DB_PATH.exists():
        return

    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        # Create table
        cursor.execute("""
            CREATE TABLE defects (
                id TEXT PRIMARY KEY,
                aircraft_registration TEXT NOT NULL,
                reported_at TIMESTAMP NOT NULL,
                defect_type TEXT NOT NULL,
                description TEXT NOT NULL,
                severity TEXT NOT NULL CHECK (severity IN ('Low','Medium','High'))
            )
        """)

        # Create indexes for better query performance
        cursor.execute("CREATE INDEX idx_aircraft_registration ON defects(aircraft_registration)")
        cursor.execute("CREATE INDEX idx_severity ON defects(severity)")
        cursor.execute("CREATE INDEX idx_reported_at_desc ON defects(reported_at DESC)")

        # Load and insert sample data
        if DATA_FILE.exists():
            with open(DATA_FILE, 'r', encoding='utf-8') as f:
                defects = json.load(f)

            for defect in defects:
                cursor.execute("""
                    INSERT INTO defects (id, aircraft_registration, reported_at, defect_type, description, severity)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    defect.get('id'),
                    defect.get('aircraft_registration'),
                    defect.get('reported_at'),
                    defect.get('defect_type'),
                    defect.get('description'),
                    defect.get('severity')
                ))
        
        conn.commit()
    except sqlite3.Error as e:
        print(f"Database initialization error: {e}")
        # If something went wrong, remove the partially created db file
        if DB_PATH.exists():
            DB_PATH.unlink()
    finally:
        if 'conn' in locals() and conn:
            conn.close()

if __name__ == '__main__':
    print("Initializing database...")
    init_database()
    print("Database initialized successfully.") 