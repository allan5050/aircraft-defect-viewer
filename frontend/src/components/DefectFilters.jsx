// components/DefectFilters.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Autocomplete,
  Grid
} from '@mui/material';
import { Search, Clear } from '@mui/icons-material';
import { fetchAircraftList } from '../api/defectApi';

function DefectFilters({ filters, onFilterChange }) {
  const [aircraftList, setAircraftList] = useState([]);
  const [localFilters, setLocalFilters] = useState(filters);

  // Load aircraft list for autocomplete
  useEffect(() => {
    const loadAircraft = async () => {
      try {
        const data = await fetchAircraftList();
        setAircraftList(data.aircraft);
      } catch (err) {
        console.error('Error loading aircraft list:', err);
      }
    };
    loadAircraft();
  }, []);

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
            options={aircraftList}
            value={localFilters.aircraft_registration || null}
            onChange={(event, newValue) => {
              handleFilterChange('aircraft_registration', newValue || '');
            }}
            isOptionEqualToValue={(option, value) => option === value}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Aircraft Registration"
                variant="outlined"
                size="small"
                InputProps={{
                  ...params.InputProps,
                  startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />,
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