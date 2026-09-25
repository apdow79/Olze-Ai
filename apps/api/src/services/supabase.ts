import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/** Server-side Supabase client bound to the END USER's JWT — RLS enforced everywhere. */
export function userClient(url: string, anonKey: string, accessToken: string): SupabaseClient {
  return createClient(url, anonKey, { global: { headers: { authorization: `Bearer ${accessToken}` } }, auth: { persistSession: false, autoRefreshToken: false } });
}
