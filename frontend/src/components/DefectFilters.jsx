// components/DefectFilters.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Autocomplete,
  Grid,
  CircularProgress
} from '@mui/material';
import { Search, Clear } from '@mui/icons-material';
import { searchAircraft } from '../api/defectApi';

// Debounce function to limit API calls
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function DefectFilters({ filters, onFilterChange }) {
  const [aircraftOptions, setAircraftOptions] = useState([]);
  const [aircraftSearchLoading, setAircraftSearchLoading] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);

  // Debounced search for aircraft
  const debouncedSearchAircraft = useCallback(
    debounce(async (searchTerm) => {
      if (searchTerm && searchTerm.length >= 2) {
        setAircraftSearchLoading(true);
        try {
          const data = await searchAircraft(searchTerm);
          setAircraftOptions(data.aircraft);
        } catch (err) {
          console.error('Error searching aircraft:', err);
          setAircraftOptions([]);
        } finally {
          setAircraftSearchLoading(false);
        }
      } else {
        setAircraftOptions([]);
      }
    }, 300), // 300ms debounce
    []
  );

  // If there's already a selected aircraft, make sure it's in the options
  useEffect(() => {
    if (localFilters.aircraft_registration && !aircraftOptions.includes(localFilters.aircraft_registration)) {
      setAircraftOptions(prev => [localFilters.aircraft_registration, ...prev]);
    }
  }, [localFilters.aircraft_registration, aircraftOptions]);

  const handleFilterChange = (field, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleApplyFilters = () => {
    onFilterChange(localFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      aircraft_registration: '',
      severity: ''
    };
    setLocalFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const hasActiveFilters = localFilters.aircraft_registration || localFilters.severity;

  return (
    <Box sx={{ mb: 3 }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={4}>
          <Autocomplete
            options={aircraftOptions}
            value={localFilters.aircraft_registration || null}
            onChange={(event, newValue) => {
              handleFilterChange('aircraft_registration', newValue || '');
            }}
            onInputChange={(event, newInputValue) => {
              // Trigger search when user types
              debouncedSearchAircraft(newInputValue);
            }}
            isOptionEqualToValue={(option, value) => option === value}
            loading={aircraftSearchLoading}
            loadingText="Searching aircraft..."
            noOptionsText="Type to search aircraft (min 2 characters)"
            renderInput={(params) => (
              <TextField
                {...params}
                label="Aircraft Registration"
                variant="outlined"
                size="small"
                placeholder="Type to search aircraft..."
                InputProps={{
                  ...params.InputProps,
                  startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />,
                  endAdornment: (
                    <>
                      {aircraftSearchLoading ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Severity</InputLabel>
            <Select
              value={localFilters.severity}
              label="Severity"
              onChange={(e) => handleFilterChange('severity', e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="Low">Low</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="High">High</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={5}>
          <Box display="flex" gap={1}>
            <Button
              variant="contained"
              onClick={handleApplyFilters}
              startIcon={<Search />}
            >
              Apply Filters
            </Button>
            {hasActiveFilters && (
              <Button
                variant="outlined"
                onClick={handleClearFilters}
                startIcon={<Clear />}
              >
                Clear
              </Button>
            )}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

export default DefectFilters;