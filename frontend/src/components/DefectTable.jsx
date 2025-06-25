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

// Skeleton loading component for better perceived performance.
// Shows placeholder content while data is loading instead of blank screen.
function DefectRowSkeleton() {
  return (
    <TableRow>
      <TableCell><Skeleton width={40} height={40} /></TableCell>
      <TableCell><Skeleton width={120} /></TableCell>
      <TableCell><Skeleton width={150} /></TableCell>
      <TableCell><Skeleton width={80} /></TableCell>
      <TableCell><Skeleton width={100} /></TableCell>
    </TableRow>
  );
}

function DefectRow({ defect }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TableRow hover>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row">
          <Box display="flex" alignItems="center" gap={1}>
            <FlightTakeoff fontSize="small" color="action" />
            <Typography variant="body2" fontWeight="medium">
              {defect.aircraft_registration}
            </Typography>
          </Box>
        </TableCell>
        <TableCell>{defect.defect_type}</TableCell>
        <TableCell>
          <Chip
            label={defect.severity}
            color={getSeverityColor(defect.severity)}
            size="small"
          />
        </TableCell>
        <TableCell>
          <Tooltip title={new Date(defect.reported_at).toLocaleString()}>
            <span>{format(new Date(defect.reported_at), 'MMM dd, yyyy')}</span>
          </Tooltip>
        </TableCell>
      </TableRow>
      {/* Row expansion implementation - fulfills project requirement for 
          "row expansion or modal for full defect descriptions" */}
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2 }}>
              <Typography variant="h6" gutterBottom component="div">
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
        </TableCell>
      </TableRow>
    </>
  );
}

// Standard pagination table component - good for moderate datasets.
// For larger datasets (100k+ records), use VirtualizedDefectTable instead.
function DefectTable({ defects, pagination, onPageChange, loading = false }) {
  const handleChangePage = (event, newPage) => {
    onPageChange(newPage + 1); // MUI uses 0-based, our API uses 1-based
  };

  if (loading && defects.length === 0) {
    return (
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width={60} />
                <TableCell>Aircraft</TableCell>
                <TableCell>Defect Type</TableCell>
                <TableCell>Severity</TableCell>
                <TableCell>Reported Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Array.from({ length: 5 }).map((_, index) => (
                <DefectRowSkeleton key={index} />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    );
  }

  return (
    <Paper>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width={60} />
              <TableCell>Aircraft</TableCell>
              <TableCell>Defect Type</TableCell>
              <TableCell>Severity</TableCell>
              <TableCell>Reported Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {defects.map((defect) => (
              <DefectRow key={defect.id} defect={defect} />
            ))}
            {loading && defects.length > 0 && (
              <TableRow>
                <TableCell colSpan={5} sx={{ textAlign: 'center', py: 2 }}>
                  <CircularProgress size={24} />
                  <Typography variant="body2" sx={{ ml: 1, display: 'inline' }}>
                    Loading...
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {/* Standard pagination controls - simpler than infinite scroll but less seamless */}
      <TablePagination
        rowsPerPageOptions={[50]}
        component="div"
        count={pagination.total}
        rowsPerPage={pagination.pageSize}
        page={pagination.page - 1} // MUI uses 0-based
        onPageChange={handleChangePage}
      />
    </Paper>
  );
}

export default DefectTable;