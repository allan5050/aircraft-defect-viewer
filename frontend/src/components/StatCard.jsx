import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardContent, Typography, Box, Avatar } from '@mui/material';

/**
 * A reusable card component for displaying a single statistic.
 *
 * It features a title, a prominent value, a subtitle, and a decorative icon.
 */
function StatCard({ title, value, subtitle, icon, color = 'primary' }) {
  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar sx={{ bgcolor: `${color}.light`, color: `${color}.main`, width: 56, height: 56 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
}

StatCard.propTypes = {
  /**
   * The main title of the statistic.
   */
  title: PropTypes.string.isRequired,
  /**
   * The value of the statistic.
   */
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  /**
   * An optional subtitle or additional context.
   */
  subtitle: PropTypes.string,
  /**
   * The icon to display in the card. Should be a MUI Icon component.
   */
  icon: PropTypes.element.isRequired,
  /**
   * The color theme to apply to the icon.
   */
  color: PropTypes.oneOf(['primary', 'secondary', 'error', 'warning', 'success', 'info']),
};

export default StatCard; 