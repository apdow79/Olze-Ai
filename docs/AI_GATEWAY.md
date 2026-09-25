# Olze AI Gateway — Design

**Rule #1 of Olze: the product is never hard-wired to a single AI provider.**

## Goals

1. **Free-first:** every new user gets working AI with zero configuration (free-tier models routed by default).
2. **Provider-agnostic:** one interface; adapters for OpenRouter, Groq, Gemini, OpenAI, Anthropic, local Ollama.
3. **BYO keys:** advanced users add their own API keys; their keys take priority and remove fair-use limits.
4. **Cost control:** every call logged (provider, model, tokens, latency, estimated cost) → powers fair-use limits and future credits.
5. **Resilience:** automatic fallback chain when a provider is down/rate-limited.

## Interface

```ts
interface AiGateway {
  chat(req: ChatRequest): AsyncIterable<ChatDelta>;   // streaming
  complete(req: CompleteRequest): Promise<Completion>;
  listModels(userId?: string): Promise<ModelInfo[]>;
}

interface ChatRequest {
  messages: Message[];
  tools?: ToolSpec[];          // agent function-calling
  preferredModel?: string;     // e.g. "olze-free" | user BYO model
  workspaceId: string;         // for quota + audit
  signal?: AbortSignal;
}
```

## Routing Policy

```text
resolveRoute(user, request):
  1. user has BYO key & selected provider/model → use it
  2. else if free-tier quota available this month → FREE_CHAIN
  3. else → throw QuotaExceeded (UI: upgrade / wait / bring your own key)

FREE_CHAIN = [groq/llama-3.3-70b, openrouter/*:free, gemini-flash]
AGENT_CHAIN = stronger coding models, same resolution order
```

Fallback: on 429/5xx/timeouts, advance to next entry in the chain; record failure for observability (Phase 33).

## Providers (adapters in `packages/ai-gateway/src/providers/`)

| Adapter | Notes |
| --- | --- |
| `openrouter.ts` | Access to many `*:free` models — primary free backbone |
| `groq.ts` | Fast free-tier inference, good for chat + small agents |
| `gemini.ts` | Free tier generous; vision useful for browser/desktop phases |
| `openai.ts` | BYO only (no free route by default) |
| `anthropic.ts` | BYO only; excellent for the coding agent |
| `ollama.ts` | Optional local endpoint (`http://localhost:11434`) — desktop/CLI phase |

## Fair Use

- Per-workspace monthly counter in `ai_usage`; default cap **100 requests/month** (tune with real costs at MVP).
- Soft warnings at 60% / 90%. Hard stop with helpful message pointing to BYO keys first, credits later.

## Security Notes

- Provider keys live server-side only (encrypted secrets store). The client never sees any key.
- Prompt-injection defense: tool results are wrapped/untrusted; system prompt pinned; no secrets injected into context unless the task strictly requires it.
- SSRF guard on Ollama/BYO base URLs (allow-list schemes/hosts, no cloud metadata endpoints).

See implementation skeleton: `../packages/ai-gateway/src/`.
