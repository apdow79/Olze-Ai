'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseBrowser, olzeApi } from '@/lib/supabase/client';

export default function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const supabase = getSupabaseBrowser();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { display_name: name } } });
        if (error) throw error;
        // Real DB write via RLS — creates workspace + owner membership.
        await olzeApi('/api/workspaces/bootstrap', { method: 'POST', accessToken: (await supabase.auth.getSession()).data.session?.access_token });
        router.push('/dashboard');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/dashboard');
      }
    } catch (err: any) {
      setMsg(err.message ?? 'Something went wrong.');
    } finally { setBusy(false); }
  }

  async function github() {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'github', options: { redirectTo: window.location.origin + '/dashboard' } });
    if (error) { setMsg(error.message); setBusy(false); }
  }
  async function google() {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/dashboard' } });
    if (error) { setMsg(error.message); setBusy(false); }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <Link href="/" className="mb-8 flex items-center gap-2 font-bold text-white"><img src="/olze-icon.svg" className="h-7 w-7" alt="" /> Olze</Link>
      <h1 className="text-2xl font-bold text-white">{mode === 'signup' ? 'Create your free account' : 'Welcome back'}</h1>
      <p className="mt-2 text-sm text-slate-400">{mode === 'signup' ? 'No credit card. No Ollama. Fair-use free tier.' : 'Sign in to keep building.'}</p>

      <form onSubmit={submit} className="mt-8 space-y-4">
        {mode === 'signup' && <input className="input" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} required />}
        <input className="input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
        <input className="input" type="password" placeholder="Password (min 8 chars)" value={password} onChange={e => setPassword(e.target.value)} minLength={8} required />
        {msg && <p className="rounded-lg border border-red-900 bg-red-950/50 p-3 text-sm text-red-300">{msg}</p>}
        <button disabled={busy} className="btn-primary w-full">{busy ? 'Working…' : mode === 'signup' ? 'Start Building Free →' : 'Sign in →'}</button>
      </form>

      <div className="my-6 flex items-center gap-4 text-xs text-slate-600"><div className="h-px flex-1 bg-slate-800" />or<div className="h-px flex-1 bg-slate-800" /></div>
      <div className="space-y-3">
        <button onClick={github} disabled={busy} className="btn-ghost w-full">Continue with GitHub</button>
        <button onClick={google} disabled={busy} className="btn-ghost w-full">Continue with Google</button>
      </div>
      <p className="mt-8 text-center text-sm text-slate-500">
        {mode === 'signup' ? <>Already have an account? <Link className="text-brand-400" href="/login">Sign in</Link></> : <>New here? <Link className="text-brand-400" href="/signup">Create an account</Link></>}
      </p>
    </div>
  );
}
