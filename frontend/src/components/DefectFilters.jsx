// components/DefectFilters.jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
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
import { useAircraftSearch } from '../hooks/useDefects';
import { useDebounce } from '../hooks/useDebounce';

/**
 * A component that provides filtering options for the defects table.
 * It includes a server-side searchable dropdown for aircraft and a severity filter.
 */
function DefectFilters({ filters, onFilterChange }) {
  const [localFilters, setLocalFilters] = useState(filters);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Debounce the search term to avoid excessive API calls while typing
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  // Use the custom hook to fetch aircraft search results
  const { data: searchResults, isLoading: isSearchLoading } = useAircraftSearch(debouncedSearchTerm);
  
  const aircraftOptions = searchResults?.aircraft || [];

  // If the currently selected aircraft is not in the options list (e.g., on initial load),
  // add it to the list to ensure the Autocomplete component can display it correctly.
  useEffect(() => {
    if (filters.aircraft_registration && !aircraftOptions.includes(filters.aircraft_registration)) {
      setLocalFilters(prev => ({ ...prev, aircraft_registration: filters.aircraft_registration }));
    }
  }, [filters.aircraft_registration, aircraftOptions]);
  

  const handleLocalFilterChange = (field, value) => {
    setLocalFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleApplyFilters = () => {
    onFilterChange(localFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = { aircraft_registration: '', severity: '' };
    setLocalFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const hasActiveFilters = localFilters.aircraft_registration || localFilters.severity;

  // Combine initial aircraft (if any) with search results
  const autocompleteOptions = [...new Set([filters.aircraft_registration, ...aircraftOptions].filter(Boolean))];

  return (
    <Box sx={{ mb: 3 }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={4}>
          <Autocomplete
            options={autocompleteOptions}
            value={localFilters.aircraft_registration || null}
            onChange={(event, newValue) => {
              handleLocalFilterChange('aircraft_registration', newValue || '');
            }}
            onInputChange={(event, newInputValue) => {
              setSearchTerm(newInputValue);
            }}
            loading={isSearchLoading}
            loadingText="Searching aircraft..."
            noOptionsText={debouncedSearchTerm.length < 2 ? "Type at least 2 characters" : "No results"}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Aircraft Registration"
                variant="outlined"
                size="small"
                placeholder="Type to search..."
                InputProps={{
                  ...params.InputProps,
                  startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />,
                  endAdornment: (
                    <>
                      {isSearchLoading ? <CircularProgress color="inherit" size={20} /> : null}
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
              onChange={(e) => handleLocalFilterChange('severity', e.target.value)}
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
              Apply
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

DefectFilters.propTypes = {
  /**
   * The current filter state.
   */
  filters: PropTypes.shape({
    aircraft_registration: PropTypes.string,
    severity: PropTypes.string,
  }).isRequired,
  /**
   * Callback function to apply the selected filters.
   */
  onFilterChange: PropTypes.func.isRequired,
};

export default DefectFilters;