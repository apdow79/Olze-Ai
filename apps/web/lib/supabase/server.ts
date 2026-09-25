import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/** Server-side Supabase client using the ANON key + forwarded cookies.
 *  RLS still applies — we never use the service-role key in the web app. */
export function createServerClient(cookies: Record<string, string | undefined>): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY');
  const cookieHeader = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ');
  return createClient(url, anon, {
    global: { headers: { cookie: cookieHeader } },
    auth: { persistSession: false },
  });
}
