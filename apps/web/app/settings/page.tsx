'use client';
import Shell from '@/components/Shell';
import { useEffect, useState } from 'react';
import { getSupabaseBrowser, olzeApi } from '@/lib/supabase/client';

export default function Settings() {
  const [quota, setQuota] = useState<any>(null);
  const supabase = getSupabaseBrowser();
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return;
      try { setQuota(await olzeApi('/api/ai/quota', { accessToken: data.session.access_token })); } catch {}
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Shell>
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <div className="card">
          <h2 className="font-semibold text-white">AI usage (free tier)</h2>
          <p className="mt-2 text-sm text-slate-400">
            {quota ? `${quota.requestsUsed ?? 0} / ${quota.requestsLimit} requests this month.` : 'Start the Olze API to see live quota.'}
            {' '}Free means fair-use — add your own provider keys below for unlimited use.
          </p>
        </div>
        <div className="card">
          <h2 className="font-semibold text-white">Bring your own keys (optional)</h2>
          <p className="mt-2 text-sm text-slate-400">OpenAI · Anthropic · Gemini · OpenRouter · Groq · Ollama. Keys are stored encrypted server-side and never sent to the browser.</p>
          <p className="mt-3 text-xs text-amber-400">⚠ v0.1: BYO-key vault UI lands next iteration — env-based server keys already work.</p>
        </div>
        <div className="card">
          <h2 className="font-semibold text-white">Integrations</h2>
          <p className="mt-2 text-sm text-slate-400">GitHub, Supabase, Vercel connections appear here once configured (see apps/api + .env.example).</p>
        </div>
      </div>
    </Shell>
  );
}
