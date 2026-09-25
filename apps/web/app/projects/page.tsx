'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Shell from '@/components/Shell';
import { getSupabaseBrowser, olzeApi } from '@/lib/supabase/client';

type P = { id: string; name: string; slug: string; template: string; status: string; updated_at: string };

export default function Projects() {
  const [rows, setRows] = useState<P[]>([]);
  const supabase = getSupabaseBrowser();
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return;
      try {
        const ws = await olzeApi<{ workspaces: { id: string }[] }>('/api/workspaces', { accessToken: data.session.access_token });
        const all = await Promise.all(ws.workspaces.map(w =>
          olzeApi<{ projects: P[] }>(`/api/projects?workspaceId=${w.id}`, { accessToken: data.session!.access_token }).then(r => r.projects)));
        setRows(all.flat());
      } catch { /* API offline */ }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Shell>
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-bold text-white">Projects</h1>
        <div className="mt-6 space-y-3">
          {rows.map(p => (
            <Link key={p.id} href={`/projects/${p.id}`} className="card flex items-center justify-between hover:border-brand-600">
              <div><div className="font-semibold text-white">{p.name}</div><div className="text-xs text-slate-500">{p.slug} · {p.template}</div></div>
              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs capitalize text-slate-300">{p.status}</span>
            </Link>
          ))}
          {!rows.length && <p className="text-slate-500">No projects yet — create one from the dashboard.</p>}
        </div>
      </div>
    </Shell>
  );
}
