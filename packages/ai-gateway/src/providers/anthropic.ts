import type { ChatMessage, ToolSpec, ChatDelta } from '@olze/shared-types';
import type { ProviderAdapter } from './base.js';

/** Anthropic — BYO key only; excellent for the coding agent (v0.2 wires full tool use). */
export class AnthropicProvider implements ProviderAdapter {
  constructor(private apiKey?: string) {}
  isConfigured() { return Boolean(this.apiKey); }
  async *chatStream(messages: ChatMessage[], _tools: ToolSpec[] | undefined, model: string): AsyncIterable<ChatDelta> {
    const system = messages.find(m => m.role === 'system')?.content;
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': this.apiKey!, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model, max_tokens: 4096, system, messages: messages.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content })) }),
    });
    if (!res.ok) throw new Error(`anthropic -> HTTP ${res.status}`);
    const json: any = await res.json();
    yield { content: json?.content?.[0]?.text ?? '', done: true,
      usage: json?.usage ? { inputTokens: json.usage.input_tokens, outputTokens: json.usage.output_tokens,
        provider: 'anthropic', model, latencyMs: 0, estCostUsd: 0 } : undefined };
  }
  estimateCost(_m: string, i: number, o: number) { return (i * 3 + o * 15) / 1e6; }
}
