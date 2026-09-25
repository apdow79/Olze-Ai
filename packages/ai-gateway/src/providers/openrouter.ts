import type { ChatMessage, ToolSpec, ChatDelta } from '@olze/shared-types';
import type { ProviderAdapter } from './base.js';
import { openAiCompatStream } from './base.js';

/** OpenRouter — backbone of the free tier (`*:free` models). */
export class OpenRouterProvider implements ProviderAdapter {
  constructor(private apiKey?: string) {}
  isConfigured() { return Boolean(this.apiKey); }
  chatStream(messages: ChatMessage[], tools: ToolSpec[] | undefined, model: string): AsyncIterable<ChatDelta> {
    return openAiCompatStream({ baseUrl: 'https://openrouter.ai/api/v1', apiKey: this.apiKey!, model, messages, tools });
  }
  estimateCost(model: string, i: number, o: number) {
    return model.endsWith(':free') ? 0 : (i * 0.6 + o * 1.2) / 1e6; // rough USD/1M tokens
  }
}
