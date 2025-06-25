import React, { useState, useMemo } from 'react';
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
import { format } from 'date-fns';

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

// Individual row component for the virtual list.
// React Window calls this component only for visible rows, enabling smooth scrolling
// with massive datasets.
const VirtualRow = ({ index, style, data }) => {
  const { items, expandedRows, toggleExpanded } = data;
  const defect = items[index];
  const isExpanded = expandedRows.has(defect.id);

  if (!defect) {
    return (
      <div style={style}>
        <Box sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
          <CircularProgress size={20} />
          <Typography sx={{ ml: 1 }}>Loading...</Typography>
        </Box>
      </div>
    );
  }

  return (
    <div style={style}>
      <Box sx={{ 
        borderBottom: '1px solid #e0e0e0',
        '&:hover': { backgroundColor: '#f5f5f5' }
      }}>
        {/* Main row */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          p: 2, 
          minHeight: 60 
        }}>
          <IconButton
            size="small"
            onClick={() => toggleExpanded(defect.id)}
            sx={{ mr: 2 }}
          >
            {isExpanded ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
          
          <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 150, mr: 3 }}>
            <FlightTakeoff fontSize="small" color="action" sx={{ mr: 1 }} />
            <Typography variant="body2" fontWeight="medium">
              {defect.aircraft_registration}
            </Typography>
          </Box>
          
          <Box sx={{ minWidth: 200, mr: 3 }}>
            <Typography variant="body2">
              {defect.defect_type}
            </Typography>
          </Box>
          
          <Box sx={{ minWidth: 100, mr: 3 }}>
            <Chip
              label={defect.severity}
              color={getSeverityColor(defect.severity)}
              size="small"
            />
          </Box>
          
          <Box sx={{ minWidth: 120 }}>
            <Tooltip title={new Date(defect.reported_at).toLocaleString()}>
              <Typography variant="body2">
                {format(new Date(defect.reported_at), 'MMM dd, yyyy')}
              </Typography>
            </Tooltip>
          </Box>
        </Box>
        
        {/* Expanded content - requirement for "row expansion or modal" */}
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
              <strong>Reported:</strong> {new Date(defect.reported_at).toLocaleString()}
            </Typography>
          </Box>
        </Collapse>
      </Box>
    </div>
  );
};

function VirtualizedDefectTable({ 
  defects, 
  loading = false, 
  height = 600,
  hasNextPage,
  fetchNextPage,
  isFetchingNextPage 
}) {
  const [expandedRows, setExpandedRows] = useState(new Set());

  const toggleExpanded = (defectId) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(defectId)) {
        newSet.delete(defectId);
      } else {
        newSet.add(defectId);
      }
      return newSet;
    });
  };

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
    if (!defect) return 60;
    
    const isExpanded = expandedRows.has(defect.id);
    return isExpanded ? 200 : 60; // Base height + expanded content
  };

  // Memoized data object to prevent unnecessary re-renders in virtual list.
  const itemData = useMemo(() => ({
    items: defects,
    expandedRows,
    toggleExpanded
  }), [defects, expandedRows]);

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
            <TableRow>
              <TableCell width={60} />
              <TableCell width={150}>Aircraft</TableCell>
              <TableCell width={200}>Defect Type</TableCell>
              <TableCell width={100}>Severity</TableCell>
              <TableCell width={120}>Reported Date</TableCell>
            </TableRow>
          </TableHead>
        </Table>
      </TableContainer>

      {/* Virtual List - the core performance feature for large datasets */}
      <Box sx={{ height: height }}>
        {defects.length > 0 ? (
          <List
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

export default VirtualizedDefectTable; 