# backend/main.py
import sys
from pathlib import Path

# Add project root to the Python path
# This allows the app to be run from the 'backend' directory using 'uvicorn main:app'
# as well as from the project root using 'uvicorn backend.main:app'.
project_root = Path(__file__).parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded

from backend.core.lifespan import lifespan
from backend.core.ratelimit import limiter
from backend.api.routers import defects, aircraft, analytics
from slowapi import _rate_limit_exceeded_handler
from datetime import datetime
from backend.schemas.defects import HealthCheck

app = FastAPI(
    title="Aircraft Defect Analytics API",
    description="API for providing analytics and insights on aircraft maintenance defects. This is the fallback service.",
    version="1.1.0",
    lifespan=lifespan,
)

# Add rate limiting state and handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(defects.router)
app.include_router(aircraft.router)
app.include_router(analytics.router)

@app.get("/api/health", response_model=HealthCheck, tags=["Health"])
@limiter.limit("60/minute")
async def health_check(request: Request):
    """
    Health check endpoint to verify that the API is running.
    """
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

# The uvicorn command to run this would be:
# uvicorn backend.main:app --reload --port 8000
