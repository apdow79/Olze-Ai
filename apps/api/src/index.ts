/**
 * Olze API — real v0.1 implementation.
 * Browser → THIS API → AI Gateway → Provider. Provider keys never leave the server.
 * Every DB access uses a client bound to the caller's JWT ⇒ RLS + workspace isolation enforced.
 */
import express, { type Request, type Response, type NextFunction } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import { OlzeAiGateway, QuotaExceededError } from '@olze/ai-gateway';
import { CodingAgent, defaultTools, type ModelClient, type SandboxFs } from '@olze/agent-core';
import type { AgentEvent, ChatMessage } from '@olze/shared-types';
import { userClient } from './services/supabase.js';
import { makeUsageSink } from './services/gateway.js';
import { DbSandbox } from './services/sandbox.js';

export interface Env {
  SUPABASE_URL?: string; SUPABASE_ANON_KEY?: string; SUPABASE_SERVICE_ROLE_KEY?: string;
  OPENROUTER_API_KEY?: string; GROQ_API_KEY?: string; GEMINI_API_KEY?: string;
  OPENAI_API_KEY?: string; ANTHROPIC_API_KEY?: string; OLLAMA_BASE_URL?: string;
  OLZE_FREE_CHAIN?: string; OLZE_FREE_REQUESTS_PER_MONTH?: string;
  API_PORT?: string; WEB_ORIGIN?: string; SECRETS_ENCRYPTION_KEY?: string;
  GITHUB_CLIENT_ID?: string; GITHUB_CLIENT_SECRET?: string; VERCEL_API_TOKEN?: string;
}
interface AuthUser { id: string; email: string; accessToken: string; db: SupabaseClient }
declare global { namespace Express { interface Request { olze?: AuthUser } } }

function slugify(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 48) || 'project'; }

/** Real Supabase JWT verification (no fake auth). */
function requireAuth(env: Env) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
    if (!token) return res.status(401).json({ error: 'unauthenticated' });
    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) return res.status(503).json({ error: 'server misconfigured: set SUPABASE_URL and SUPABASE_ANON_KEY' });
    try {
      const probe = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, { auth: { persistSession: false } });
      const { data, error } = await probe.auth.getUser(token);
      if (error || !data.user) return res.status(401).json({ error: 'invalid_token' });
      req.olze = { id: data.user.id, email: data.user.email ?? '', accessToken: token, db: userClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, token) };
      next();
    } catch { return res.status(401).json({ error: 'invalid_token' }); }
  };
}

/** Gateway-backed ModelClient for agent-core (tool-calling via JSON protocol fallback that works on any model). */
function makeModelClient(gateway: OlzeAiGateway, workspaceId: string): ModelClient {
  return {
    async chatWithTools(messages, tools) {
      const toolSpecs = tools.map(t => ({ name: t.name, description: t.description, parameters: t.parameters }));
      const sys = `You are Olze, an autonomous coding agent.\n\nYou may call tools by replying with ONLY a JSON object of shape {"thought":"...","tool_calls":[{"name":"...","args":{...}}]} or {"thought":"...","final":"..."}.\nAvailable tools:\n${JSON.stringify(toolSpecs)}`;
      const msgs: ChatMessage[] = [{ role: 'system', content: sys }, ...messages.slice(1)];
      let text = '';
      for await (const d of gateway.chat({ workspaceId, messages: msgs, kind: 'agent' })) text += d.content ?? '';
      const m = text.match(/\{[\s\S]*\}/);
      try {
        const parsed = JSON.parse(m ? m[0] : text);
        if (Array.isArray(parsed.tool_calls) && parsed.tool_calls.length) {
          return {
            message: { role: 'assistant', content: parsed.thought ?? '' },
            toolCalls: parsed.tool_calls.map((tc: any, i: number) => ({ id: `call_${Date.now()}_${i}`, name: tc.name, args: tc.args ?? {} })),
          };
        }
        return { message: { role: 'assistant', content: parsed.final ?? text }, toolCalls: [] };
      } catch {
        return { message: { role: 'assistant', content: text }, toolCalls: [] };
      }
    },
  };
}

