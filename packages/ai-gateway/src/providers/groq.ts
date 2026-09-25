import type { ChatMessage, ToolSpec, ChatDelta } from '@olze/shared-types';
import type { ProviderAdapter } from './base.js';
import { openAiCompatStream } from './base.js';

/** Groq — very fast inference with a generous free tier. */
export class GroqProvider implements ProviderAdapter {
  constructor(private apiKey?: string) {}
  isConfigured() { return Boolean(this.apiKey); }
  chatStream(messages: ChatMessage[], tools: ToolSpec[] | undefined, model: string): AsyncIterable<ChatDelta> {
    return openAiCompatStream({ baseUrl: 'https://api.groq.com/openai/v1', apiKey: this.apiKey!, model, messages, tools });
  }
  estimateCost(_m: string, _i: number, _o: number) { return 0; } // free tier
}
