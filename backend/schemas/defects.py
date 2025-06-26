# backend/schemas/defects.py
from pydantic import BaseModel
from typing import List, Dict, Any

class Defect(BaseModel):
    """Represents a single defect record."""
    id: str
    aircraft_registration: str
    reported_at: str
    defect_type: str
    description: str
    severity: str

class DefectResponse(BaseModel):
    """Response model for paginated defect records."""
    data: List[Defect]
    total: int
    page: int
    page_size: int
    has_more: bool

class AnalyticsResponse(BaseModel):
    """Response model for analytics data."""
    severity_distribution: Dict[str, int]
    top_aircraft: List[Dict[str, Any]]
    total_defects: int
    high_severity_count: int
    recent_defects_7d: int
    total_unique_aircraft: int

class InsightRequest(BaseModel):
    """Request model for generating insights from a list of defects."""
    defects: List[Defect]

class HealthCheck(BaseModel):
    """Response model for health check."""
    status: str
    timestamp: str 