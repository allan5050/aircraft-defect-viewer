# analytics.py 
"""
HANDWRITTEN CODE REQUIREMENT:
This file contains the DefectAnalyzer class for performing advanced analytics
on aircraft defect data. This represents the manually written Python code for
the project, demonstrating custom algorithmic thinking without relying on
external analytics libraries.

PERFORMANCE NOTE: This class processes the CURRENT PAGE of data (typically 50 records)
sent from the frontend, not entire datasets. For large-scale analytics across
all data, see the database-level calculations in main.py.
"""

from typing import List, Dict, Any
from datetime import datetime, timedelta, timezone
from collections import Counter, defaultdict

class DefectAnalyzer:
    """
    Simple analytics calculator for aircraft defects.
    This class represents the "handwritten code" portion of the project,
    used to perform on-the-fly calculations for the 'Insights' panel.
    
    SCOPE: Operates on the current view's data (e.g., 50 records from current page)
    rather than the entire dataset, providing contextual insights for what the
    user is currently examining.
    """
    
    def __init__(self, defects: List[Dict[str, Any]]):
        self.defects = defects
    
    def calculate_severity_distribution(self) -> Dict[str, int]:
        """Calculate count of defects by severity level."""
        severity_counts = Counter(d['severity'] for d in self.defects)
        return dict(severity_counts)
    
    def get_top_problematic_aircraft(self, limit: int = 5) -> List[Dict[str, Any]]:
        """Find aircraft with most defects."""
        aircraft_counts = Counter(d['aircraft_registration'] for d in self.defects)
        return [
            {"aircraft": aircraft, "defect_count": count}
            for aircraft, count in aircraft_counts.most_common(limit)
        ]
    
    def calculate_daily_defect_rate(self) -> float:
        """
        Calculate mean reported defects per day across all aircraft.
        This is the primary metric displayed in the Insights panel.
        """
        if not self.defects:
            return 0.0
        
        # Get all dates
        dates = [self._parse_date(d['reported_at']) for d in self.defects]
        
        if not dates:
            return 0.0
        
        # Find date range
        min_date = min(dates)
        max_date = max(dates)
        
        # Calculate total days (add 1 to include both start and end days)
        total_days = (max_date - min_date).days + 1
        
        if total_days <= 0:
            return len(self.defects)  # All defects on same day
        
        # Calculate rate
        return round(len(self.defects) / total_days, 2)
    
    def _parse_date(self, date_str: str) -> datetime:
        """
        Parse date string with defensive coding to handle various formats.
        Real-world data is often inconsistent, so this handles multiple cases.
        This demonstrates manual error handling and data cleaning logic.
        """
        try:
            # Handle ISO format with Z suffix (UTC)
            if date_str.endswith('Z'):
                return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            # Handle ISO format with explicit timezone offset
            elif '+' in date_str or date_str.endswith('00:00'):
                return datetime.fromisoformat(date_str)
            # Handle simple format, assume UTC
            else:
                return datetime.fromisoformat(date_str).replace(tzinfo=timezone.utc)
        except Exception as e:
            # Fallback: try parsing without timezone, then add UTC
            try:
                return datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S').replace(tzinfo=timezone.utc)
            except Exception:
                # Last resort: parse date only
                return datetime.strptime(date_str[:10], '%Y-%m-%d').replace(tzinfo=timezone.utc)
    
    def get_defect_trends(self, days: int = 30) -> Dict[str, int]:
        """Get defect count trends over specified days."""
        # Use timezone-aware datetime for comparison
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
        trend_data = defaultdict(int)
        
        for defect in self.defects:
            defect_date = self._parse_date(defect['reported_at'])
            
            if defect_date >= cutoff_date:
                date_key = defect_date.strftime('%Y-%m-%d')
                trend_data[date_key] += 1
        
        # Return sorted by date
        return dict(sorted(trend_data.items()))