// App.jsx
import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Alert
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import DefectTable from './components/DefectTable';
import DefectFilters from './components/DefectFilters';
import DefectAnalytics from './components/DefectAnalytics';
import DefectInsights from './components/DefectInsights';
import { useDefectsPaginated, useAnalytics } from './hooks/useDefects';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    error: {
      main: '#f44336',
    },
    warning: {
      main: '#ff9800',
    },
    success: {
      main: '#4caf50',
    },
  },
});

function App() {
  const [filters, setFilters] = useState({
    aircraft_registration: '',
    severity: ''
  });
  const [page, setPage] = useState(1);

  // Use TanStack Query hooks for data fetching
  const { 
    data: defectsResponse, 
    isLoading: defectsLoading, 
    error: defectsError 
  } = useDefectsPaginated(filters, page);

  const { 
    data: analytics, 
    isLoading: analyticsLoading,
    refreshAnalytics 
  } = useAnalytics();

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const defects = defectsResponse?.data || [];
  const pagination = defectsResponse ? {
    page: defectsResponse.page,
    pageSize: defectsResponse.page_size,
    total: defectsResponse.total,
    hasMore: defectsResponse.has_more
  } : { page: 1, pageSize: 50, total: 0, hasMore: false };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            Aircraft Defect Viewer
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Monitor and analyze aircraft maintenance defects
          </Typography>
        </Box>

        {/* Analytics Dashboard */}
        {analytics && !analyticsLoading && (
          <DefectAnalytics 
            analytics={analytics} 
            onRefresh={refreshAnalytics}
          />
        )}

        {/* Manual Code Insights */}
        <DefectInsights defects={defects} />

        {/* Main Content */}
        <Paper elevation={3} sx={{ p: 3 }}>
          {/* Filters */}
          <DefectFilters
            filters={filters}
            onFilterChange={handleFilterChange}
          />

          {/* Error Alert */}
          {defectsError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Failed to load defects. Please try again.
            </Alert>
          )}

          {/* Defects Table */}
          <DefectTable
            defects={defects}
            pagination={pagination}
            onPageChange={handlePageChange}
            loading={defectsLoading}
          />
        </Paper>
      </Container>
    </ThemeProvider>
  );
}

export default App;