import { supabase } from '../supabaseClient';
import { PAGINATION_DEFAULTS } from '../config';

/**
 * =============================================================================
 * Supabase API Service
 * =============================================================================
 *
 * This module contains functions for interacting with the Supabase backend.
 * It is the primary data source for the application.
 *
 */

/**
 * Checks if the Supabase client is configured and available.
 * @returns {boolean} True if Supabase is available, false otherwise.
 */
export function isSupabaseAvailable() {
  const isAvailable = supabase !== null;
  console.log("Supabase availability check:", {
    isAvailable,
    hasClient: !!supabase,
  });
  return isAvailable;
}

/**
 * Fetches a paginated list of defects from Supabase.
 *
 * @param {object} params - The query parameters.
 * @param {number} [params.page=1] - The page number to fetch.
 * @param {number} [params.page_size=50] - The number of items per page.
 * @param {string} [params.aircraft_registration] - Optional aircraft registration to filter by.
 * @param {string} [params.severity] - Optional severity to filter by.
 * @returns {Promise<object>} A promise that resolves to the paginated defect data.
 * @throws {Error} If the Supabase query fails.
 */
export async function fetchDefectsSupabase(params = {}) {
  console.log("Attempting Supabase query with params:", params);

  const { 
    page = PAGINATION_DEFAULTS.PAGE, 
    page_size = PAGINATION_DEFAULTS.PAGE_SIZE,
    aircraft_registration, 
    severity,
  } = params;

  const offset = (page - 1) * page_size;

  try {
    let query = supabase
      .from('defects')
      .select('*', { count: 'exact' })
      .order('reported_at', { ascending: false })
      .range(offset, offset + page_size - 1);

    if (aircraft_registration) {
      query = query.eq('aircraft_registration', aircraft_registration);
    }
    if (severity) {
      query = query.eq('severity', severity);
    }

    console.log("Executing Supabase query...");
    const { data, error, count } = await query;

    if (error) {
      console.error("Supabase query error:", {
        error,
        errorMessage: error.message,
        errorDetails: error.details,
        hint: error.hint,
        code: error.code
      });
      throw error;
    }

    console.log("Supabase query successful:", {
      recordCount: data?.length || 0,
      totalCount: count,
      hasMore: (offset + page_size) < count
    });

    return {
      data,
      total: count,
      page,
      page_size,
      has_more: (offset + page_size) < count,
    };
  } catch (error) {
    console.error("Supabase query failed:", {
      error,
      errorMessage: error.message,
      params,
      offset,
      page_size
    });
    throw error;
  }
}

/**
 * Searches for aircraft registrations in Supabase.
 *
 * @param {string} searchTerm - The search term for the aircraft registration.
 * @returns {Promise<object>} A promise that resolves to a list of matching aircraft.
 * @throws {Error} If the Supabase query fails.
 */
export async function searchAircraftSupabase(searchTerm) {
  console.log("Attempting Supabase aircraft search:", searchTerm);

  try {
    const { data, error } = await supabase
      .from('defects')
      .select('aircraft_registration')
      .ilike('aircraft_registration', `%${searchTerm}%`)
      .limit(100);

    if (error) {
      console.error("Supabase aircraft search error:", {
        error,
        errorMessage: error.message,
        searchTerm
      });
      throw error;
    }

    const uniqueAircraft = [...new Set(data.map(item => item.aircraft_registration))];
    console.log("Supabase aircraft search successful:", {
      resultsFound: uniqueAircraft.length,
      searchTerm
    });

    return { aircraft: uniqueAircraft.sort().slice(0, 50) };
  } catch (error) {
    console.error("Supabase aircraft search failed:", {
      error,
      errorMessage: error.message,
      searchTerm
    });
    throw error;
  }
}

/**
 * Fetches analytics data from Supabase using client-side calculation.
 * This approach fetches data in chunks and calculates analytics on the client.
 * @returns {Promise<object>} Analytics data including counts and summaries.
 */
export async function fetchAnalyticsSupabase() {
  console.log("Attempting to fetch analytics from Supabase via client-side calculation...");

  try {
    // Use client-side calculation approach similar to the original working code
    return await calculateAnalyticsFromSupabase();
  } catch (error) {
    console.error("Supabase analytics calculation failed:", {
      error,
      message: error.message,
      details: error.details
    });
    throw error;
  }
}

/**
 * Calculate analytics by fetching all data from Supabase in efficient chunks.
 * This ensures we get analytics for all 10k+ records, not just a subset.
 */
async function calculateAnalyticsFromSupabase() {
  // Use pagination to get all data in efficient chunks
  let allData = [];
  let page = 0;
  const pageSize = 1000; // Good balance between efficiency and memory usage
  let hasMore = true;

  console.log('Starting analytics calculation from Supabase...');

  // Fetch all data in pages - this ensures we get complete analytics
  while (hasMore) {
    const { data, error } = await supabase
      .from('defects')
      .select('aircraft_registration, severity, reported_at')
      .range(page * pageSize, (page + 1) * pageSize - 1)
      .order('reported_at', { ascending: false });

    if (error) throw error;
    
    if (data && data.length > 0) {
      allData.push(...data);
      hasMore = data.length === pageSize; // Continue if we got a full page
      page++;
      if (page % 5 === 0) { // Log progress every 5 pages (5000 records)
        console.log(`Fetched page ${page}, total records so far: ${allData.length}`);
      }
    } else {
      hasMore = false;
    }
  }

  console.log(`Analytics: Fetched all ${allData.length} records from Supabase in ${page} pages`);

  // Calculate severity distribution
  const severityDist = allData.reduce((acc, row) => {
    acc[row.severity] = (acc[row.severity] || 0) + 1;
    return acc;
  }, {});

  // Calculate top aircraft and total unique aircraft count
  const aircraftCountsMap = allData.reduce((acc, row) => {
    acc[row.aircraft_registration] = (acc[row.aircraft_registration] || 0) + 1;
    return acc;
  }, {});

  const topAircraft = Object.entries(aircraftCountsMap)
    .map(([aircraft, count]) => ({ aircraft, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Count of unique aircraft with defects
  const totalUniqueAircraft = Object.keys(aircraftCountsMap).length;

  // Calculate recent defects (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const recentDefects = allData.filter(row => {
    const defectDate = new Date(row.reported_at);
    return defectDate >= sevenDaysAgo;
  }).length;

  console.log('Analytics calculated:', {
    total: allData.length,
    severityDist,
    topAircraftCount: topAircraft.length,
    totalUniqueAircraft,
    recentDefects
  });

  return {
    severity_distribution: severityDist,
    top_aircraft: topAircraft,
    total_defects: allData.length,
    high_severity_count: severityDist['High'] || 0,
    recent_defects_7d: recentDefects,
    total_unique_aircraft: totalUniqueAircraft
  };
} 