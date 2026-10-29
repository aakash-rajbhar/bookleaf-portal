import { LLMProvider, Usage } from '../types';
import { AIUnavailableError } from '../errors';
import { env } from '../../config/env';

/**
 * Deterministic MockProvider for testing, development, and offline demo.
 * Zero network calls. Simulates failures and artificial latency.
 */
export class MockProvider implements LLMProvider {
  readonly name = 'mock';
  readonly model = 'mock-model';

  private async sleepWithJitter(): Promise<number> {
    const start = Date.now();
    const delay = 50 + Math.floor(Math.random() * 50); // 50-100ms
    await new Promise((resolve) => setTimeout(resolve, delay));
    return Date.now() - start;
  }

  private handleMockFailure(): void {
    const failureMode = env.AI_MOCK_FAILURE;
    if (failureMode === 'always') {
      throw new AIUnavailableError('upstream', 'Mock failure: upstream error');
    }
    if (failureMode === 'rate_limit') {
      throw new AIUnavailableError('rate_limited', 'Mock failure: rate limited');
    }
    if (failureMode === 'empty') {
      throw new AIUnavailableError('invalid_output', 'Mock failure: empty response');
    }
  }

  async generateText(req: {
    system: string;
    prompt: string;
    maxOutputTokens: number;
  }): Promise<{ text: string; usage: Usage }> {
    const latencyMs = await this.sleepWithJitter();
    this.handleMockFailure();

    if (env.AI_MOCK_FAILURE === 'invalid_json') {
      // For generateText, invalid_json mode can pass through or succeed;
      // it is intended for schema failures in generateJSON.
    }

    let text = 'OK';
    const lowerPrompt = req.prompt.toLowerCase();
    if (lowerPrompt.includes('reply with the word ok') || lowerPrompt.includes('ok')) {
      text = 'OK';
    } else {
      text =
        'Hello! Thank you for contacting BookLeaf author support. Our team has received your message and will review your request promptly.';
    }

    const usage: Usage = {
      promptTokens: Math.max(1, Math.round(req.prompt.length / 4)),
      completionTokens: Math.max(1, Math.round(text.length / 4)),
      thinkingTokens: 0,
      latencyMs,
      model: this.model,
    };

    return { text, usage };
  }

  async generateJSON<T>(req: {
    system: string;
    prompt: string;
    schema: import('zod').ZodType<T>;
    jsonSchema: object;
    maxOutputTokens: number;
  }): Promise<{ data: T; usage: Usage }> {
    const latencyMs = await this.sleepWithJitter();
    this.handleMockFailure();

    if (env.AI_MOCK_FAILURE === 'invalid_json') {
      throw new AIUnavailableError('invalid_output', 'Mock failure: invalid JSON output failing schema');
    }

    // Try a set of plausible candidate shapes based on common tasks (smoke, triage)
    const lower = `${req.system} ${req.prompt}`.toLowerCase();

    // 1. Smoke test shape
    const smokeCandidate = { answer: 'OK' };
    const parsedSmoke = req.schema.safeParse(smokeCandidate);
    if (parsedSmoke.success) {
      return {
        data: parsedSmoke.data,
        usage: {
          promptTokens: Math.max(1, Math.round(req.prompt.length / 4)),
          completionTokens: 8,
          thinkingTokens: 0,
          latencyMs,
          model: this.model,
        },
      };
    }

    // 2. Keyword-based triage candidate
    let category = 'General Inquiry';
    if (lower.includes('royalt') || lower.includes('payout') || lower.includes('earning')) {
      category = 'Royalty & Payments';
    } else if (lower.includes('isbn') || lower.includes('barcode') || lower.includes('metadata')) {
      category = 'ISBN & Metadata Issues';
    } else if (lower.includes('amazon') || lower.includes('distribut') || lower.includes('store') || lower.includes('availability')) {
      category = 'Distribution & Availability';
    } else if (lower.includes('order') || lower.includes('ship') || lower.includes('cop') || lower.includes('print')) {
      category = 'Printing & Quality';
    } else if (lower.includes('typeset') || lower.includes('proof') || lower.includes('stage') || lower.includes('status')) {
      category = 'Book Status & Production Updates';
    }

    let priority = 'Medium';
    if (lower.includes('urgent') || lower.includes('critical') || lower.includes('asap') || lower.includes('blocked')) {
      priority = 'High';
    }

    const triageCandidate = {
      category,
      priority,
      confidence: 0.92,
      reason: `Classified based on detected keywords: ${category}`,
    };

    const parsedTriage = req.schema.safeParse(triageCandidate);
    if (parsedTriage.success) {
      return {
        data: parsedTriage.data,
        usage: {
          promptTokens: Math.max(1, Math.round(req.prompt.length / 4)),
          completionTokens: 25,
          thinkingTokens: 0,
          latencyMs,
          model: this.model,
        },
      };
    }

    // 3. Synthesize candidate from jsonSchema properties if available
    const synthesized: Record<string, unknown> = {};
    const schemaObj = req.jsonSchema as { properties?: Record<string, { type?: string; default?: unknown }> };
    if (schemaObj && schemaObj.properties) {
      for (const [key, prop] of Object.entries(schemaObj.properties)) {
        if (prop.default !== undefined) {
          synthesized[key] = prop.default;
        } else if (prop.type === 'string') {
          synthesized[key] = 'OK';
        } else if (prop.type === 'number' || prop.type === 'integer') {
          synthesized[key] = 1;
        } else if (prop.type === 'boolean') {
          synthesized[key] = true;
        } else if (prop.type === 'array') {
          synthesized[key] = [];
        } else {
          synthesized[key] = {};
        }
      }
    }

    const parsedSynthesized = req.schema.safeParse(synthesized);
    if (parsedSynthesized.success) {
      return {
        data: parsedSynthesized.data,
        usage: {
          promptTokens: Math.max(1, Math.round(req.prompt.length / 4)),
          completionTokens: 15,
          thinkingTokens: 0,
          latencyMs,
          model: this.model,
        },
      };
    }

    throw new AIUnavailableError('invalid_output', 'Mock provider could not produce data satisfying the schema');
  }
}
