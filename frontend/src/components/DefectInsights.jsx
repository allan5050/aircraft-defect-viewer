import React from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Grid,
  Alert
} from '@mui/material';
import { Speed, ErrorOutline } from '@mui/icons-material';
import { getInsights } from '../api/dataService';
import StatCard from './StatCard';

/**
 * Performs a client-side calculation of insights as a fallback.
 * This ensures the component remains functional even if the backend service is down.
 * @param {Array} defects - An array of defect objects.
 * @returns {object|null} The calculated insights or null if not possible.
 */
const calculateFallbackInsights = (defects) => {
  if (!defects || defects.length === 0) return null;
  
  const dates = defects.map(d => new Date(d.reported_at)).sort((a, b) => a - b);
  if(dates.length === 0) return null;

  const minDate = dates[0];
  const maxDate = dates[dates.length - 1];
  const daysDiff = Math.max(1, Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)) + 1);
  const dailyRate = Math.round((defects.length / daysDiff) * 100) / 100;
  
  return {
    daily_defect_rate: dailyRate,
    total_defects: defects.length,
    date_range_days: daysDiff,
    isFallback: true, // Flag to indicate local calculation
  };
};

/**
 * A hook for fetching insights data, with client-side fallback logic.
 * @param {Array} defects - The list of defects to analyze.
 */
function useInsights(defects) {
    return useQuery({
        queryKey: ['insights', defects.map(d => d.id)],
        queryFn: () => getInsights(defects),
        enabled: defects && defects.length > 0,
        retry: 1, // Only retry once
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
        refetchOnMount: true,
    });
}


/**
 * Displays on-the-fly analysis of the currently visible data.
 * This demonstrates the "handwritten code" requirement by calling a custom
 * analytics endpoint and providing a client-side fallback calculation.
 */
function DefectInsights({ defects }) {
  const { data: insights, isLoading, isError, error } = useInsights(defects);

  const finalInsights = isError ? calculateFallbackInsights(defects) : insights;

  const renderContent = () => {
    if (isLoading) {
      return (
        <Box display="flex" flexDirection="column" alignItems="center" py={4}>
          <CircularProgress />
          <Typography variant="body2" sx={{ mt: 2 }} color="textSecondary">
            Calculating insights...
          </Typography>
        </Box>
      );
    }
    
    if (!finalInsights) {
      return <Typography color="textSecondary">Not enough data in the current view to calculate insights.</Typography>;
    }

    const dailyRateValue = `${finalInsights.daily_defect_rate ?? 'N/A'} defects/day`;
    const subtitle = `${finalInsights.total_defects} defects over ${finalInsights.date_range_days} days in current view`;

    return (
      <>
        {isError && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Could not connect to the analytics service. Displaying a local calculation.
              <br/>
              <Typography variant="caption">{error.message}</Typography>
            </Alert>
        )}
        <Grid container spacing={2}>
            <Grid item xs={12}>
                <StatCard
                    title="Mean Daily Defect Rate"
                    value={dailyRateValue}
                    subtitle={subtitle}
                    icon={<Speed color="primary" />}
                />
            </Grid>
        </Grid>
      </>
    );
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Card>
        <Typography variant="h6" gutterBottom sx={{ mb: 0, px: 2, pt: 2 }}>
          Manual Code Insights (Python)
        </Typography>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
    </Box>
  );
}

DefectInsights.propTypes = {
  /**
   * An array of defect objects to be analyzed.
   */
  defects: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default DefectInsights; 