export function createApp(env: Env) {
  const app = express();
  app.use(express.json({ limit: '2mb' }));
  app.use((req, res, next) => {
    res.setHeader('access-control-allow-origin', env.WEB_ORIGIN ?? 'http://localhost:3000');
    res.setHeader('access-control-allow-headers', 'authorization,content-type');
    res.setHeader('access-control-allow-methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });

  const auth = requireAuth(env);
  const freeLimit = Number(env.OLZE_FREE_REQUESTS_PER_MONTH ?? 100);
  let currentDb: () => SupabaseClient | null = () => null;
  const gateway = new OlzeAiGateway(env as any, makeUsageSink(() => currentDb(), freeLimit));

  app.get('/health', (_req, res) => res.json({ ok: true, service: 'olze-api', version: '0.1.0',
    providersConfigured: ['GROQ','OPENROUTER','GEMINI','OPENAI','ANTHROPIC'].filter(p => env[`${p}_API_KEY` as keyof Env]) }));

  // ── Workspaces (RLS-scoped) ─────────────────────────────────────────
  app.get('/api/workspaces', auth, async (req, res) => {
    const { data, error } = await req.olze!.db.from('workspaces').select('id,name,slug,plan');
    if (error) return res.status(500).json({ error: error.message });
    res.json({ workspaces: data ?? [] });
  });

  app.post('/api/workspaces/bootstrap', auth, async (req, res) => {
    const db = req.olze!.db;
    const { data: existing } = await db.from('workspaces').select('id').limit(1);
    if (existing?.length) return res.json({ workspace: existing[0], created: false });
    const { data: ws, error } = await db.rpc('bootstrap_workspace', { p_name: `${req.olze!.email.split('@')[0]}'s workspace` });
    if (error) {
      return res.status(500).json({ error: 'run migration 0004_bootstrap.sql: ' + error.message });
    }
    res.status(201).json({ workspace: ws, created: true });
  });

  // ── Projects ────────────────────────────────────────────────────────
  app.get('/api/projects', auth, async (req, res) => {
    const ws = String(req.query.workspaceId ?? '');
    const q = req.olze!.db.from('projects').select('id,name,slug,template,status,updated_at').order('updated_at', { ascending: false });
    if (ws) q.eq('workspace_id', ws);
    const { data, error } = await q;
    if (error) return res.status(500).json({ error: error.message });
    res.json({ projects: data ?? [] });
  });

  app.get('/api/projects/:id', auth, async (req, res) => {
    const db = req.olze!.db;
    const { data: project } = await db.from('projects').select('*').eq('id', req.params.id).maybeSingle();
    if (!project) return res.status(404).json({ error: 'not found (or not your workspace)' });
    const { data: files } = await db.from('files').select('id,path,content,updated_at').eq('project_id', req.params.id).order('path');
    res.json({ project, files: files ?? [] });
  });

  app.post('/api/projects', auth, async (req, res) => {
    const db = req.olze!.db;
    const { workspaceId, prompt, name, template } = req.body ?? {};
    if (!workspaceId) return res.status(400).json({ error: 'workspaceId required' });
    const title = name ?? (prompt ? String(prompt).split(/[.\n]/)[0].slice(0, 48) : 'Untitled project');
    const { data: project, error } = await db.from('projects').insert({
      workspace_id: workspaceId, name: title, slug: `${slugify(title)}-${Date.now().toString(36)}`,
      template: template ?? (prompt ? 'ai-generated' : 'blank'), prompt: prompt ?? null, created_by: req.olze!.id,
    }).select().single();
    if (error) return res.status(400).json({ error: error.message }); // RLS rejects non-member workspaces here

    if (prompt) {
      // Fire-and-forget agent build. Real files land in `files` table.
      queueAgent(db, gateway, workspaceId, project.id,
        `Create this project from scratch: ${prompt}\nUse modern Next.js App Router + Tailwind. Write every file with write_file.`).catch(err =>
        console.error('[agent]', err.message));
    }
    res.status(201).json({ project, agentQueued: Boolean(prompt) });
  });

  app.put('/api/projects/:id/files', auth, async (req, res) => {
    const db = req.olze!.db;
    const { path, content } = req.body ?? {};
    if (!path || typeof content !== 'string') return res.status(400).json({ error: 'path and content required' });
    const sb = new DbSandbox(db, req.params.id);
    let clean: string;
    try { clean = sb.safePathOf(String(path)); await sb.writeFile(clean, content); } catch (e: any) { return res.status(400).json({ error: e.message }); }
    const { data } = await db.from('files').select('id,path,content,updated_at').eq('project_id', req.params.id).eq('path', clean).maybeSingle();
    res.json({ file: data });
  });

  // ── AI Gateway endpoints ────────────────────────────────────────────
  app.post('/api/ai/chat', auth, async (req, res) => {
    const { workspaceId, messages } = req.body ?? {};
    if (!workspaceId || !Array.isArray(messages)) return res.status(400).json({ error: 'workspaceId and messages[] required' });
    currentDb = () => req.olze!.db;
    res.setHeader('content-type', 'text/event-stream');
    try {
      for await (const d of gateway.chat({ workspaceId, messages, kind: 'chat' })) {
        res.write(`data: ${JSON.stringify(d)}\n\n`);
      }
      res.write('data: [DONE]\n\n'); res.end();
    } catch (e: any) {
      res.write(`data: ${JSON.stringify({ done: true, error: e.message })}\n\n`); res.end();
    }
  });

  app.get('/api/ai/quota', auth, async (req, res) => {
    const ws = String(req.query.workspaceId ?? '');
    let used = 0;
    if (ws) { const { data } = await req.olze!.db.rpc('count_ai_usage_month', { p_workspace_id: ws }); used = Number(data ?? 0); }
    res.json({ requestsUsed: used, requestsLimit: freeLimit, hasByoKey: false,
      note: 'Free means fair-use. No Ollama required. No credit card required.' });
  });

  // ── Agent (sync JSON for v0.1; SSE upgrade planned) ────────────────
  app.post('/api/agent/run', auth, async (req, res) => {
    const db = req.olze!.db;
    const { projectId, goal } = req.body ?? {};
    if (!projectId || !goal) return res.status(400).json({ error: 'projectId and goal required' });
    const { data: project } = await db.from('projects').select('id,workspace_id').eq('id', projectId).maybeSingle();
    if (!project) return res.status(404).json({ error: 'project not found in your workspace' });
    currentDb = () => db;
    try {
      const out = await queueAgent(db, gateway, project.workspace_id, projectId, String(goal), true);
      res.json(out);
    } catch (e: any) {
      res.status(e instanceof QuotaExceededError ? 429 : 500).json({ error: e.message });
    }
  });

  // ── Integrations (boundaries; OAuth secrets required) ──────────────
  app.get('/api/integrations', auth, async (req, res) => {
    const { data } = await req.olze!.db.from('integration_connections').select('id,provider,account_label,created_at');
    // NOTE: token_enc is never selected. RLS policy intc_none blocks direct reads anyway;
    // connections are managed by the API only. For v0.1 we report metadata via service call below.
    res.json({ connections: data ?? [], githubOAuth: env.GITHUB_CLIENT_ID ? 'configured' : 'missing GITHUB_CLIENT_ID/GITHUB_CLIENT_SECRET',
      vercel: env.VERCEL_API_TOKEN ? 'configured' : 'missing VERCEL_API_TOKEN' });
  });

  app.get('/api/integrations/github/start', auth, (_req, res) => {
    if (!env.GITHUB_CLIENT_ID) return res.status(501).json({ error: 'GitHub OAuth not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET (see .env.example).' });
    const url = new URL('https://github.com/login/oauth/authorize');
    url.searchParams.set('client_id', env.GITHUB_CLIENT_ID!);
    url.searchParams.set('scope', 'repo');
    url.searchParams.set('redirect_uri', `${env.WEB_ORIGIN ?? 'http://localhost:3000'}/api/callbacks/github`);
    res.json({ authorizeUrl: url.toString() });
  });

  return app;
}

/** Runs the real CodingAgent against the DbSandbox using the shared gateway. Returns events + final files when awaited. */
async function queueAgent(db: SupabaseClient, gateway: OlzeAiGateway, workspaceId: string, projectId: string, goal: string, collect = false) {
  const sandbox: SandboxFs = new DbSandbox(db, projectId);
  const events: AgentEvent[] = [];
  const model = makeModelClient(gateway, workspaceId);
  const agent = new CodingAgent(model, sandbox, {
    maxSteps: 12,
    onEvent: (e) => { if (collect) events.push(e); },
    confirm: async () => false, // autonomous background builds never auto-approve dangerous actions
  });
  await agent.run(goal);
  if (!collect) return undefined;
  const { data: files } = await db.from('files').select('id,path,content,updated_at').eq('project_id', projectId).order('path');
  return { events, files: files ?? [] };
}

if (process.argv[1]?.endsWith('index.ts') || process.argv[1]?.endsWith('index.js')) {
  const port = Number(process.env.API_PORT ?? 8787);
  createApp(process.env as Env).listen(port, () => console.log(`Olze API listening on :${port}`));
}
