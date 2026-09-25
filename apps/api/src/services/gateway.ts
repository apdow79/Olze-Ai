import { OlzeAiGateway, type UsageSink } from '@olze/ai-gateway';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ProviderId } from '@olze/shared-types';

/** ai_usage-backed UsageSink. Writes go through a SECURITY DEFINER RPC (see migration 0003)
 *  so clients can record usage without being able to read others' rows. */
export function makeUsageSink(db: () => SupabaseClient | null, limit: number): UsageSink {
  return {
    async record(args) {
      const s = db(); if (!s) return;
      await s.rpc('record_ai_usage', {
        p_workspace_id: args.workspaceId, p_provider: args.provider, p_model: args.model,
        p_input_tokens: args.inputTokens, p_output_tokens: args.outputTokens,
        p_latency_ms: args.latencyMs, p_est_cost_usd: args.estCostUsd, p_success: args.success,
      });
    },
    async withinFreeQuota(workspaceId) {
      const s = db(); if (!s) return true; // no DB → dev mode, don't block local development
      const { data, error } = await s.rpc('count_ai_usage_month', { p_workspace_id: workspaceId });
      if (error) return true;
      return Number(data ?? 0) < limit;
    },
  };
}

export function buildGateway(env: Record<string, string | undefined>, sink: UsageSink): OlzeAiGateway {
  return new OlzeAiGateway(env as any, sink);
}
