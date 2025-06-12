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

  useEffect(() => {
    if (defects && defects.length > 0) {
      const getInsights = async () => {
        try {
          setLoading(true);
          const data = await fetchInsights(defects);
          setInsights(data);
          setError(null);
        } catch (err) {
          setError('Failed to load AI insights.');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      getInsights();
    } else {
      setLoading(false);
      setInsights(null);
    }
  }, [defects]);

  const mtbfValue = insights?.mtbf && Object.values(insights.mtbf)[0]
    ? `${Object.values(insights.mtbf)[0]} days`
    : 'N/A';

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Manual Code Insights (Python)
      </Typography>
      <Card>
        <CardContent>
          {loading && (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          )}
          {error && (
             <Typography color="error">{error}</Typography>
          )}
          {!loading && !error && insights && (
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <StatCard
                        title="Mean Time Between Failures (MTBF)"
                        value={mtbfValue}
                        subtitle={`For aircraft ${insights.top_aircraft_with_mtbf}, based on current data`}
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