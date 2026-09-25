# Olze — Technical Architecture (v0.1 target)

## Stack Decision

| Layer | Choice | Why |
| --- | --- | --- |
| Web app | **Next.js 15 + TypeScript + Tailwind** | SSR for landing SEO, App Router for the product UI, one codebase with the API layer |
| API | Node/Express service (`apps/api`) — or Next.js route handlers early, split out when sandboxing needs a separate process | Keeps AI gateway + agent orchestration independent of UI |
| DB / Auth | **Supabase** (Postgres, Auth, Storage, RLS, Edge Functions) | Free tier fits "free-first", row-level security gives project isolation for free |
| AI | **Olze AI Gateway** (`packages/ai-gateway`) over OpenRouter/Groq/Gemini/OpenAI/Anthropic/Ollama | Never vendor-locked; free models are the default route |
| Agent | `packages/agent-core` — tool loop (read/write/edit/search/run) | Shared by web, CLI, VS Code, desktop |
| Editor | Monaco | Battle-tested, TS diagnostics |
| Preview/Sandbox | Isolated containers per project (`sandbox/`) | Security boundary between AI and host |
| Deploy targets | GitHub → Vercel (OAuth, encrypted token storage) | Standard path users already trust |
| Desktop (later) | Tauri | Small binaries, reuses web UI |
| Testing | Vitest + Playwright | Fast unit + real E2E |

## System Diagram

```text
                    OLZE
                     │
          ┌──────────┴──────────┐
          │                     │
       Web App              CLI/Desktop
   (Next.js + Tailwind)   (same engine later)
          │                     │
          └──────────┬──────────┘
                     │  HTTPS / WebSocket
                Olze API (Express)
                     │
     ┌───────────────┼────────────────┐
     │               │                │
  AI Gateway      Projects        Auth/Users
     │               │                │
 ┌───┼───┬───────┐   │            Supabase
 │   │   │       │   │           (Postgres+RLS)
Groq OR Gemini Ollama │                │
     (free-first routing)           Storage
                     │
                  Agent Core ──── Sandbox (per-project container)
                     │
        ┌────────────┼────────────┐
     GitHub      Supabase      Vercel
     (OAuth)     (OAuth)      (OAuth)
```

## Data Model (core tables — see supabase/migrations)

```text
users (auth.users) ─┐
profiles ───────────┤
workspaces ──── workspace_members
projects ───── files / file_versions
deployments ── integration_connections (github/supabase/vercel tokens, encrypted)
ai_usage ────── credit_transactions (future billing)
agent_sessions ─ agent_events (audit trail)
```

Key rules:
- Every table has `workspace_id`; RLS policies scope access through `workspace_members`.
- OAuth tokens stored server-side, encrypted at rest, never exposed to the client or AI context unless strictly necessary.
- `ai_usage` records provider, model, tokens, latency, cost — the basis for fair-use limits and future credits.

## Request Flow — "Describe your idea" → working project

```text
1. POST /api/projects { prompt | template }
2. Project row created; template copied into sandbox volume
3. Agent session started (agent-core loop):
     plan → tool call (write_file / run_command / read_file) → observe → repeat
4. Each tool call executed inside the project sandbox only
5. Build watcher produces preview URL (preview.olze.app/<id>)
6. Streamed events (SSE/WebSocket) drive the UI chat + file tree + terminal
7. On success: initial commit pushed if GitHub connected
```

## Boundaries & Contracts

- `packages/shared-types` defines all API DTOs — web, api, CLI, extension consume the same types.
- AI Gateway exposes one interface: `generate(request) → stream`, `chat(messages, tools)`. Providers are adapters.
- Agent tools are pluggable and permission-classified (`read | write | execute | deploy | delete`).
- Sandbox communicates with API only via a narrow RPC (fs ops + exec with allow-list).

## Scaling Path

1. v0.1–v0.3: monolith API + Supabase + containerized sandboxes.
2. v0.4+: queue-based agent execution (workers), object storage for artifacts.
3. v1.0: multi-region previews, CDN, observability stack (Phase 33).
