import { API_BASE_URL } from '../config';

/**
 * =============================================================================
 * Fallback API Service
 * =============================================================================
 *
 * This module contains functions for interacting with the Python-based
 * FastAPI backend. It serves as a fallback data source if the primary
 * Supabase service is unavailable.
 *
 */

/**
 * Fetches a paginated list of defects from the fallback API.
 *
 * @param {object} params - The query parameters.
 * @param {number} params.page - The page number to fetch.
 * @param {number} params.page_size - The number of items per page.
 * @param {string} [params.aircraft_registration] - Optional aircraft registration to filter by.
 * @param {string} [params.severity] - Optional severity to filter by.
 * @returns {Promise<object>} A promise that resolves to the paginated defect data.
 * @throws {Error} If the network request fails.
 */
export async function fetchDefectsFallback(params = {}) {
  const { page, page_size, aircraft_registration, severity } = params;

  const queryParams = new URLSearchParams({
    page: page.toString(),
    page_size: page_size.toString(),
  });

  if (aircraft_registration) {
    queryParams.append('aircraft_registration', aircraft_registration);
  }
  if (severity) {
    queryParams.append('severity', severity);
  }

  const response = await fetch(`${API_BASE_URL}/defects?${queryParams}`);
  if (!response.ok) {
    throw new Error('Failed to fetch defects from fallback API');
  }
  return response.json();
}

/**
 * Fetches analytics data from the fallback API.
 *
 * @returns {Promise<object>} A promise that resolves to the analytics data.
 * @throws {Error} If the network request fails.
 */
export async function fetchAnalyticsFallback() {
  const response = await fetch(`${API_BASE_URL}/analytics`);
  if (!response.ok) {
    throw new Error('Failed to fetch analytics from fallback API');
  }
  return response.json();
}

/**
 * Searches for aircraft registrations using the fallback API.
 *
 * @param {string} searchTerm - The search term for the aircraft registration.
 * @returns {Promise<object>} A promise that resolves to a list of matching aircraft.
 */
export async function searchAircraftFallback(searchTerm) {
  const response = await fetch(`${API_BASE_URL}/aircraft/search?q=${encodeURIComponent(searchTerm)}`);
  if (!response.ok) {
    // Return empty on error rather than throwing to avoid breaking the UI
    return { aircraft: [] };
  }
  return response.json();
}

/**
 * Fetches insights for a given set of defects from the fallback API.
 *
 * @param {Array<object>} defects - The list of defects to analyze.
 * @returns {Promise<object>} A promise that resolves to the insight data.
 * @throws {Error} If the network request fails or returns an error status.
 */
export async function fetchInsightsFallback(defects) {
  try {
    const response = await fetch(`${API_BASE_URL}/insights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ defects }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment.');
      }
      throw new Error(`Failed to fetch insights: ${errorText || response.statusText}`);
    }
    return response.json();
  } catch (error) {
    if (error.name === 'TypeError') {
      throw new Error('Backend server is not responding. Is it running?');
    }
    throw error;
  }
} 