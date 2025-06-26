// src/api/dataService.js
import * as supabaseApi from './supabaseApi';
import * as fallbackApi from './fallbackApi';

/**
 * =============================================================================
 * Data Service (Orchestrator)
 * =============================================================================
 *
 * This module acts as the primary interface for data fetching in the application.
 * It implements a resilience pattern:
 * 1. Try to fetch data from the primary source (Supabase).
 * 2. If Supabase is unavailable or the request fails, automatically fall back
 *    to the secondary source (FastAPI backend).
 *
 * This decouples the UI from the data source logic, making the application
 * more robust and maintainable.
 */

/**
 * Determines if Supabase is available by checking the existence of the client.
 * @returns {boolean}
 */
const isSupabaseAvailable = () => supabaseApi.isSupabaseAvailable();

/**
 * Fetches defects, trying Supabase first and falling back to the local API.
 * @param {object} filters - The filters to apply to the query.
 * @returns {Promise<any>}
 */
export const getDefects = async (filters) => {
    if (isSupabaseAvailable()) {
        try {
            console.log("Attempting to fetch defects from Supabase...");
            const data = await supabaseApi.fetchDefectsSupabase(filters);
            return data;
        } catch (error) {
            console.error("Supabase fetch failed, falling back to local API.", error);
            // Fall through to use the fallback API
        }
    }
    console.log("Fetching defects from fallback API...");
    return fallbackApi.fetchDefectsFallback(filters);
};

/**
 * Searches for aircraft, trying Supabase first and falling back to the local API.
 * @param {string} searchTerm - The search term.
 * @returns {Promise<any>}
 */
export const searchAircraft = async (searchTerm) => {
    if (isSupabaseAvailable()) {
        try {
            const data = await supabaseApi.searchAircraftSupabase(searchTerm);
            return data;
        } catch (error) {
            console.error("Supabase search failed, falling back to local API.", error);
            // Fall through to use the fallback API
        }
    }
    console.log("Searching aircraft from fallback API...");
    return fallbackApi.searchAircraftFallback(searchTerm);
};

/**
 * Fetches analytics data. Tries Supabase first, then falls back to local API.
 * @returns {Promise<any>}
 */
export const getAnalytics = async () => {
    if (isSupabaseAvailable()) {
        try {
            console.log("Attempting to fetch analytics from Supabase...");
            const data = await supabaseApi.fetchAnalyticsSupabase();
            return data;
        } catch (error) {
            console.error("Supabase analytics fetch failed, falling back to local API.", error);
        }
    }
    console.log("Fetching analytics from fallback API...");
    return fallbackApi.fetchAnalyticsFallback();
};

/**
 * Fetches insights data. This always uses the local fallback API.
 * @param {string} defectDescription - The description to get insights for.
 * @returns {Promise<any>}
 */
export const getInsights = async (defects) => {
    console.log("Fetching insights from fallback API...");
    return fallbackApi.fetchInsightsFallback(defects);
}; 