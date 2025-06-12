// App.jsx
import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Alert,
  FormControlLabel,
  Switch,
  Chip
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import DefectTable from './components/DefectTable';
import VirtualizedDefectTable from './components/VirtualizedDefectTable';
import DefectFilters from './components/DefectFilters';
import DefectAnalytics from './components/DefectAnalytics';
import DefectInsights from './components/DefectInsights';
import { useDefectsPaginated, useDefects, useAnalytics } from './hooks/useDefects';

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
  const [virtualMode, setVirtualMode] = useState(false);

  // Use TanStack Query hooks for data fetching
  // Regular pagination mode
  const { 
    data: defectsResponse, 
    isLoading: defectsLoading, 
    error: defectsError 
  } = useDefectsPaginated(filters, page);

  // Virtual scrolling mode - infinite query
  const {
    data: infiniteData,
    isLoading: infiniteLoading,
    error: infiniteError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useDefects(filters);

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

  // Handle page change (for regular mode)
  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  // Prepare data based on mode
  const defects = virtualMode 
    ? infiniteData?.pages?.flatMap(page => page.data) || []
    : defectsResponse?.data || [];
    
  const pagination = defectsResponse ? {
    page: defectsResponse.page,
    pageSize: defectsResponse.page_size,
    total: defectsResponse.total,
    hasMore: defectsResponse.has_more
  } : { page: 1, pageSize: 50, total: 0, hasMore: false };

  const isLoading = virtualMode ? infiniteLoading : defectsLoading;
  const error = virtualMode ? infiniteError : defectsError;

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

          {/* Table Controls and Record Count */}
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip 
                label={`${defects.length} records loaded`} 
                size="small" 
                color="primary" 
                variant="outlined" 
              />
              {virtualMode && defects.length > 0 && (
                <>
                  {isFetchingNextPage && (
                    <Chip 
                      label="Loading more..." 
                      size="small" 
                      color="warning"
                      variant="outlined" 
                    />
                  )}
                  {!hasNextPage && !isFetchingNextPage && (
                    <Chip 
                      label="All loaded" 
                      size="small" 
                      color="success"
                      variant="outlined" 
                    />
                  )}
                </>
              )}
            </Box>
            
            <FormControlLabel
              control={
                <Switch
                  checked={virtualMode}
                  onChange={(e) => setVirtualMode(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2">
                    Virtual Scrolling
                  </Typography>
                  <Chip 
                    label="100k+ records" 
                    size="small" 
                    color="secondary" 
                    variant="outlined" 
                  />
                </Box>
              }
            />
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Failed to load defects. Please try again.
            </Alert>
          )}

          {/* Defects Table - Switch between regular and virtualized */}
          {virtualMode ? (
            <VirtualizedDefectTable
              defects={defects}
              loading={isLoading || isFetchingNextPage}
              height={600}
              hasNextPage={hasNextPage}
              fetchNextPage={fetchNextPage}
              isFetchingNextPage={isFetchingNextPage}
            />
          ) : (
            <DefectTable
              defects={defects}
              pagination={pagination}
              onPageChange={handlePageChange}
              loading={isLoading}
            />
          )}

          {/* Virtual Mode Instructions */}
          {virtualMode && (
            <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Virtual Scrolling Mode:</strong> Optimized for massive datasets. 
                Renders only visible rows for 60 FPS performance with 100k+ records. 
                Automatically loads more data as you scroll near the bottom.
              </Typography>
            </Box>
          )}
        </Paper>
      </Container>
    </ThemeProvider>
  );
}

export default App;