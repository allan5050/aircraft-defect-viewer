// src/hooks/useDebounce.js
import { useState, useEffect } from 'react';

/**
 * A custom hook to debounce a value.
 *
 * This is useful for delaying a computationally expensive operation (like an API call)
 * until the user has stopped typing for a specified period.
 *
 * @param {*} value The value to debounce.
 * @param {number} delay The debounce delay in milliseconds.
 * @returns {*} The debounced value.
 */
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set up a timer to update the debounced value after the specified delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timer if the value or delay changes, or if the component unmounts
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
} 