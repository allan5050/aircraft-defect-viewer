# analytics.py 
"""
This file contains the DefectAnalyzer class for performing
advanced analytics on aircraft defect data.
This represents the manually written Python code for the project.
"""

from typing import List, Dict, Any
from datetime import datetime, timedelta, timezone
from collections import Counter, defaultdict

class DefectAnalyzer:
    """Simple analytics calculator for aircraft defects."""
    
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
    
    def calculate_mtbf(self, aircraft_registration: str) -> float:
        """Calculate Mean Time Between Failures for specific aircraft in days."""
        aircraft_defects = [
            d for d in self.defects 
            if d['aircraft_registration'] == aircraft_registration
        ]
        
        if len(aircraft_defects) < 2:
            return 0.0
        
        # Sort by date
        sorted_defects = sorted(
            aircraft_defects, 
            key=lambda x: datetime.fromisoformat(x['reported_at'].replace('Z', '+00:00'))
        )
        
        # Calculate time differences
        time_diffs = []
        for i in range(1, len(sorted_defects)):
            prev_time = datetime.fromisoformat(sorted_defects[i-1]['reported_at'].replace('Z', '+00:00'))
            curr_time = datetime.fromisoformat(sorted_defects[i]['reported_at'].replace('Z', '+00:00'))
            diff = (curr_time - prev_time).days
            if diff > 0:
                time_diffs.append(diff)
        
        return round(sum(time_diffs) / len(time_diffs), 1) if time_diffs else 0.0
    
    def get_defect_trends(self, days: int = 30) -> Dict[str, int]:
        """Get defect count trends over specified days."""
        # Use timezone-aware datetime for comparison
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
        trend_data = defaultdict(int)
        
        for defect in self.defects:
            # The fromisoformat method correctly parses the 'Z' (Zulu time / UTC)
            defect_date = datetime.fromisoformat(defect['reported_at'])
            
            if defect_date >= cutoff_date:
                date_key = defect_date.strftime('%Y-%m-%d')
                trend_data[date_key] += 1
        
        # Return sorted by date
        return dict(sorted(trend_data.items()))