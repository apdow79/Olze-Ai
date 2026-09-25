'use client';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let browserClient: SupabaseClient | null = null;

/** Browser Supabase client (anon key only — safe to expose). */
export function getSupabaseBrowser(): SupabaseClient {
  if (!browserClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. Copy .env.example → apps/web/.env.local');
    }
    browserClient = createClient(url, anon, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
  }
  return browserClient;
}

/** Olze API helper that attaches the user's Supabase JWT.
 *  The browser NEVER talks to AI providers directly — only to the Olze API. */
export async function olzeApi<T>(path: string, init: RequestInit & { accessToken?: string } = {}): Promise<T> {
  const base = process.env.NEXT_PUBLIC_OLZE_API ?? 'http://localhost:8787';
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init.accessToken ? { authorization: `Bearer ${init.accessToken}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'request_failed' }));
    throw Object.assign(new Error(body.error ?? `HTTP ${res.status}`), { status: res.status, body });
  }
  return res.json() as Promise<T>;
}
