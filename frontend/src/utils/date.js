import { format, isValid } from 'date-fns';

/**
 * Formats a date string into a more readable format.
 * Defaults to 'MMM dd, yyyy' (e.g., "Jun 26, 2025").
 * Returns an empty string if the date is invalid.
 *
 * @param {string} dateString - The date string to format.
 * @param {string} formatString - The desired output format.
 * @returns {string} The formatted date string.
 */
export function formatDisplayDate(dateString, formatString = 'MMM dd, yyyy') {
  const date = new Date(dateString);
  if (!isValid(date)) {
    return '';
  }
  return format(date, formatString);
}

/**
 * Formats a date string into a detailed, localized string for tooltips.
 * Example: "6/26/2025, 3:30:00 PM" (depending on locale).
 * Returns an empty string if the date is invalid.
 * 
 * @param {string} dateString - The date string to format.
 * @returns {string} The formatted, localized date-time string.
 */
export function formatTooltipDate(dateString) {
    const date = new Date(dateString);
    if (!isValid(date)) {
        return '';
    }
    return date.toLocaleString();
} 