// components/DefectAnalytics.jsx
// This component provides the high-level analytics dashboard that gives users
// a quick overview of key metrics before diving into the detailed table data.
import React from 'react';
import PropTypes from 'prop-types';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip,
  Avatar,
  Button,
  IconButton,
  Tooltip,
  Skeleton,
  CircularProgress
} from '@mui/material';
import {
  Warning,
  TrendingUp,
  Flight,
  Assessment,
  Refresh
} from '@mui/icons-material';
import StatCard from './StatCard';

/**
 * A skeleton loader for the StatCard component.
 */
const StatCardSkeleton = () => (
  <Card>
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Skeleton variant="text" width={100} />
          <Skeleton variant="text" width={50} height={40} />
          <Skeleton variant="text" width={120} />
        </Box>
        <Skeleton variant="circular" width={56} height={56} />
      </Box>
    </CardContent>
  </Card>
);

// Main analytics dashboard component.
// Displays key metrics that help users identify critical issues quickly,
// supporting the business requirement for "structured data exchange" insights.
function DefectAnalytics({ analytics, isLoading, onRefresh }) {
  console.log("DefectAnalytics received props:", {
    analytics,
    isLoading,
    hasRefresh: !!onRefresh
  });

  // Handle both formats: { summary: {...} } from Supabase RPC and direct {...} from fallback API
  const summary = analytics?.summary || analytics;
  const severityTotal = summary ? Object.values(summary.severity_distribution || {}).reduce((a, b) => a + b, 0) : 0;

  if (isLoading) {
    return (
      <Box sx={{ mb: 3 }}>
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
              <CircularProgress />
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (!summary) {
    console.warn("DefectAnalytics: Missing or invalid analytics summary data:", analytics);
    return (
      <Box sx={{ mb: 3 }}>
        <Card>
          <CardContent>
            <Typography color="error">
              Analytics data is not available.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  console.log("DefectAnalytics rendering with summary:", summary);

  return (
    <Box sx={{ mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Analytics Dashboard
        </Typography>
        {/* Manual refresh capability gives users control over data freshness */}
        {onRefresh && (
          <Tooltip title="Refresh Analytics Data">
            <IconButton onClick={onRefresh} color="primary" disabled={isLoading}>
              <Refresh />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      
      <Grid container spacing={3}>
        {/* Key performance indicators arranged for quick scanning */}
        {/* Total Defects */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Defects"
            value={summary.total_defects ?? 0}
            subtitle="All time"
            icon={<Assessment />}
            color="primary"
          />
        </Grid>

        {/* High Severity - most critical metric for maintenance teams */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="High Severity"
            value={summary.high_severity_count ?? 0}
            subtitle={summary.total_defects ? `${((summary.high_severity_count / summary.total_defects) * 100).toFixed(1)}% of total` : '0% of total'}
            icon={<Warning />}
            color="error"
          />
        </Grid>

        {/* Recent Defects */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Recent Defects"
            value={summary.recent_defects_7d ?? 0}
            subtitle="Last 7 days"
            icon={<TrendingUp />}
            color="warning"
          />
        </Grid>

        {/* Aircraft Count */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Aircraft Affected"
            value={summary.total_unique_aircraft ?? 0}
            subtitle="Unique aircraft with defects"
            icon={<Flight />}
            color="success"
          />
        </Grid>

        {/* Severity Distribution - visual breakdown for quick assessment */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Severity Distribution
              </Typography>
              {severityTotal > 0 ? (
                Object.entries(summary.severity_distribution || {}).map(([severity, count]) => (
                  <Box key={severity} sx={{ mb: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="body2">{severity}</Typography>
                      <Typography variant="body2">{count} ({((count / severityTotal) * 100).toFixed(1)}%)</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(count / severityTotal) * 100}
                      color={severity === 'High' ? 'error' : severity === 'Medium' ? 'warning' : 'success'}
                      sx={{ height: 8, borderRadius: 1 }}
                    />
                  </Box>
                ))
              ) : (
                <Typography color="textSecondary">No severity data available</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Top Aircraft - identifies which aircraft need immediate attention */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Aircraft by Defects
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {summary.top_aircraft && summary.top_aircraft.length > 0 ? (
                  summary.top_aircraft.slice(0, 5).map((aircraft, index) => (
                    <Box key={aircraft.aircraft || aircraft.aircraft_registration} display="flex" justifyContent="space-between" alignItems="center">
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2" color="textSecondary">
                          #{index + 1}
                        </Typography>
                        <Typography variant="body2">
                          {aircraft.aircraft || aircraft.aircraft_registration}
                        </Typography>
                      </Box>
                      <Chip label={`${aircraft.count || aircraft.defect_count} defects`} size="small" />
                    </Box>
                  ))
                ) : (
                  <Typography color="textSecondary">No aircraft data available</Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

DefectAnalytics.propTypes = {
  /**
   * The analytics data object fetched from the API.
   */
  analytics: PropTypes.shape({
    summary: PropTypes.shape({
      total_defects: PropTypes.number,
      high_severity_count: PropTypes.number,
      recent_defects_7d: PropTypes.number,
      total_unique_aircraft: PropTypes.number,
      severity_distribution: PropTypes.objectOf(PropTypes.number),
      top_aircraft: PropTypes.arrayOf(PropTypes.shape({
        aircraft: PropTypes.string,
        count: PropTypes.number,
      })),
    }),
    total_defects: PropTypes.number,
    high_severity_count: PropTypes.number,
    recent_defects_7d: PropTypes.number,
    total_unique_aircraft: PropTypes.number,
    severity_distribution: PropTypes.objectOf(PropTypes.number),
    top_aircraft: PropTypes.arrayOf(PropTypes.shape({
      aircraft: PropTypes.string,
      count: PropTypes.number,
    })),
  }),
  /**
   * Boolean to indicate if the analytics data is currently loading.
   */
  isLoading: PropTypes.bool.isRequired,
  /**
   * Callback function to trigger a manual refresh of the analytics data.
   */
  onRefresh: PropTypes.func.isRequired,
};

export default DefectAnalytics;