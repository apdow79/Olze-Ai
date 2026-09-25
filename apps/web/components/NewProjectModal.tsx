'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser, olzeApi } from '@/lib/supabase/client';

const examples = ['SaaS dashboard', 'E-commerce store', 'Portfolio site', 'AI application'];

export default function NewProjectModal({ onClose, onCreated }: { onClose(): void; onCreated(): void }) {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const supabase = getSupabaseBrowser();

  async function create() {
    if (!prompt.trim()) return;
    setBusy(true); setErr(null);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error('Not signed in.');
      const ws = await olzeApi<{ workspaces: { id: string }[] }>('/api/workspaces', { accessToken: token });
      const workspaceId = ws.workspaces[0]?.id
        ?? (await olzeApi<{ workspace: { id: string } }>('/api/workspaces/bootstrap', { method: 'POST', accessToken: token })).workspace.id;
      // Browser → Olze API → AI Gateway → Agent. Never provider-direct.
      const res = await olzeApi<{ project: { id: string } }>('/api/projects', {
        method: 'POST', accessToken: token,
        body: JSON.stringify({ workspaceId, prompt: prompt.trim(), withAgent: true }),
      });
      router.push(`/projects/${res.project.id}`);
    } catch (e: any) {
      setErr(e.message === 'Failed to fetch' ? 'Olze API is not running. Start it: npm run dev:api' : e.message);
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="card w-full max-w-xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-white">What do you want to build?</h2>
        <textarea autoFocus value={prompt} onChange={e => setPrompt(e.target.value)} rows={4}
          className="input mt-4 resize-none" placeholder="Describe your project… e.g. Build a modern restaurant website with online booking." />
        <div className="mt-3 flex flex-wrap gap-2">
          {examples.map(x => <button key={x} onClick={() => setPrompt(`Build me a ${x.toLowerCase()}.`)} className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400 hover:border-brand-500 hover:text-white">{x}</button>)}
        </div>
        {err && <p className="mt-4 rounded-lg border border-red-900 bg-red-950/50 p-3 text-sm text-red-300">{err}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="btn-ghost !px-4 !py-2 text-sm">Cancel</button>
          <button onClick={create} disabled={busy || !prompt.trim()} className="btn-primary !px-5 !py-2 text-sm">{busy ? 'Building… ✨' : 'Create with AI →'}</button>
        </div>
        <p className="mt-3 text-xs text-slate-600">Uses your free-tier AI quota · No Ollama required.</p>
      </div>
    </div>
  );
}
