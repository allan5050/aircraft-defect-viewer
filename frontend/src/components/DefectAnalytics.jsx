// components/DefectAnalytics.jsx
import React from 'react';
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
  Tooltip
} from '@mui/material';
import {
  Warning,
  TrendingUp,
  Flight,
  Assessment,
  Refresh
} from '@mui/icons-material';

function StatCard({ title, value, subtitle, icon, color = 'primary' }) {
  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar sx={{ bgcolor: `${color}.light`, color: `${color}.main` }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
}

function DefectAnalytics({ analytics, onRefresh }) {
  // Debug logging to help troubleshoot
  React.useEffect(() => {
    console.log('DefectAnalytics received analytics:', analytics);
    if (analytics?.severity_distribution) {
      console.log('Severity distribution:', analytics.severity_distribution);
      console.log('Top aircraft:', analytics.top_aircraft?.slice(0, 3));
    }
  }, [analytics]);

  if (!analytics) {
    return (
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Analytics Dashboard
        </Typography>
        <Typography color="textSecondary">Loading analytics...</Typography>
      </Box>
    );
  }

  const severityTotal = Object.values(analytics.severity_distribution || {}).reduce((a, b) => a + b, 0);

  return (
    <Box sx={{ mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Analytics Dashboard
        </Typography>
        {onRefresh && (
          <Tooltip title="Refresh Analytics Data">
            <IconButton onClick={onRefresh} color="primary">
              <Refresh />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      
      <Grid container spacing={3}>
        {/* Total Defects */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Defects"
            value={analytics.total_defects || 0}
            subtitle="All time"
            icon={<Assessment />}
            color="primary"
          />
        </Grid>

        {/* High Severity */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="High Severity"
            value={analytics.high_severity_count || 0}
            subtitle={analytics.total_defects ? `${((analytics.high_severity_count / analytics.total_defects) * 100).toFixed(1)}% of total` : '0% of total'}
            icon={<Warning />}
            color="error"
          />
        </Grid>

        {/* Recent Defects */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Recent Defects"
            value={analytics.recent_defects_7d || 0}
            subtitle="Last 7 days"
            icon={<TrendingUp />}
            color="warning"
          />
        </Grid>

        {/* Aircraft Count */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Aircraft Affected"
            value={analytics.top_aircraft?.length || 0}
            subtitle="With defects"
            icon={<Flight />}
            color="success"
          />
        </Grid>

        {/* Severity Distribution */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Severity Distribution
              </Typography>
              {severityTotal > 0 ? (
                Object.entries(analytics.severity_distribution || {}).map(([severity, count]) => (
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

        {/* Top Aircraft */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Aircraft by Defects
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {analytics.top_aircraft && analytics.top_aircraft.length > 0 ? (
                  analytics.top_aircraft.slice(0, 5).map((aircraft, index) => (
                    <Box key={aircraft.aircraft} display="flex" justifyContent="space-between" alignItems="center">
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2" color="textSecondary">
                          #{index + 1}
                        </Typography>
                        <Typography variant="body2">
                          {aircraft.aircraft}
                        </Typography>
                      </Box>
                      <Chip label={`${aircraft.count} defects`} size="small" />
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

export default DefectAnalytics;