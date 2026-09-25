# Services

- `gateway.ts` — builds `OlzeAiGateway` with a Supabase-backed `UsageSink` (ai_usage table).
- `sandbox.ts` — per-project container adapter implementing agent-core's `SandboxFs`.
- `secrets.ts` — AES-256-GCM token vault for integration_connections (KMS-managed key in prod).
- `quota.ts` — monthly free-tier counters + warnings at 60%/90%.
