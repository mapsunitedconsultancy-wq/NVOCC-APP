import { createClient } from '@supabase/supabase-js';

// Environment variables configured in .env or deployment host
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Supabase client instance
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

/**
 * Health check helper to test database connectivity
 */
export async function testSupabaseConnection(): Promise<{ ok: boolean; message: string; data?: any }> {
  if (!supabase) {
    return {
      ok: false,
      message: 'Supabase URL and Anon Key are not yet defined in .env (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)',
    };
  }

  try {
    const { data, error } = await supabase.from('ports').select('locode, name').limit(3);
    if (error) {
      return { ok: false, message: error.message };
    }
    return { ok: true, message: 'Connected to Supabase PostgreSQL successfully', data };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Unknown network error' };
  }
}
