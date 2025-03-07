import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// Initialize the Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR .ENV HERE';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR ENV HERE';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials. Please connect to Supabase first.');
}

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey
);
