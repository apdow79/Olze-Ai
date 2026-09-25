import type { ChatMessage, ToolSpec, ChatDelta } from '@olze/shared-types';
import type { ProviderAdapter } from './base.js';
import { openAiCompatStream } from './base.js';

/** Local Ollama — OPTIONAL privacy/local path. Never required for Olze to work. */
export class OllamaProvider implements ProviderAdapter {
  constructor(private baseUrl?: string) {}
  isConfigured() { return Boolean(this.baseUrl); }
  chatStream(messages: ChatMessage[], tools: ToolSpec[] | undefined, model: string): AsyncIterable<ChatDelta> {
    // Ollama exposes an OpenAI-compatible endpoint at /v1
    return openAiCompatStream({ baseUrl: `${this.baseUrl}/v1`, apiKey: 'ollama', model, messages, tools });
  }
  estimateCost() { return 0; } // local compute
}
