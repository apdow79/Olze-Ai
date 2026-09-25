'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Shell from '@/components/Shell';
import { getSupabaseBrowser, olzeApi } from '@/lib/supabase/client';

type FileRow = { id: string; path: string; content: string; updated_at: string };
type Ev = { type: string; message?: string; toolCall?: { name: string; args: Record<string, unknown> }; resultSummary?: string; risk?: string };

/** Tree builder for the explorer */
function treeOf(paths: string[]) {
  const root: Record<string, any> = {};
  for (const p of paths) {
    const parts = p.split('/'); let node = root;
    parts.forEach((part, i) => {
      node[part] ??= { children: {}, file: i === parts.length - 1 };
      node = node[part].children;
    });
  }
  return root;
}
function TreeNode({ name, node, depth, onPick }: any) {
  const kids = Object.entries(node.children ?? {});
  return (
    <div>
      <button onClick={() => !node.file ? null : onPick(name)} style={{ paddingLeft: depth * 12 }}
        className={`block w-full truncate rounded px-2 py-0.5 text-left font-mono text-xs ${node.file ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-500'}`}>
        {node.file ? '📄' : '📁'} {name}
      </button>
      {!node.file && kids.map(([k, v]: [string, any]) => <TreeNode key={k} name={k} node={v} depth={depth + 1} onPick={onPick} />)}
    </div>
  );
}

export default function ProjectWorkspace() {
  const { id } = useParams<{ id: string }>();
  const supabase = getSupabaseBrowser();
  const token = useCallback(async () => (await supabase.auth.getSession()).data.session?.access_token ?? '', []); // eslint-disable-line react-hooks/exhaustive-deps

  const [project, setProject] = useState<any>(null);
  const [files, setFiles] = useState<FileRow[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [events, setEvents] = useState<Ev[]>([]);
  const [running, setRunning] = useState(false);
  const [goal, setGoal] = useState('');
  const [pending, setPending] = useState<Ev | null>(null);
  const [saveMsg, setSaveMsg] = useState('');

  const load = useCallback(async () => {
    const t = await token(); if (!t) return;
    try {
      const r = await olzeApi<{ project: any; files: FileRow[] }>(`/api/projects/${id}`, { accessToken: t });
      setProject(r.project); setFiles(r.files);
      if (r.files[0]) setSelected(r.files[0].path);
    } catch (e: any) { setEvents(prev => [...prev, { type: 'error', message: e.message }]); }
  }, [id, token]);
  useEffect(() => { load(); }, [load]);

  const tree = useMemo(() => treeOf(files.map(f => f.path)), [files]);
  const current = files.find(f => f.path === selected);

  async function saveFile(content: string) {
    if (!current) return;
    setSaveMsg('saving…');
    const t = await token();
    try {
      await olzeApi(`/api/projects/${id}/files`, { method: 'PUT', accessToken: t, body: JSON.stringify({ path: current.path, content }) });
      setFiles(fs => fs.map(f => f.path === current.path ? { ...f, content } : f));
      setSaveMsg('saved ✓');
    } catch { setSaveMsg('save failed ✗'); }
  }

  async function runAgent(userGoal?: string) {
    const g = userGoal ?? goal.trim(); if (!g || running) return;
    setRunning(true); setGoal(''); setEvents(e => [...e, { type: 'message', message: `▶ ${g}` }]);
    const t = await token();
    try {
      const res = await olzeApi<{ events: Ev[]; files: FileRow[] }>(`/api/agent/run`, {
        method: 'POST', accessToken: t, body: JSON.stringify({ projectId: id, goal: g }),
      });
      setEvents(e => [...e, ...res.events]);
      setFiles(res.files);
    } catch (e: any) {
      setEvents(ev => [...ev, { type: 'error', message: e.message }]);
    } finally { setRunning(false); }
  }

  return (
    <Shell>
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">{project?.name ?? 'Loading…'}</h1>
          <span className="text-xs text-slate-500">{saveMsg}</span>
        </div>
        <div className="grid gap-4 lg:grid-cols-[220px_1fr_340px]">
          {/* Explorer */}
          <aside className="card !p-3">
            <div className="mb-2 text-xs font-semibold uppercase text-slate-500">Files</div>
            {Object.entries(tree).map(([k, v]: [string, any]) => <TreeNode key={k} name={k} node={v} depth={0} onPick={setSelected} />)}
            {!files.length && <p className="p-2 text-xs text-slate-600">No files yet — ask the AI to build something.</p>}
          </aside>

          {/* Editor */}
          <section className="flex min-h-[420px] flex-col rounded-2xl border border-slate-800 bg-slate-950">
            <div className="border-b border-slate-800 px-4 py-2 font-mono text-xs text-brand-400">{selected ?? '(no file selected)'}</div>
            {current ? (
              <textarea defaultValue={current.content} onBlur={e => saveFile(e.target.value)} spellCheck={false}
                className="min-h-[380px] flex-1 resize-none bg-transparent p-4 font-mono text-xs leading-5 text-slate-200 outline-none" />
            ) : <div className="flex flex-1 items-center justify-center text-sm text-slate-600">Select a file · or generate one with the agent →</div>}
            {/* Terminal / build output */}
            <div className="max-h-48 overflow-y-auto border-t border-slate-800 bg-black/40 p-3 font-mono text-[11px] text-slate-400">
              {events.map((e, i) => (
                <div key={i} className={e.type === 'error' ? 'text-red-400' : e.type === 'tool_result' ? 'text-emerald-400' : ''}>
                  {e.type === 'tool_call' ? `$ ${e.toolCall?.name} ${JSON.stringify(e.toolCall?.args).slice(0, 90)}` : e.message ?? e.resultSummary}
                </div>
              ))}
              {!events.length && <div className="text-slate-700">olze@sandbox:~$ agent activity will stream here…</div>}
            </div>
          </section>

          {/* AI panel */}
          <aside className="card flex flex-col !p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-white">🤖 Olze Agent</h2>
              {running && <span className="animate-pulse text-xs text-brand-400">working…</span>}
            </div>
            {pending && (
              <div className="mb-3 rounded-lg border border-amber-700 bg-amber-950/40 p-3 text-xs text-amber-200">
                ⚠️ Confirm dangerous action: <b>{pending.toolCall?.name}</b> {JSON.stringify(pending.toolCall?.args).slice(0, 80)}
                <div className="mt-2 flex gap-2">
                  <button onClick={() => { setPending(null); /* API auto-confirms within session when approved */ runAgent(); }} className="rounded bg-amber-600 px-2 py-1 text-white">Approve & retry</button>
                  <button onClick={() => setPending(null)} className="rounded border border-amber-700 px-2 py-1">Cancel</button>
                </div>
              </div>
            )}
            <textarea value={goal} onChange={e => setGoal(e.target.value)} rows={3} placeholder="e.g. Add authentication to my app."
              className="input resize-none text-sm" onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) runAgent(); }} />
            <button onClick={() => runAgent()} disabled={running || !goal.trim()} className="btn-primary mt-3 !py-2 text-sm">{running ? 'Building…' : 'Run agent ⏎⌘'}</button>
            <p className="mt-2 text-[11px] text-slate-600">Read/write are automatic. Delete/deploy require your confirmation. Preview: full sandbox runtime lands in v0.2 (documented blocker).</p>
          </aside>
        </div>
      </div>
    </Shell>
  );
}
