<p align="center">
  <img src="design/logo/olze-logo.svg" width="220" alt="Olze logo" />
</p>

# 🚀 Olze

**Build websites and apps with AI.**

> Olze lets anyone start building immediately — **no Ollama required, no API key required, no credit card required.** Free-first AI development platform that grows with you.

---

## Why Olze?

Most AI coding tools assume you already have a GPU, a local model, or a paid API key. Olze flips that: you open the app, describe your idea, and start building. Advanced users can plug in their own providers (OpenAI, Anthropic, Gemini, OpenRouter, Groq, Ollama) any time.

```text
User idea ──► Olze AI Gateway ──► Coding Agent ──► Project files ──► Live Preview
                     │
        ┌────────────┼─────────────┬──────────────┐
     Free tier    OpenRouter      Groq          Local Ollama
   (default)    (BYO key)      (BYO key)       (optional)
```

## Monorepo Layout

```text
olze/
├── apps/
│   ├── web/            # Next.js web app (landing, auth, workspace, editor, preview)
│   └── api/            # Olze API (Express) — AI gateway, projects, agent orchestration
├── packages/
│   ├── ai-gateway/     # Provider-agnostic AI gateway (free-first routing)
│   ├── agent-core/     # Coding agent loop + tools (read/write/edit/run/search)
│   └── shared-types/   # TypeScript types shared across apps/packages
├── supabase/
│   └── migrations/     # Database schema (auth, workspaces, projects, credits)
├── sandbox/
│   └── templates/      # Project starter templates (blank, nextjs, react, saas…)
├── docs/               # Product & engineering documentation
└── design/             # Brand: logo, icons, tokens
```

## Core Principles

1. **Free-first** — every user can build without setup or payment. Fair-use limits keep it sustainable.
2. **Provider-agnostic AI** — one gateway, many brains. Never hard-wired to a single vendor.
3. **Agent, not chatbot** — the AI reads files, writes code, runs commands, fixes errors, deploys.
4. **Visual ↔ Code sync** — the canvas and the source are two views of one truth.
5. **Security is a feature** — sandboxed execution, isolated secrets, confirmation for destructive actions.
6. **One engine, many surfaces** — Web → CLI → VS Code → Desktop → Browser extension all reuse the same core.

## Quick Start (v0.1 development)

```bash
# 1. Install dependencies (from repo root)
npm install

# 2. Configure environment
cp .env.example apps/api/.env

# 3. Run the Supabase migrations in supabase/migrations/
#    (or: supabase db reset)

# 4. Start the API
npm run dev -w @olze/api

# 5. Start the web app
npm run dev -w @olze/web
```

## Roadmap at a Glance

| Version | Focus |
| ------- | ----- |
| v0.1 | Foundation: brand, auth, workspaces, projects, DB, AI gateway skeleton |
| v0.2 | AI Builder: chat, code generation, file editing, agent, live preview |
| v0.3 | Visual: editor, drag/drop, properties, responsive, visual↔code |
| v0.4 | Integrations: GitHub, Supabase, Vercel |
| v0.5 | CLI: `olze login/create/dev/ai/deploy` |
| v0.6 | Developer tools: VS Code extension, terminal, better agent |
| v0.7 | Desktop (Tauri): Windows / macOS / Linux |
| v0.8 | Browser extension (Chrome/Edge) |
| v1.0 | Public launch 🚀 |

Full 38-phase plan: [docs/ROADMAP.md](docs/ROADMAP.md)

Other docs: [Architecture](docs/ARCHITECTURE.md) · [AI Gateway](docs/AI_GATEWAY.md) · [Security](docs/SECURITY.md) · [Monetization](docs/MONETIZATION.md) · [Design Tokens](design/DESIGN_TOKENS.md)

## Documentation

- [Product Roadmap (Phases 0–38)](docs/ROADMAP.md)
- [Technical Architecture](docs/ARCHITECTURE.md)
- [AI Gateway Design](docs/AI_GATEWAY.md)
- [Security Model](docs/SECURITY.md)
- [Monetization Strategy](docs/MONETIZATION.md)

## Contributing

Olze Core will be open source; Olze Cloud is the hosted offering. See [CONTRIBUTING](docs/CONTRIBUTING.md) (coming soon).

## License

Olze Core: MIT (planned). Olze Cloud: proprietary hosted service.
