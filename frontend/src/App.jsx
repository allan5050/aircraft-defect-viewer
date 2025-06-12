// App.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import DefectTable from './components/DefectTable';
import DefectFilters from './components/DefectFilters';
import DefectAnalytics from './components/DefectAnalytics';
import DefectInsights from './components/DefectInsights';
import { fetchDefects, fetchAnalytics } from './api/defectApi';

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
  const [defects, setDefects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    aircraft_registration: '',
    severity: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 50,
    total: 0,
    hasMore: false
  });
  const [analytics, setAnalytics] = useState(null);

  // Load defects
  const loadDefects = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetchDefects({
        ...filters,
        page: pagination.page,
        page_size: pagination.pageSize
      });
      
      setDefects(response.data);
      setPagination({
        page: response.page,
        pageSize: response.page_size,
        total: response.total,
        hasMore: response.has_more
      });
    } catch (err) {
      setError('Failed to load defects. Please try again.');
      console.error('Error loading defects:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.pageSize]);

  // Load analytics
  const loadAnalytics = useCallback(async () => {
    try {
      const data = await fetchAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error('Error loading analytics:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadDefects();
    loadAnalytics();
  }, [loadDefects, loadAnalytics]);

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

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
        {analytics && (
          <DefectAnalytics analytics={analytics} />
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
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Defects Table */}
          {loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : (
            <DefectTable
              defects={defects}
              pagination={pagination}
              onPageChange={handlePageChange}
            />
          )}
        </Paper>
      </Container>
    </ThemeProvider>
  );
}

export default App;