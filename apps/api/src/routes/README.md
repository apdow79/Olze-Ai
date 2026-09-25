# API routes (v0.1)

Mounted from `../index.ts`:

- `/health` — liveness
- `/api/ai/chat` — SSE stream via Olze AI Gateway (free-first routing)
- `/api/ai/quota` — fair-use status for the workspace
- `/api/projects` — CRUD + "describe your idea" creation
- `/api/agent/run`, `/api/agent/:id/confirm` — coding agent sessions + safety confirmations
- `/api/integrations` — GitHub / Supabase / Vercel OAuth connections (tokens never leave the server)

Planned: `/api/workspaces`, `/api/deployments`, `/api/templates`.
