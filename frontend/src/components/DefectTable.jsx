// components/DefectTable.jsx
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Chip,
  IconButton,
  Collapse,
  Box,
  Typography,
  Tooltip,
  CircularProgress,
  Skeleton
} from '@mui/material';
import {
  KeyboardArrowDown,
  KeyboardArrowUp,
  FlightTakeoff
} from '@mui/icons-material';
import { format } from 'date-fns';
import PropTypes from 'prop-types';
import DefectRow from './DefectRow';

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

const TABLE_HEADERS = ['Aircraft', 'Defect Type', 'Severity', 'Reported Date'];

/**
 * A skeleton loader for the DefectRow component.
 * Renders placeholder content while data is loading.
 */
function DefectRowSkeleton() {
  return (
    <TableRow>
      <TableCell><Skeleton variant="circular" width={32} height={32} /></TableCell>
      {TABLE_HEADERS.map(header => (
        <TableCell key={header}><Skeleton /></TableCell>
      ))}
    </TableRow>
  );
}

function DefectTable({ defects, pagination, onPageChange, loading = false }) {
  const handleChangePage = (event, newPage) => {
    onPageChange(newPage + 1); // MUI uses 0-based, our API uses 1-based
  };

  const showInitialLoading = loading && defects.length === 0;
  const showPaginationLoading = loading && defects.length > 0;

  return (
    <Paper>
      <TableContainer>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell width={60} />
              {TABLE_HEADERS.map(header => (
                <TableCell key={header}>{header}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {showInitialLoading ? (
              Array.from({ length: 10 }).map((_, index) => (
                <DefectRowSkeleton key={index} />
              ))
            ) : (
              defects.map((defect) => (
                <DefectRow key={defect.id} defect={defect} />
              ))
            )}
            {showPaginationLoading && (
              <TableRow>
                <TableCell colSpan={TABLE_HEADERS.length + 1} sx={{ textAlign: 'center', py: 4 }}>
                  <Box display="flex" justifyContent="center" alignItems="center" gap={1}>
                    <CircularProgress size={24} />
                    <Typography>Loading more data...</Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[pagination.pageSize]}
        component="div"
        count={pagination.total}
        rowsPerPage={pagination.pageSize}
        page={pagination.page - 1} // Adjust for 0-based index
        onPageChange={handleChangePage}
      />
    </Paper>
  );
}

DefectTable.propTypes = {
  /**
   * An array of defect objects to display in the table.
   */
  defects: PropTypes.arrayOf(PropTypes.object).isRequired,
  /**
   * An object containing pagination details.
   */
  pagination: PropTypes.shape({
    total: PropTypes.number,
    page: PropTypes.number,
    pageSize: PropTypes.number,
  }).isRequired,
  /**
   * Callback function for when the page is changed.
   */
  onPageChange: PropTypes.func.isRequired,
  /**
   * Boolean to indicate if data is currently loading.
   */
  loading: PropTypes.bool,
};

export default DefectTable;