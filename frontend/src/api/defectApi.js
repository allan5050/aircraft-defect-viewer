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
  const response = await fetch(`${API_BASE_URL}/analytics`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch analytics');
  }
  
  return response.json();
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
