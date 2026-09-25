# Olze Monetization Strategy

**Guiding rule: do not monetize the foundation.** Stage 1 exists to earn users, feedback, testing, and community trust.

## Stages

### Stage 1 — OLZE FREE (now → v0.x)

Everything free with fair-use AI limits:

- AI generation & agent, projects, visual editor, GitHub/Supabase/Vercel integrations, preview, deployments.
- **Free AI:** ~100 requests/month per workspace (calibrate against real provider cost during MVP).
- Cost control levers: free-tier model routing, BYO keys encouraged, usage caps, caching.

Goal: product-market fit + community, not revenue.

### Stage 2 — Olze Free + Olze Pro (v1.0+)

| | Free | Pro |
| --- | --- | --- |
| AI requests | capped | high cap |
| Projects | limited | more |
| Preview/deploy | standard | custom domains, faster sandboxes |
| Collaboration | solo | small team |

Pro priced monthly; positioned as "more of what you already use".

### Stage 3 — Credits, Teams, Enterprise, Marketplace, Cloud

```text
Olze Credits:
Free      100 credits
Pro     10,000 credits
Business  50,000 credits

Credits fund: AI generation · agent runs · large models · long context · advanced deployments
```

- **Teams:** seats, roles, shared workspaces, SSO.
- **Enterprise:** dedicated sandboxes, compliance, support SLAs.
- **Marketplace:** rev-share on templates/components/plugins/agents/themes.
- **Cloud:** hosted Olze Core (open source) for companies wanting managed infra.

## Billing Architecture (future — Phase 26)

- Stripe first; add regional providers when markets like Somalia justify it and the architecture supports pluggable payment adapters.
- Tables: `plans`, `subscriptions`, `credits`, `credit_transactions`, `usage` (schema stubs reserved in migrations but disabled until Stage 2).

## Anti-Patterns We Reject

- Paywalling basic building.
- Hiding required functionality behind "contact sales" at launch.
- Metering that surprises users mid-project (always warn at 60%/90%).
