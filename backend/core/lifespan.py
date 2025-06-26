# backend/core/lifespan.py
from contextlib import asynccontextmanager
from fastapi import FastAPI
from backend.database.init_db import init_database

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.

    This context manager handles application startup and shutdown events.
    - On startup: It initializes the fallback database.
    - On shutdown: It can be used to clean up resources, like closing database
      connection pools.
    """
    print("Application startup: Initializing database...")
    init_database()
    print("Database initialization complete.")
    yield
    # Add cleanup logic here if needed for shutdown
    print("Application shutdown.") 