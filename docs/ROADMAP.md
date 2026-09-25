# 🚀 OLZE — FULL PRODUCT ROADMAP

> **Product principle:** a user can start building with Olze without installing Ollama, without an API key, and without a credit card. Everything else is built on top of that promise.

- [Phase 0 — Product Vision](#phase-0--product-vision)
- [Phase 1 — Foundation (Brand & Domains)](#phase-1--foundation-brand--domains)
- [Phase 2 — Web App & Landing](#phase-2--web-app--landing)
- [Phase 3 — Authentication](#phase-3--authentication)
- [Phase 4 — Workspace System](#phase-4--workspace-system)
- [Phase 5 — Project Creation](#phase-5--project-creation)
- [Phase 6 — AI Engine (Gateway)](#phase-6--ai-engine-gateway-)
- [Phase 7 — AI Coding Agent](#phase-7--ai-coding-agent-)
- [Phase 8 — File System / Sandbox](#phase-8--file-system--sandbox)
- [Phase 9 — Visual Builder](#phase-9--visual-builder-)
- [Phase 10 — Visual ↔ Code Sync](#phase-10--visual--code-sync)
- [Phase 11 — Code Editor](#phase-11--code-editor)
- [Phase 12 — Live Preview](#phase-12--live-preview)
- [Phase 13 — Terminal](#phase-13--terminal)
- [Phase 14 — Supabase Integration](#phase-14--supabase-integration-)
- [Phase 15 — GitHub Integration](#phase-15--github-integration-)
- [Phase 16 — Vercel Integration](#phase-16--vercel-integration-)
- [Phase 17 — AI Deployment Agent](#phase-17--ai-deployment-agent)
- [Phase 18 — CLI](#phase-18--cli-)
- [Phase 19 — OpenCode-style Agent CLI](#phase-19--opencode-style-agent-cli)
- [Phase 20 — VS Code Extension](#phase-20--vs-code-extension)
- [Phase 21 — Browser Extension](#phase-21--browser-extension)
- [Phase 22 — Desktop App](#phase-22--desktop-app-)
- [Phase 23 — Local AI (Optional)](#phase-23--local-ai-optional)
- [Phase 24 — Free Model Tier](#phase-24--free-model-tier)
- [Phase 25 — Credits System](#phase-25--credits-system-)
- [Phase 26 — Billing](#phase-26--billing)
- [Phase 27 — Team Collaboration](#phase-27--team-collaboration)
- [Phase 28 — Templates](#phase-28--templates)
- [Phase 29 — Marketplace](#phase-29--marketplace)
- [Phase 30 — Plugin System](#phase-30--plugin-system-)
- [Phase 31 — Security](#phase-31--security-)
- [Phase 32 — AI Safety](#phase-32--ai-safety)
- [Phase 33 — Observability](#phase-33--observability)
- [Phase 34 — Testing](#phase-34--testing)
- [Phase 35 — Documentation](#phase-35--documentation)
- [Phase 36 — Open Source](#phase-36--open-source)
- [Phase 37 — Self Hosting](#phase-37--self-hosting)
- [Phase 38 — Production Architecture](#phase-38--production-architecture)
- [Version Roadmap v0.1 → v1.0](#-version-roadmap)
- [Monetization Stages](#-monetization--do-not-start-now)

---

## Phase 0 — Product Vision

**Olze** = AI-powered platform for building full-stack websites and apps.

```text
Olze
│
├── 🌐 Web App
├── 🖥️ Desktop App
├── ⌨️ CLI
├── 🧩 VS Code Extension
├── 🌍 Browser Extension
│
├── 🤖 AI Coding Agent
├── 🎨 Visual Builder
├── 💻 Code Editor
├── 👁️ Live Preview
│
├── 🗄️ Supabase
├── 🐙 GitHub
├── ▲ Vercel
│
└── 💳 Credits / Billing (future)
```

**The single most important principle:**

> A user can start using Olze without installing Ollama, without an API key, or any other AI model.

---

## Phase 1 — Foundation (Brand & Domains)

### Brand: **Olze**

Deliverables (see `design/`):

- Logo + icon (SVG sources in `design/logo/`)
- Typography scale
- Color system + dark/light mode
- Design tokens (`design/DESIGN_TOKENS.md`)
- Favicon + OG image

### Domains (future)

```text
olze.com          app.olze.com
docs.olze.com     api.olze.com
preview.olze.app  (sandbox previews)
```

If the primary domain is unavailable, pick an alternative owned by the brand — never compromise the name.

---

## Phase 2 — Web App & Landing

The web app is the first surface users touch.

Landing page copy:

```text
Olze

Build websites and apps with AI.

[ Start Building Free ]

No Ollama required.
No credit card required.
```

Sections: Hero · AI builder demo · Visual editor demo · Features · Integrations · How it works · Open-source/community message · Pricing (future credits) · FAQ · Footer.

---

## Phase 3 — Authentication

Sign-in options:

```text
Continue with GitHub      Continue with Google      Email
```

Backend: **Supabase Auth**. Tables: `users`, `profiles`, `workspaces`, `workspace_members` (see `supabase/migrations/`).

---

## Phase 4 — Workspace System

Every user owns a workspace; projects live inside workspaces.

```text
User → Workspace → Projects → Files → Deployments
```

Prepares cleanly for teams (Phase 27).

---

## Phase 5 — Project Creation

`+ New Project` → choose starter:

```text
Blank · Next.js · React · Landing Page · SaaS · Dashboard · E-commerce · Portfolio
```

…or just describe the idea:

> "Build me a modern restaurant website with online booking."

Templates live in `sandbox/templates/`.

---

## Phase 6 — AI Engine 🧠

The heart of Olze. **Never hard-wired to one provider.**

```text
                 ┌── OpenRouter
                 │
Olze AI Gateway ─┼── Groq
                 │
                 ├── Gemini
                 │
                 ├── OpenAI / Anthropic
                 │
                 └── Local Ollama
```

- **Default:** free models — zero setup for the user.
- **Advanced:** users add their own keys (OpenAI, Anthropic, Gemini, OpenRouter, Ollama) in Settings → AI Provider.

Design details: [AI_GATEWAY.md](AI_GATEWAY.md). Implementation skeleton: `packages/ai-gateway/`.

---

## Phase 7 — AI Coding Agent

Not a chatbot — an **agent** that can:

```text
Read files · Create files · Edit files · Delete files · Search code
Run commands · Install packages · Run tests · Read errors · Fix errors
Build project · Deploy project
```

Example flow for “Add authentication to my app”:

```text
1. Inspect project        6. Create signup UI
2. Detect framework       7. Add middleware
3. Detect Supabase        8. Configure session
4. Create auth routes     9. Run tests
5. Create login UI       10. Fix errors
```

Implementation skeleton: `packages/agent-core/`.

---

## Phase 8 — File System / Sandbox

Each project runs in an **isolated sandbox**:

```text
Project/
├── app/  ├── components/  ├── lib/  ├── public/
├── package.json  └── ...
```

The agent can modify the project — **never the host system**. See [SECURITY.md](SECURITY.md).

---

## Phase 9 — Visual Builder 🎨

What makes Olze more than a CLI tool:

```text
┌──────────────┬───────────────────────┬──────────────┐
│ Components   │       Preview         │ Properties   │
│ Button       │      Website          │ Width        │
│ Card         │                       │ Height       │
│ Navbar       │                       │ Color        │
│ Form         │                       │ Padding      │
└──────────────┴───────────────────────┴──────────────┘
```

Features: drag & drop · resize · spacing · colors · typography · responsive design · components · sections · pages.

---

## Phase 10 — Visual ↔ Code Sync

Two views, one source of truth:

- User changes button to blue in the canvas → `className` updated in code.
- User edits `<Button className="bg-indigo-600">` → canvas updates.

Neither side is a mock editor. Achieved via AST-level editing (e.g. `react-docgen`/SWC metadata + stable `data-olze-id` attributes injected at build time).

---

## Phase 11 — Code Editor

**Monaco Editor**: syntax highlighting · search/replace · tabs · errors · TypeScript diagnostics · file tree · AI inline suggestions.

```text
Explorer → Code Editor → Terminal
```

---

## Phase 12 — Live Preview

```text
Code → Build → Preview   →   https://preview.olze.app/<id>
```

Auto-refresh on every change (HMR / rebuild watcher).

---

## Phase 13 — Terminal

In-sandbox terminal for user and agent:

```bash
$ npm install   $ npm run dev   $ npm test
```

Command allow/deny controls apply (see Security).

---

## Phase 14 — Supabase Integration 🗄️

`Connect Supabase` (OAuth / project link). Olze can manage: Database · Tables · Auth · Storage · RLS · Edge Functions · env vars.

Agent example: “Create users and products tables, enable RLS, create policies” → generated migrations.

---

## Phase 15 — GitHub Integration 🐙

`Connect GitHub`: create repo · clone · commit · push · pull · branch · PR.

```text
Olze project ⇄ GitHub repository (main)
```

---

## Phase 16 — Vercel Integration ▲

`Deploy to Vercel`:

```text
Olze → GitHub → Vercel → Production
```

Preview deployments · production deploys · env vars · logs · domains.

---

## Phase 17 — AI Deployment Agent

> “Deploy this to Vercel.”

Agent: check build → fix errors → commit → push → deploy → return URL. Destructive/production actions require confirmation (Phase 32).

---

## Phase 18 — CLI ⌨️

After the web app stabilizes:

```bash
npm install -g olze

olze login | create <name> | dev | build | ai | deploy | git | supabase
```

```text
$ olze create my-saas
✓ Created project   ✓ Installed dependencies
✓ Connected workspace   ✓ Ready
```

---

## Phase 19 — OpenCode-style Agent CLI

```bash
$ olze
> Build authentication for this project
```

Interactive agent reads and edits the local project using the same `agent-core` engine.

---

## Phase 20 — VS Code Extension

Sidebar **OLZE**: Ask AI · Chat · Project · Files · Git · Supabase · Deploy. Uses the Olze API + shared types, so behavior matches the web app.

---

## Phase 21 — Browser Extension

Chrome/Edge: right-click a site → “Build with Olze” / “Recreate this landing page in my project”.

⚠️ **Design constraint:** copyright and site ownership matter. The feature must target inspiration, accessibility audits, and owned-content workflows — not wholesale copying of protected sites.

---

## Phase 22 — Desktop App 🖥️

**Tauri** after web + CLI are stable. Local projects · AI agent · terminal · visual builder · Git · Supabase · Vercel · local AI. Ships `Olze.exe` for Windows, plus macOS/Linux builds.

---

## Phase 23 — Local AI (Optional)

Never a requirement. In `Settings → AI Provider`:

```text
Olze Free AI · OpenRouter · Groq · Gemini · OpenAI · Anthropic · Ollama · LM Studio
```

Privacy-focused users get local inference; everyone else just uses **Olze Free AI**.

---

## Phase 24 — Free Model Tier

Launch offering **OLZE FREE**: AI generation, projects, visual editor, GitHub, Supabase, preview, Vercel deployment — with **fair-use limits** because inference costs money.

Starting point: `100 AI requests/month` (exact number calibrated against real provider costs during MVP).

---

## Phase 25 — Credits System 💳

```text
Free 100 · Pro 10,000 · Business 50,000 credits
```

Credits fund: AI generation · agent execution · large models · long context · advanced deployments.

---

## Phase 26 — Billing

**Stripe**, plus regional providers if markets like Somalia matter once the architecture supports them. Tables: `subscriptions`, `plans`, `credits`, `credit_transactions`, `usage`.

---

## Phase 27 — Team Collaboration

Roles: Owner · Admin · Developer · Designer · Viewer. Invites, permissions, project sharing, comments, activity logs.

---

## Phase 28 — Templates

SaaS · Dashboard · E-commerce · Portfolio · Agency · Blog · CRM · AI App · Marketplace · Landing Page. Pick template → AI customizes.

---

## Phase 29 — Marketplace

Developers publish templates, components, plugins, agents, themes, integrations.

---

## Phase 30 — Plugin System 🔌

`Olze Plugin API` — official plugins (Supabase, GitHub, Vercel, Stripe, Resend, Cloudflare, Firebase, Neon, Railway) and third-party `olze-plugin-x` packages. Essential for an ecosystem.

---

## Phase 31 — Security 🔐

Core feature, not an afterthought:

```text
Sandboxed execution · secrets isolation · encrypted OAuth tokens
short-lived credentials · project/workspace isolation · RBAC
rate limiting · audit logs · RLS · SSRF protection
command allow/deny · dependency scanning · prompt-injection defenses
no secrets in AI context unless necessary
```

Details: [SECURITY.md](SECURITY.md).

---

## Phase 32 — AI Safety

Action classes: `Read · Write · Execute · Deploy · Delete`.

High-risk actions (delete database, delete repository, production deploy, rotate secrets) always require explicit confirmation:

```text
⚠️ This action will delete production data.
[Cancel] [Confirm]
```

---

## Phase 33 — Observability

System Health dashboard: AI latency · AI errors · build failures · deployment failures · API errors · provider status · DB status · sandbox failures.

---

## Phase 34 — Testing

Unit: **Vitest** · E2E: **Playwright** · Integration: Supabase/GitHub/Vercel/AI providers.

Critical flow that must work 100% before public launch:

```text
Signup → Create project → AI build → Edit → Preview → GitHub → Supabase → Vercel → Production
```

---

## Phase 35 — Documentation

`docs.olze.com`: Getting Started · Projects · AI Agent · Visual Builder · CLI · VS Code · Supabase · GitHub · Vercel · Plugins · API · Self Hosting · Security · Contributing.

---

## Phase 36 — Open Source

```text
Olze Core  → open source (MIT)
Olze Cloud → hosted services (monetized later)
```

---

## Phase 37 — Self Hosting

```bash
git clone olze && docker compose up
```

Own Supabase, AI provider, GitHub, deployment target, domain.

---

## Phase 38 — Production Architecture

```text
                    OLZE
                     │
          ┌──────────┴──────────┐
          │                     │
       Web App              CLI/Desktop
          │                     │
          └──────────┬──────────┘
                     │
                Olze API
                     │
        ┌────────────┼────────────┐
        │            │            │
       AI          Projects     Auth
        │            │            │
 ┌──────┼──────┐     │        Supabase
 │      │      │     │
Groq OpenRouter Gemini
 │
 └───────────────┐
                 │
              Agent
                 │
       ┌─────────┼─────────┐
       │         │         │
    GitHub    Supabase   Vercel
```

Full technical detail: [ARCHITECTURE.md](ARCHITECTURE.md).

---

# 🏁 VERSION ROADMAP

| Version | Scope |
| --- | --- |
| **v0.1 — Foundation** | Brand · Repo · Architecture · Auth · Workspace · Project system · Database |
| **v0.2 — AI Builder** | AI chat · Code generation · File editing · Agent · Live preview |
| **v0.3 — Visual** | Visual editor · Drag/drop · Properties · Responsive · Visual↔Code |
| **v0.4 — Integrations** | GitHub · Supabase · Vercel |
| **v0.5 — CLI** | `olze login/create/dev/ai/deploy` |
| **v0.6 — Developer Tools** | VS Code extension · Terminal · Better agent · Git workflows |
| **v0.7 — Desktop** | Windows · macOS · Linux (Tauri) |
| **v0.8 — Browser** | Chrome · Edge · browser-to-project workflows |
| **v1.0 — Public Launch 🚀** | Web · AI · Visual · Code · GitHub · Supabase · Vercel · CLI · Free tier · Docs · Security · Production infra |

---

# 💰 MONETIZATION — DO NOT START NOW

| Stage | Offering | Goal |
| --- | --- | --- |
| 1 | **OLZE — FREE** | Users, feedback, testing, community |
| 2 | Olze Free + Olze Pro | Conversion, sustainability |
| 3 | Credits · Teams · Enterprise · Marketplace · Cloud | Full business model |

Money follows product value — the foundation must not be built on payments.

---

# ⭐ What We Build Today

Do **not** attempt all 38 phases at once. Current scope = **OLZE v0.1**:

```text
OLZE V0.1
├── Next.js · TypeScript · Tailwind · Supabase
├── Auth · Workspace · Projects · Database
├── AI Gateway + Free AI provider
├── AI Agent · File system · Code editor · Preview
└── GitHub OAuth · Supabase OAuth · Vercel integration
```

**Visual Builder comes next (v0.3).** Once the foundation works, CLI, VS Code, Desktop and extensions all reuse the same engine instead of each being rebuilt separately.
