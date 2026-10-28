import { LLMProvider } from './types';
import { GeminiProvider } from './providers/gemini';
import { MockProvider } from './providers/mock';
import { env } from '../config/env';

export * from './types';
export * from './errors';
export * from './rateLimiter';

let providerInstance: LLMProvider | null = null;

/**
 * Returns the singleton LLMProvider instance chosen by AI_PROVIDER env.
 * Rate limiting is enforced per real HTTP request inside the provider.
 */
export function getProvider(): LLMProvider {
  if (!providerInstance) {
    providerInstance =
      env.AI_PROVIDER === 'gemini' ? new GeminiProvider() : new MockProvider();
  }
  return providerInstance;
}

/**
 * Reset provider singleton (useful for test environments or runtime re-configuration).
 */
export function resetProvider(): void {
  providerInstance = null;
}
