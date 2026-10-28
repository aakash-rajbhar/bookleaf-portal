import { LLMProvider, Usage } from './types';
import { GeminiProvider } from './providers/gemini';
import { MockProvider } from './providers/mock';
import { rateLimiter } from './rateLimiter';
import { env } from '../config/env';

export * from './types';
export * from './errors';
export * from './rateLimiter';

/**
 * Wrapper class ensuring every LLM request first acquires a slot
 * from the shared sliding-window rate limiter.
 */
class RateLimitedProvider implements LLMProvider {
  constructor(private readonly inner: LLMProvider) {}

  get name(): string {
    return this.inner.name;
  }

  get model(): string {
    return this.inner.model;
  }

  async generateJSON<T>(req: {
    system: string;
    prompt: string;
    schema: import('zod').ZodType<T>;
    jsonSchema: object;
    maxOutputTokens: number;
  }): Promise<{ data: T; usage: Usage }> {
    await rateLimiter.acquire();
    return this.inner.generateJSON(req);
  }

  async generateText(req: {
    system: string;
    prompt: string;
    maxOutputTokens: number;
  }): Promise<{ text: string; usage: Usage }> {
    await rateLimiter.acquire();
    return this.inner.generateText(req);
  }
}

let providerInstance: LLMProvider | null = null;

/**
 * Returns the singleton LLMProvider instance chosen by AI_PROVIDER env,
 * wrapped with rate limiting.
 */
export function getProvider(): LLMProvider {
  if (!providerInstance) {
    const rawProvider: LLMProvider =
      env.AI_PROVIDER === 'gemini' ? new GeminiProvider() : new MockProvider();
    providerInstance = new RateLimitedProvider(rawProvider);
  }
  return providerInstance;
}

/**
 * Reset provider singleton (useful for test environments or runtime re-configuration).
 */
export function resetProvider(): void {
  providerInstance = null;
}
