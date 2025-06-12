// api/defectApi.js
const API_BASE_URL = 'http://localhost:8000/api';

// Try to import Supabase, but handle the case where it's not configured
let supabase = null;
try {
  const supabaseModule = await import('../supabaseClient');
  supabase = supabaseModule.supabase;
} catch (error) {
  console.warn('Supabase not configured, falling back to FastAPI backend');
}

export async function fetchDefects(params = {}) {
  const { 
    aircraft_registration, 
    severity, 
    page = 1, 
    page_size = 50 
  } = params;

  // Try Supabase first, fallback to FastAPI
  if (supabase) {
    try {
      const offset = (page - 1) * page_size;

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

      const { data, error, count } = await query;

      if (!error) {
        return {
          data,
          total: count,
          page,
          page_size,
          has_more: (offset + page_size) < count,
        };
      }
      console.warn("Supabase error, falling back to FastAPI:", error);
    } catch (supabaseError) {
      console.warn("Supabase failed, falling back to FastAPI:", supabaseError);
    }
  }

  // Fallback to FastAPI backend
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
    throw new Error('Failed to fetch defects');
  }
  
  return response.json();
}

export async function fetchAnalytics() {
  // Try Supabase first with working analytics logic, fallback to FastAPI
  if (supabase) {
    try {
      // Use the working chunked approach for analytics
      return await calculateAnalyticsFromSupabase();
    } catch (supabaseError) {
      console.warn("Supabase analytics failed, falling back to FastAPI:", supabaseError);
    }
  }

  // Fallback to FastAPI backend (already optimized with database-level calculations)
  const response = await fetch(`${API_BASE_URL}/analytics`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch analytics');
  }
  
  return response.json();
}

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

  // Calculate top aircraft
  const aircraftCountsMap = allData.reduce((acc, row) => {
    acc[row.aircraft_registration] = (acc[row.aircraft_registration] || 0) + 1;
    return acc;
  }, {});

  const topAircraft = Object.entries(aircraftCountsMap)
    .map(([aircraft, count]) => ({ aircraft, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

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
    recentDefects
  });

  return {
    severity_distribution: severityDist,
    top_aircraft: topAircraft,
    total_defects: allData.length,
    high_severity_count: severityDist['High'] || 0,
    recent_defects_7d: recentDefects
  };
}

export async function fetchInsights(defects) {
  // This endpoint processes the current page of defects to generate insights
  const response = await fetch(`${API_BASE_URL}/insights`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ defects }),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch insights');
  }

  return response.json();
}

export async function searchAircraft(searchTerm) {
  if (!searchTerm || searchTerm.length < 2) {
    return { aircraft: [] };
  }

  // Try Supabase first for server-side search
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('defects')
        .select('aircraft_registration')
        .ilike('aircraft_registration', `%${searchTerm}%`)
        .limit(50); // Limit results for performance

      if (!error) {
        // Get unique aircraft registrations
        const uniqueAircraft = [...new Set(data.map(item => item.aircraft_registration))];
        return { aircraft: uniqueAircraft.sort() };
      }
      console.warn("Supabase search error, falling back to FastAPI:", error);
    } catch (supabaseError) {
      console.warn("Supabase search failed, falling back to FastAPI:", supabaseError);
    }
  }

  // Fallback to FastAPI backend
  const response = await fetch(`${API_BASE_URL}/aircraft/search?q=${encodeURIComponent(searchTerm)}`);
  
  if (!response.ok) {
    return { aircraft: [] }; // Return empty on error rather than throwing
  }
  
  return response.json();
}

// Keep the old function for backward compatibility, but limit it
export async function fetchAircraftList() {
  // For initial load, just return a few recent aircraft or empty array
  // This encourages users to search rather than loading all data
  return { aircraft: [] };
}
