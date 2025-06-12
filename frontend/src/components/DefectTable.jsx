
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
  Tooltip
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

function DefectTable({ defects, pagination, onPageChange }) {
  const handleChangePage = (event, newPage) => {
    onPageChange(newPage + 1); // MUI uses 0-based, our API uses 1-based
  };

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
          </TableBody>
        </Table>
      </TableContainer>
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