import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Chip,
  Grid
} from '@mui/material';
import { Speed } from '@mui/icons-material';
import { fetchInsights } from '../api/defectApi';

function StatCard({ title, value, icon, subtitle }) {
  return (
    <Box>
      <Typography color="textSecondary" gutterBottom variant="body2">
        {title}
      </Typography>
      <Box display="flex" alignItems="center" gap={2}>
        {icon}
        <Typography variant="h5" component="div">
          {value}
        </Typography>
      </Box>
      {subtitle && (
        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}

function DefectInsights({ defects }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingFallback, setUsingFallback] = useState(false);

  // Fallback calculation if backend is unavailable
  const calculateFallbackInsights = (defects) => {
    if (!defects || defects.length === 0) return null;
    
    const dates = defects.map(d => new Date(d.reported_at)).sort((a, b) => a - b);
    const minDate = dates[0];
    const maxDate = dates[dates.length - 1];
    const daysDiff = Math.max(1, Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)) + 1);
    const dailyRate = Math.round((defects.length / daysDiff) * 100) / 100;
    
    return {
      daily_defect_rate: dailyRate,
      total_defects: defects.length,
      date_range_days: daysDiff
    };
  };

  useEffect(() => {
    if (defects && defects.length > 0) {
      const getInsights = async () => {
        try {
          console.log('DefectInsights: Starting to fetch insights for', defects.length, 'defects');
          setLoading(true);
          setError(null);
          setUsingFallback(false);
          
          // Add timeout to prevent infinite loading
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout after 8 seconds')), 8000)
          );
          
          const data = await Promise.race([
            fetchInsights(defects),
            timeoutPromise
          ]);
          
          console.log('DefectInsights: Successfully received insights:', data);
          setInsights(data);
          setError(null);
        } catch (err) {
          console.error('DefectInsights: Error fetching insights:', err);
          
          // Use fallback calculation
          console.log('DefectInsights: Using fallback calculation');
          const fallbackData = calculateFallbackInsights(defects);
          setInsights(fallbackData);
          setUsingFallback(true);
          setError(`Using local calculation: ${err.message || 'Backend unavailable'}`);
        } finally {
          setLoading(false);
        }
      };
      getInsights();
    } else {
      console.log('DefectInsights: No defects provided, skipping insights');
      setLoading(false);
      setInsights(null);
      setError(null);
      setUsingFallback(false);
    }
  }, [defects]);

  const dailyRateValue = (() => {
    if (!insights || insights.daily_defect_rate === undefined) return 'N/A';
    const rate = insights.daily_defect_rate;
    if (rate === 0) return '0 defects/day';
    return `${rate} defects/day`;
  })();

  const getSubtitle = () => {
    if (!insights) return 'Based on current data';
    const { total_defects, date_range_days } = insights;
    const fallbackText = usingFallback ? ' (local calculation)' : '';
    return `${total_defects} defects over ${date_range_days} days in current view${fallbackText}`;
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Card>
        <Typography variant="h6" gutterBottom sx={{ mb: 0, px: 2, pt: 2 }}>
          Manual Code Insights (Python)
        </Typography>
        <CardContent>
          {loading && (
            <Box display="flex" flexDirection="column" alignItems="center" py={4}>
              <CircularProgress />
              <Typography variant="body2" sx={{ mt: 2 }} color="textSecondary">
                Calculating insights...
              </Typography>
            </Box>
          )}
          {error && !usingFallback && (
            <Box sx={{ p: 2, backgroundColor: '#ffebee', borderRadius: 1 }}>
              <Typography color="error" variant="body2">
                {error}
              </Typography>
              <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                This might be due to rate limiting or backend connectivity issues.
              </Typography>
            </Box>
          )}
          {usingFallback && (
            <Box sx={{ p: 1, backgroundColor: '#fff3e0', borderRadius: 1, mb: 2 }}>
              <Typography variant="caption" color="orange">
                ⚠️ Using local calculation (backend unavailable)
              </Typography>
            </Box>
          )}
          {!loading && insights && (
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <StatCard
                        title="Mean Daily Defect Rate"
                        value={dailyRateValue}
                        subtitle={getSubtitle()}
                        icon={<Speed color="primary" />}
                    />
                </Grid>
            </Grid>
          )}
           {!loading && !error && !insights && (
             <Typography color="textSecondary">Not enough data in the current view to calculate insights.</Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default DefectInsights; 