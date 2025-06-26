/**
 * Application Configuration
 *
 * It's a best practice to centralize configuration variables rather than
 * hardcoding them directly in components or API files.
 *
 * In a production-grade application, these values would typically be loaded
 * from environment variables (e.g., using `import.meta.env.VITE_API_BASE_URL`).
 * Since the `.env` file is git-ignored and cannot be edited by the assistant,
 * we are defining them as constants here.
 */

export const API_BASE_URL = 'http://localhost:8000/api';

export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  PAGE_SIZE: 50,
};

export const VIRTUALIZED_TABLE_CONFIG = {
  ROW_HEIGHT: 40,
  HEADER_HEIGHT: 56,
}; 