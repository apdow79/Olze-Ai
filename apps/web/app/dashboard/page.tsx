'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Shell from '@/components/Shell';
import NewProjectModal from '@/components/NewProjectModal';
import { getSupabaseBrowser, olzeApi } from '@/lib/supabase/client';

type P = { id: string; name: string; slug: string; template: string; updated_at: string };

export default function Dashboard() {
  const [projects, setProjects] = useState<P[]>([]);
  const [modal, setModal] = useState(false);
  const supabase = getSupabaseBrowser();

  async function load() {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return;
    try {
      const res = await olzeApi<{ workspaces: { id: string }[] }>('/api/workspaces', { accessToken: data.session.access_token });
      if (res.workspaces[0]) {
        const r = await olzeApi<{ projects: P[] }>(`/api/projects?workspaceId=${res.workspaces[0].id}`, { accessToken: data.session.access_token });
        setProjects(r.projects);
      }
    } catch { /* API not running yet — dashboard still usable */ }
  }
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Shell>
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-bold text-white">Good afternoon 👋</h1>
        <p className="mt-1 text-slate-400">What are we building today?</p>
        <button onClick={() => setModal(true)} className="btn-primary mt-6">+ New Project</button>

        <h2 className="mt-12 text-sm font-semibold uppercase tracking-wider text-slate-500">Recent Projects</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map(p => (
            <Link key={p.id} href={`/projects/${p.id}`} className="card transition hover:border-brand-600">
              <div className="text-xs uppercase text-brand-400">{p.template}</div>
              <div className="mt-2 font-semibold text-white">{p.name}</div>
              <div className="mt-1 text-xs text-slate-500">updated {new Date(p.updated_at).toLocaleDateString()}</div>
            </Link>
          ))}
          {!projects.length && (
            <button onClick={() => setModal(true)} className="card border-dashed text-left text-slate-500 hover:border-brand-600 hover:text-slate-300">
              <div className="text-2xl">＋</div>
              <div className="mt-2 font-medium">Create your first project with AI</div>
              <div className="mt-1 text-xs">Describe an idea — the agent builds it.</div>
            </button>
          )}
        </div>
      </div>
      {modal && <NewProjectModal onClose={() => setModal(false)} onCreated={() => { setModal(false); load(); }} />}
    </Shell>
  );
}
