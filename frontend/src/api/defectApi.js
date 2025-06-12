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
  // Try Supabase first for analytics using SQL aggregation (efficient, no row limits)
  if (supabase) {
    try {
      // Calculate analytics using SQL aggregation queries
      const analytics = await calculateAnalyticsFromSupabase();
      if (analytics) {
        console.log('Successfully calculated analytics from Supabase using SQL aggregation');
        return analytics;
      }
    } catch (supabaseError) {
      console.warn("Supabase failed, falling back to FastAPI:", supabaseError);
    }
  }

  // Fallback to FastAPI backend (with limited SQLite data)
  const response = await fetch(`${API_BASE_URL}/analytics`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch analytics');
  }
  
  return response.json();
}

async function calculateAnalyticsFromSupabase() {
  // Use pagination to get all data in chunks of 1000
  let allData = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  // Fetch all data in pages
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
      console.log(`Fetched page ${page}, total records so far: ${allData.length}`);
    } else {
      hasMore = false;
    }
  }

  console.log(`Fetched all ${allData.length} records from Supabase in ${page} pages`);

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

  return {
    severity_distribution: severityDist,
    top_aircraft: topAircraft,
    total_defects: allData.length,
    high_severity_count: severityDist['High'] || 0,
    recent_defects_7d: recentDefects
  };
}

function calculateAnalytics(defects) {
  // Calculate severity distribution
  const severityDist = defects.reduce((acc, defect) => {
    acc[defect.severity] = (acc[defect.severity] || 0) + 1;
    return acc;
  }, {});

  // Calculate top aircraft
  const aircraftCounts = defects.reduce((acc, defect) => {
    acc[defect.aircraft_registration] = (acc[defect.aircraft_registration] || 0) + 1;
    return acc;
  }, {});
  
  const topAircraft = Object.entries(aircraftCounts)
    .map(([aircraft, count]) => ({ aircraft, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Calculate recent defects (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const recentDefects = defects.filter(defect => {
    const defectDate = new Date(defect.reported_at);
    return defectDate >= sevenDaysAgo;
  }).length;

  return {
    severity_distribution: severityDist,
    top_aircraft: topAircraft,
    total_defects: defects.length,
    high_severity_count: severityDist['High'] || 0,
    recent_defects_7d: recentDefects
  };
}

export async function fetchAircraftList() {
  // Try Supabase first, fallback to FastAPI
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('distinct_aircraft')
        .select('aircraft_registration')
        .order('aircraft_registration', { ascending: true });

      if (!error) {
        return {
          aircraft: data.map(item => item.aircraft_registration)
        };
      }
      console.warn("Supabase error, falling back to FastAPI:", error);
    } catch (supabaseError) {
      console.warn("Supabase failed, falling back to FastAPI:", supabaseError);
    }
  }

  // Fallback to FastAPI backend
  const response = await fetch(`${API_BASE_URL}/aircraft`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch aircraft list');
  }
  
  return response.json();
}

export async function fetchInsights(defects) {
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
