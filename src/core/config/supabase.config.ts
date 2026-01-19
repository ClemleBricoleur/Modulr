import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { API_CONFIG } from './api.config';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Only validate if Supabase is enabled
if (API_CONFIG.USE_SUPABASE && (!supabaseUrl || !supabaseAnonKey)) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Create Supabase client (use empty strings as fallback when disabled to avoid null errors)
export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);
