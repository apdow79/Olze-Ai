/** Base adapter contract every Olze AI provider implements. */
import type { ChatMessage, ToolSpec, ChatDelta } from '@olze/shared-types';

export interface ProviderAdapter {
  /** True when this provider has credentials/config to serve requests. */
  isConfigured(): boolean;
  /** Stream a chat completion (OpenAI-compatible tool calling where supported). */
  chatStream(messages: ChatMessage[], tools: ToolSpec[] | undefined, model: string): AsyncIterable<ChatDelta>;
  /** Rough USD cost estimate for usage accounting (0 for free tiers/local). */
  estimateCost(model: string, inputTokens: number, outputTokens: number): number;
}

/** Shared helper: OpenAI-compatible /chat/completions streaming with SSE parsing. */
export async function* openAiCompatStream(opts: {
  baseUrl: string; apiKey: string; model: string;
  messages: ChatMessage[]; tools?: ToolSpec[];
}): AsyncIterable<ChatDelta> {
  const res = await fetch(`${opts.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${opts.apiKey}` },
    body: JSON.stringify({
      model: opts.model, stream: true,
      messages: opts.messages.map(m => ({
        role: m.role,
        content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content ?? ''),
        ...(m.role === 'tool' ? { tool_call_id: (m as any).toolCallId } : {}),
      })),
      ...(opts.tools?.length ? { tools: opts.tools.map(t => ({ type: 'function', function: t })) } : {}),
    }),
  });
  if (!res.ok || !res.body) throw new Error(`${opts.baseUrl} -> HTTP ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n'); buf = lines.pop() ?? '';
    for (const line of lines) {
      const data = line.replace(/^data: /, '').trim();
      if (!data || data === '[DONE]') {
        if (data === '[DONE]') yield { done: true };
        continue;
      }
      try {
        const json = JSON.parse(data);
        const choice = json.choices?.[0];
        const delta = choice?.delta;
        yield {
          content: delta?.content,
          toolCalls: delta?.tool_calls?.map((tc: any) => ({
            id: tc.id ?? '', name: tc.function?.name ?? '', argumentsJson: tc.function?.arguments ?? '',
          })),
          done: choice?.finish_reason != null,
          usage: json.usage ? {
            inputTokens: json.usage.prompt_tokens, outputTokens: json.usage.completion_tokens,
            provider: 'openrouter' as const, model: opts.model, latencyMs: 0, estCostUsd: 0,
          } : undefined,
        };
      } catch { /* partial frame — ignore */ }
    }
  }
}
