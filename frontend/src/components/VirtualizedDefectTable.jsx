import React, { useState, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
// React Window provides virtual scrolling - only renders visible items for performance.
// This is crucial for handling 100k+ records without UI freezing.
import { VariableSizeList as List } from 'react-window';
import {
  Box,
  Paper,
  Typography,
  Chip,
  IconButton,
  Collapse,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  KeyboardArrowDown,
  KeyboardArrowUp,
  FlightTakeoff
} from '@mui/icons-material';
import { format, isValid } from 'date-fns';
import { VIRTUALIZED_TABLE_CONFIG } from '../config';

const TABLE_HEADERS = ['Aircraft', 'Defect Type', 'Severity', 'Reported Date'];

const getSeverityColor = (severity) => {
  switch (severity) {
    case 'High':
      return 'error';
    case 'Medium':
      return 'warning';
    case 'Low':
      return 'success';
    default:
      return 'default';
  }
};

const formatDisplayDate = (dateString) => {
  const date = new Date(dateString);
  return isValid(date) ? format(date, 'MMM dd, yyyy') : '';
};

const formatTooltipDate = (dateString) => {
  const date = new Date(dateString);
  return isValid(date) ? date.toLocaleString() : '';
};

/**
 * Renders a single row for the virtualized list.
 * React Window calls this component only for rows that are currently visible,
 * which is the key to its performance with large datasets.
 */
function VirtualRow({ index, style, data }) {
  const { items, expandedRows, toggleExpanded } = data;
  const defect = items[index];
  const isExpanded = defect ? expandedRows.has(defect.id) : false;

  // Render a loading placeholder if the defect data for this index hasn't been loaded yet
  if (!defect) {
    return (
      <div style={style}>
        <Box sx={{ display: 'flex', alignItems: 'center', p: 2, height: '100%' }}>
          <CircularProgress size={20} />
          <Typography sx={{ ml: 1 }}>Loading...</Typography>
        </Box>
      </div>
    );
  }

  return (
    <div style={style}>
      <Box sx={{ borderBottom: '1px solid #e0e0e0', '&:hover': { backgroundColor: '#f5f5f5' } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', p: 1, pl: 2, minHeight: VIRTUALIZED_TABLE_CONFIG.ROW_HEIGHT }}>
          <Box sx={{ width: 40 }}><IconButton size="small" onClick={() => toggleExpanded(defect.id)}>{isExpanded ? <KeyboardArrowUp /> : <KeyboardArrowDown />}</IconButton></Box>
          <Box sx={{ flex: '1 1 20%', display: 'flex', alignItems: 'center' }}><FlightTakeoff fontSize="small" color="action" sx={{ mr: 1 }} /> <Typography variant="body2" fontWeight="medium">{defect.aircraft_registration}</Typography></Box>
          <Box sx={{ flex: '1 1 30%' }}><Typography variant="body2">{defect.defect_type}</Typography></Box>
          <Box sx={{ flex: '1 1 15%' }}><Chip label={defect.severity} color={getSeverityColor(defect.severity)} size="small" /></Box>
          <Box sx={{ flex: '1 1 20%' }}><Tooltip title={formatTooltipDate(defect.reported_at)}><Typography variant="body2">{formatDisplayDate(defect.reported_at)}</Typography></Tooltip></Box>
        </Box>
        
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          <Box sx={{ p: 2, backgroundColor: '#fafafa', borderTop: '1px solid #e0e0e0' }}>
            <Typography variant="h6" gutterBottom>
              Defect Details
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              <strong>ID:</strong> {defect.id}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              <strong>Description:</strong> {defect.description}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Reported:</strong> {formatTooltipDate(defect.reported_at)}
            </Typography>
          </Box>
        </Collapse>
      </Box>
    </div>
  );
}

VirtualRow.propTypes = {
  index: PropTypes.number.isRequired,
  style: PropTypes.object.isRequired,
  data: PropTypes.shape({
    items: PropTypes.array.isRequired,
    expandedRows: PropTypes.instanceOf(Set).isRequired,
    toggleExpanded: PropTypes.func.isRequired,
  }).isRequired,
};

/**
 * A high-performance table for displaying very large datasets of defects.
 * It uses virtualization to only render visible rows and infinite scrolling
 * to load data on demand.
 */
function VirtualizedDefectTable({ 
  defects, 
  loading = false, 
  height = 600,
  hasNextPage,
  fetchNextPage,
  isFetchingNextPage 
}) {
  const [expandedRows, setExpandedRows] = useState(new Set());
  const listRef = React.useRef(null);

  const toggleExpanded = useCallback((defectId) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(defectId)) newSet.delete(defectId);
      else newSet.add(defectId);
      return newSet;
    });
    if (listRef.current) {
        listRef.current.resetAfterIndex(0);
    }
  }, []);

  // Infinite scrolling implementation - automatically loads more data when user scrolls near bottom.
  // This combines with virtual scrolling for seamless experience with massive datasets.
  const onItemsRendered = ({ visibleStopIndex }) => {
    const threshold = 10; // Start loading when 10 items from the end
    const shouldLoadMore = 
      hasNextPage && 
      !isFetchingNextPage && 
      visibleStopIndex >= defects.length - threshold;
      
    if (shouldLoadMore) {
      console.log('VirtualizedDefectTable: Loading more data, visible stop index:', visibleStopIndex, 'total items:', defects.length);
      fetchNextPage();
    }
  };

  // Dynamic row height calculation - expanded rows need more space.
  // React Window uses this to maintain smooth scrolling performance.
  const getItemSize = (index) => {
    const defect = defects[index];
    if (!defect || !expandedRows.has(defect.id)) {
      return VIRTUALIZED_TABLE_CONFIG.ROW_HEIGHT;
    }
    return VIRTUALIZED_TABLE_CONFIG.ROW_HEIGHT + 140;
  };

  // Memoized data object to prevent unnecessary re-renders in virtual list.
  const itemData = useMemo(() => ({
    items: defects,
    expandedRows,
    toggleExpanded
  }), [defects, expandedRows, toggleExpanded]);

  if (loading && defects.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading defects...</Typography>
      </Paper>
    );
  }

  return (
    <Paper>
      {/* Table Header */}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow sx={{ display: 'flex' }}>
              <TableCell sx={{ width: 40 }} />
              <TableCell sx={{ flex: '1 1 20%', display: 'flex', alignItems: 'center' }}>{TABLE_HEADERS[0]}</TableCell>
              <TableCell sx={{ flex: '1 1 30%' }}>{TABLE_HEADERS[1]}</TableCell>
              <TableCell sx={{ flex: '1 1 15%' }}>{TABLE_HEADERS[2]}</TableCell>
              <TableCell sx={{ flex: '1 1 20%' }}>{TABLE_HEADERS[3]}</TableCell>
            </TableRow>
          </TableHead>
        </Table>
      </TableContainer>

      {/* Virtual List - the core performance feature for large datasets */}
      <Box sx={{ height: height }}>
        {defects.length > 0 ? (
          <List
            ref={listRef}
            height={height}
            itemCount={defects.length}
            itemSize={getItemSize}
            itemData={itemData}
            overscanCount={5} // Render 5 extra items for smooth scrolling
            onItemsRendered={onItemsRendered} // Enable infinite scrolling
          >
            {VirtualRow}
          </List>
        ) : (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="textSecondary">
              No defects found. Try adjusting your filters.
            </Typography>
          </Box>
        )}
      </Box>

      {/* Loading indicator for infinite scrolling */}
      {isFetchingNextPage && (
        <Box sx={{ p: 2, textAlign: 'center', borderTop: '1px solid #e0e0e0' }}>
          <CircularProgress size={24} />
          <Typography variant="body2" sx={{ ml: 1, display: 'inline' }}>
            Loading more records...
          </Typography>
        </Box>
      )}

      {/* End of data indicator */}
      {!hasNextPage && defects.length > 0 && (
        <Box sx={{ p: 2, textAlign: 'center', borderTop: '1px solid #e0e0e0', backgroundColor: '#f5f5f5' }}>
          <Typography variant="body2" color="textSecondary">
            ✅ All {defects.length} records loaded
          </Typography>
        </Box>
      )}
    </Paper>
  );
}

VirtualizedDefectTable.propTypes = {
  defects: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  height: PropTypes.number,
  hasNextPage: PropTypes.bool,
  fetchNextPage: PropTypes.func.isRequired,
  isFetchingNextPage: PropTypes.bool,
};

export default VirtualizedDefectTable; 