import { createClient } from '@supabase/supabase-js';

// IMPORTANT: Create a .env file in the frontend/ directory and add your Supabase credentials
// VITE_SUPABASE_URL=YOUR_SUPABASE_URL
// VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and anon key are required. Please check your .env file.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 