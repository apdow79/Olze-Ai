import type { ChatMessage, ToolSpec, ChatDelta } from '@olze/shared-types';
import type { ProviderAdapter } from './base.js';

/** Google Gemini — free tier via generateContent (non-streaming skeleton; wire streaming in v0.2). */
export class GeminiProvider implements ProviderAdapter {
  constructor(private apiKey?: string) {}
  isConfigured() { return Boolean(this.apiKey); }
  async *chatStream(messages: ChatMessage[], _tools: ToolSpec[] | undefined, model: string): AsyncIterable<ChatDelta> {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      { method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': this.apiKey! },
        body: JSON.stringify({ contents: messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })) }) });
    if (!res.ok) throw new Error(`gemini -> HTTP ${res.status}`);
    const json: any = await res.json();
    yield { content: json?.candidates?.[0]?.content?.parts?.[0]?.text ?? '', done: true };
  }
  estimateCost(_m: string, _i: number, _o: number) { return 0; }
}
