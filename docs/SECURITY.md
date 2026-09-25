# Olze Security Model

Olze writes code, runs commands, stores OAuth tokens, and deploys to production. **Security is a core feature (Phase 31), not a later add-on.**

## Threat Model Summary

| Threat | Mitigation |
| --- | --- |
| AI executes malicious/hostile commands | Per-project sandboxed containers; no host access; command allow-list + deny-list |
| Prompt injection via files/web content | Tool outputs marked untrusted; pinned system prompt; dangerous actions require user confirmation |
| Stolen OAuth tokens | Server-side encrypted vault (AES-256-GCM, KMS-managed key); short-lived tokens where possible; refresh rotation |
| Secrets leaked into AI context | Secret values never sent to providers; only names/refs; redaction filter on all outbound prompts |
| Cross-tenant data access | Supabase RLS keyed on `workspace_members`; workspace_id required on every query; integration tests per tenant |
| SSRF via BYO base URLs (Ollama/OpenAI-compatible) | URL allow-list validation, block private/link-local/metadata ranges |
| Dependency supply chain | Sandbox installs pinned lockfiles; periodic scanning (npm audit/osv) |
| Abuse of free AI tier | Fair-use quotas per workspace, rate limiting, anomaly detection on usage |
| Destructive agent actions | Action classes Read/Write/Execute/Deploy/Delete; Delete & production Deploy always confirm (`⚠️ … [Cancel] [Confirm]`) |
| Insider/log leakage | Audit logs without payloads containing secrets; structured redaction |

## Sandbox Contract

```text
Allowed:  file ops inside /project, node/npm/python from image, network egress filtered by domain policy
Denied:   host filesystem, docker socket, other workspaces' volumes, cloud metadata (169.254.169.254),
          privileged syscalls, writing outside mount
Limits:   CPU/mem/disk caps, wall-clock timeout per command, pids limit
```

## RBAC (workspaces)

`owner > admin > developer > designer > viewer` — enforced in API middleware **and** RLS policies (defense in depth).

## AI Safety Confirmations (Phase 32)

High-risk operations pause the agent loop and render a confirmation card:

- deleting databases/repositories/production data
- production deployments
- rotating/revoking secrets
- broad shell commands (`rm -rf`, force-push, etc.)

The agent may propose; only the user may approve.

## Audit Trail

Every tool call, deployment, auth event, and permission change → `agent_events` / `audit_logs` tables, append-only, exportable.

## Checklist Before Public Launch (v1.0)

- [ ] Penetration test of sandbox escape paths
- [ ] Token vault rotation runbook
- [ ] RLS verified with automated cross-tenant tests
- [ ] Rate limits + abuse dashboards live
- [ ] Dependency scanning in CI
- [ ] Bug bounty / disclosure policy published
