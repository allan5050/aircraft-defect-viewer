import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  TableRow,
  TableCell,
  IconButton,
  Collapse,
  Box,
  Typography,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  KeyboardArrowDown,
  KeyboardArrowUp,
  FlightTakeoff,
} from '@mui/icons-material';
import { format, isValid } from 'date-fns';

/**
 * Formats a date string into a display-friendly format.
 * @param {string} dateString - The date to format.
 * @returns {string} The formatted date.
 */
const formatDisplayDate = (dateString) => {
    const date = new Date(dateString);
    return isValid(date) ? format(date, 'MMM dd, yyyy') : 'Invalid Date';
};

/**
 * Formats a date string for a tooltip.
 * @param {string} dateString - The date to format.
 * @returns {string} The formatted date for the tooltip.
 */
const formatTooltipDate = (dateString) => {
    const date = new Date(dateString);
    return isValid(date) ? date.toLocaleString() : 'Invalid Date';
}

const getSeverityColor = (severity) => {
  switch (severity) {
    case 'High': return 'error';
    case 'Medium': return 'warning';
    case 'Low': return 'success';
    default: return 'default';
  }
};

/**
 * A component representing a single row in the defects table.
 * It includes a collapsible section to show detailed defect information.
 */
function DefectRow({ defect }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TableRow hover sx={{ '& > *': { borderBottom: 'unset' } }}>
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
          <Tooltip title={formatTooltipDate(defect.reported_at)}>
            <span>{formatDisplayDate(defect.reported_at)}</span>
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
                <strong>Reported:</strong> {formatTooltipDate(defect.reported_at)}
              </Typography>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

DefectRow.propTypes = {
  /**
   * The defect object containing data for the row.
   */
  defect: PropTypes.shape({
    id: PropTypes.string.isRequired,
    aircraft_registration: PropTypes.string.isRequired,
    defect_type: PropTypes.string.isRequired,
    severity: PropTypes.string.isRequired,
    reported_at: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
  }).isRequired,
};

export default DefectRow; 