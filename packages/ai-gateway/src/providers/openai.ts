import type { ChatMessage, ToolSpec, ChatDelta } from '@olze/shared-types';
import type { ProviderAdapter } from './base.js';
import { openAiCompatStream } from './base.js';

/** OpenAI — BYO key only (never part of the free chain). */
export class OpenAIProvider implements ProviderAdapter {
  constructor(private apiKey?: string) {}
  isConfigured() { return Boolean(this.apiKey); }
  chatStream(messages: ChatMessage[], tools: ToolSpec[] | undefined, model: string): AsyncIterable<ChatDelta> {
    return openAiCompatStream({ baseUrl: 'https://api.openai.com/v1', apiKey: this.apiKey!, model, messages, tools });
  }
  estimateCost(model: string, i: number, o: number) {
    return model.includes('mini') ? (i * 0.15 + o * 0.6) / 1e6 : (i * 2.5 + o * 10) / 1e6;
  }
}
