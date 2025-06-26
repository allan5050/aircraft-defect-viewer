import { createClient } from '@supabase/supabase-js';

// IMPORTANT: Create a .env file in the frontend/ directory and add your Supabase credentials
// VITE_SUPABASE_URL=YOUR_SUPABASE_URL
// VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("Initializing Supabase client with URL:", supabaseUrl);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase configuration error:", {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    url: supabaseUrl || 'missing',
  });
  throw new Error("Supabase URL and anon key are required. Please check your .env file.");
}

let supabase;
try {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log("Supabase client initialized successfully");
} catch (error) {
  console.error("Failed to initialize Supabase client:", error);
  supabase = null;
}

export { supabase }; 