/**
 * @olze/ai-gateway — provider-agnostic AI routing.
 *
 * Free-first principle: with ZERO configuration and ZERO user keys, the gateway
 * still answers (via any configured free provider). Users can add BYO keys later.
 */
import type { ChatRequest, ChatDelta, ProviderId } from '@olze/shared-types';
import { OpenRouterProvider } from './providers/openrouter.js';
import { GroqProvider } from './providers/groq.js';
import { GeminiProvider } from './providers/gemini.js';
import { OpenAIProvider } from './providers/openai.js';
import { AnthropicProvider } from './providers/anthropic.js';
import { OllamaProvider } from './providers/ollama.js';

export interface GatewayEnv {
  OPENROUTER_API_KEY?: string;
  GROQ_API_KEY?: string;
  GEMINI_API_KEY?: string;
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  OLLAMA_BASE_URL?: string;
  OLZE_FREE_CHAIN?: string;           // "groq/...,openrouter/...,gemini/..."
  OLZE_FREE_REQUESTS_PER_MONTH?: string;
}

export interface UsageSink {
  /** Persist one row into ai_usage for quota + observability. */
  record(args: { workspaceId: string; provider: ProviderId; model: string;
                 inputTokens: number; outputTokens: number; latencyMs: number;
                 estCostUsd: number; success: boolean }): Promise<void>;
  /** Monthly counter check for the free tier. */
  withinFreeQuota(workspaceId: string): Promise<boolean>;
}

export class QuotaExceededError extends Error {
  constructor(public limit: number) {
    super(`Olze Free limit reached (${limit} requests/month). ` +
          `Add your own API key to keep building, or wait until next month.`);
    this.name = 'QuotaExceededError';
  }
}

interface Route { provider: ProviderId; model: string; apiKey?: string; baseUrl?: string }

export class OlzeAiGateway {
  private providers: Record<ProviderId, import('./providers/base.js').ProviderAdapter>;

  constructor(env: GatewayEnv, private usage: UsageSink) {
    this.providers = {
      'openrouter': new OpenRouterProvider(env.OPENROUTER_API_KEY),
      'groq':       new GroqProvider(env.GROQ_API_KEY),
      'gemini':     new GeminiProvider(env.GEMINI_API_KEY),
      'openai':     new OpenAIProvider(env.OPENAI_API_KEY),
      'anthropic':  new AnthropicProvider(env.ANTHROPIC_API_KEY),
      'ollama':     new OllamaProvider(env.OLLAMA_BASE_URL ?? 'http://localhost:11434'),
      'olze-free':  new OpenRouterProvider(env.OPENROUTER_API_KEY), // placeholder alias
    };
    this.freeChain = this.parseChain(env.OLZE_FREE_CHAIN);
    this.freeLimit = Number(env.OLZE_FREE_REQUESTS_PER_MONTH ?? '100');
  }

  private freeChain: Route[];
  private freeLimit: number;

  private parseChain(spec?: string): Route[] {
    const defaults = [
      { provider: 'groq' as ProviderId,       model: 'llama-3.3-70b-versatile' },
      { provider: 'openrouter' as ProviderId, model: 'meta-llama/llama-3.3-70b-instruct:free' },
      { provider: 'gemini' as ProviderId,     model: 'gemini-2.0-flash' },
    ];
    if (!spec) return defaults;
    return spec.split(',').map((s) => s.trim()).filter(Boolean).map((ref) => {
      const [provider, ...rest] = ref.split('/');
      return { provider: provider as ProviderId, model: rest.join('/') };
    });
  }

  /** Resolve the ordered list of routes to try for a request. */
  resolveRoutes(req: ChatRequest & { byoKey?: Route }): Route[] {
    // 1. User-provided key/model wins outright.
    if (req.preferredModel && (req as any).byoKey) return [(req as any).byoKey];
    // 2. Otherwise free-first chain (fallback on failure is automatic below).
    return this.freeChain;
  }

  /** Streaming chat with automatic fallback across the route chain. */
  async *chat(req: ChatRequest, byoKey?: Route): AsyncIterable<ChatDelta> {
    const routes = this.resolveRoutes({ ...req, byoKey } as any);
    const usingFreeTier = !byoKey;

    if (usingFreeTier && !(await this.usage.withinFreeQuota(req.workspaceId))) {
      throw new QuotaExceededError(this.freeLimit);
    }

    let lastErr: unknown;
    for (const route of routes) {
      const adapter = this.providers[route.provider];
      if (!adapter?.isConfigured()) continue;              // skip unconfigured providers
      const started = Date.now();
      try {
        let inTok = 0, outTok = 0;
        for await (const delta of adapter.chatStream(req.messages, req.tools, route.model)) {
          if (delta.usage) { inTok = delta.usage.inputTokens; outTok = delta.usage.outputTokens; }
          yield delta;
        }
        await this.usage.record({
          workspaceId: req.workspaceId, provider: route.provider, model: route.model,
          inputTokens: inTok, outputTokens: outTok, latencyMs: Date.now() - started,
          estCostUsd: adapter.estimateCost(route.model, inTok, outTok), success: true,
        });
        return;                                             // success ends the chain
      } catch (err: any) {
        lastErr = err;                                      // 429/5xx/timeout → try next route
        await this.usage.record({
          workspaceId: req.workspaceId, provider: route.provider, model: route.model,
          inputTokens: 0, outputTokens: 0, latencyMs: Date.now() - started,
          estCostUsd: 0, success: false,
        });
      }
    }
    throw lastErr ?? new Error('No AI provider available. Configure at least one free provider key server-side.');
  }
}

export { OpenRouterProvider } from './providers/openrouter.js';
export { GroqProvider } from './providers/groq.js';
export { GeminiProvider } from './providers/gemini.js';
export { OpenAIProvider } from './providers/openai.js';
export { AnthropicProvider } from './providers/anthropic.js';
export { OllamaProvider } from './providers/ollama.js';
