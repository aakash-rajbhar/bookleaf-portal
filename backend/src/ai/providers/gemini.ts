import { GoogleGenAI } from '@google/genai';
import { LLMProvider, Usage } from '../types';
import { AIUnavailableError, AIUnavailableReason } from '../errors';
import { env } from '../../config/env';

/** Internal helper error used to distinguish JSON/Zod parse issues for retry logic */
class SchemaOrParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SchemaOrParseError';
  }
}

export class GeminiProvider implements LLMProvider {
  readonly name = 'gemini';
  readonly model: string;

  constructor() {
    this.model = env.GEMINI_MODEL;
  }

  /**
   * Lazily validate and return the GoogleGenAI client at call time.
   * Throws 'not_configured' if key is missing or set to placeholder.
   */
  private getClient(): GoogleGenAI {
    const key = env.GEMINI_API_KEY;
    if (!key || key.trim() === '' || key === 'API_KEY_ADDED') {
      throw new AIUnavailableError(
        'not_configured',
        'Gemini API key is not configured or is a placeholder'
      );
    }
    return new GoogleGenAI({ apiKey: key });
  }

  private sanitize(message: string): string {
    const key = env.GEMINI_API_KEY;
    if (key && key.length > 5) {
      return message.split(key).join('[REDACTED_API_KEY]');
    }
    return message;
  }

  private mapError(err: unknown): AIUnavailableError {
    if (err instanceof AIUnavailableError) {
      return err;
    }

    const anyErr = err as { name?: string; status?: number; statusCode?: number; message?: string };
    const status = anyErr?.status ?? anyErr?.statusCode;
    const rawMsg = String(anyErr?.message ?? err ?? '');
    const msg = this.sanitize(rawMsg).toLowerCase();

    if (anyErr?.name === 'AbortError' || msg.includes('aborted') || msg.includes('timeout')) {
      return new AIUnavailableError('timeout', 'AI request timed out');
    }

    if (status === 429) {
      if (msg.includes('quota') || msg.includes('resource_exhausted') || msg.includes('exceeded')) {
        return new AIUnavailableError('quota', 'AI quota exhausted');
      }
      return new AIUnavailableError('rate_limited', 'AI request rate limited (429)');
    }

    if (status && status >= 500 && status < 600) {
      return new AIUnavailableError('upstream', `AI service error (${status})`);
    }

    if (status === 400 || status === 401 || status === 403) {
      if (msg.includes('api key') || msg.includes('unauthenticated') || msg.includes('permission_denied')) {
        return new AIUnavailableError('not_configured', 'AI API key is invalid or unauthorized');
      }
      return new AIUnavailableError('upstream', 'AI upstream request rejected');
    }

    if (msg.includes('fetch failed') || msg.includes('econnreset') || msg.includes('etimedout')) {
      return new AIUnavailableError('upstream', 'Network error connecting to AI service');
    }

    return new AIUnavailableError('upstream', 'Unexpected AI service failure');
  }

  private async sleepJitter(baseMs = 500): Promise<void> {
    const delay = baseMs + Math.floor(Math.random() * 200);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  private async invokeModel(
    modelName: string,
    req: {
      system: string;
      prompt: string;
      maxOutputTokens: number;
      temperature: number;
      isJson: boolean;
      jsonSchema?: object;
    }
  ): Promise<{ text: string; usage: Usage }> {
    const ai = this.getClient();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), env.AI_TIMEOUT_MS);
    const startMs = Date.now();

    try {
      const config: Record<string, unknown> = {
        temperature: req.temperature,
        maxOutputTokens: req.maxOutputTokens,
        abortSignal: controller.signal,
      };

      if (req.system && req.system.trim().length > 0) {
        config.systemInstruction = req.system;
      }

      if (req.isJson) {
        config.responseMimeType = 'application/json';
        if (req.jsonSchema) {
          config.responseSchema = req.jsonSchema;
        }
      }

      if (env.GEMINI_THINKING_BUDGET !== undefined) {
        config.thinkingConfig = { thinkingBudget: env.GEMINI_THINKING_BUDGET };
      }

      const response = await ai.models.generateContent({
        model: modelName,
        contents: req.prompt,
        config: config as any,
      });

      const latencyMs = Date.now() - startMs;
      const candidate = response.candidates?.[0];
      const finishReason = candidate?.finishReason;

      if (finishReason === 'MAX_TOKENS' || finishReason === 'SAFETY') {
        throw new AIUnavailableError(
          'invalid_output',
          `Generation halted due to finish reason: ${finishReason}`
        );
      }

      const text = response.text;
      if (!text || text.trim() === '') {
        throw new AIUnavailableError('invalid_output', 'Model returned empty or undefined text');
      }

      const meta = response.usageMetadata;
      const usage: Usage = {
        promptTokens: meta?.promptTokenCount ?? 0,
        completionTokens: meta?.candidatesTokenCount ?? 0,
        thinkingTokens: meta?.thoughtsTokenCount ?? 0,
        latencyMs,
        model: modelName,
      };

      return { text, usage };
    } catch (err) {
      if (controller.signal.aborted) {
        throw new AIUnavailableError('timeout', `AI call timed out after ${env.AI_TIMEOUT_MS}ms`);
      }
      throw this.mapError(err);
    } finally {
      clearTimeout(timer);
    }
  }

  private async executeWithRetries(
    modelName: string,
    req: {
      system: string;
      prompt: string;
      maxOutputTokens: number;
      temperature: number;
      isJson: boolean;
      jsonSchema?: object;
    }
  ): Promise<{ text: string; usage: Usage }> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        return await this.invokeModel(modelName, req);
      } catch (err) {
        lastError = err;
        const mapped = this.mapError(err);

        // No retry on rate_limited or quota or not_configured or invalid_output
        if (mapped.reason === 'rate_limited' || mapped.reason === 'quota' || mapped.reason === 'not_configured') {
          throw mapped;
        }

        // Retry once on 5xx (upstream) or timeout
        if (attempt === 1 && (mapped.reason === 'upstream' || mapped.reason === 'timeout')) {
          await this.sleepJitter(500);
          continue;
        }

        throw mapped;
      }
    }

    throw this.mapError(lastError);
  }

  private async runWithFallback<R>(
    fn: (model: string) => Promise<R>
  ): Promise<R> {
    try {
      return await fn(this.model);
    } catch (err) {
      const mapped = this.mapError(err);
      const fallbackModel = env.GEMINI_FALLBACK_MODEL;

      const isEligibleForFallback =
        fallbackModel &&
        fallbackModel !== this.model &&
        (mapped.reason === 'timeout' || mapped.reason === 'rate_limited' || mapped.reason === 'upstream');

      if (isEligibleForFallback) {
        try {
          return await fn(fallbackModel);
        } catch (fallbackErr) {
          throw this.mapError(fallbackErr);
        }
      }

      throw mapped;
    }
  }

  async generateText(req: {
    system: string;
    prompt: string;
    maxOutputTokens: number;
  }): Promise<{ text: string; usage: Usage }> {
    return this.runWithFallback(async (model) => {
      return this.executeWithRetries(model, {
        system: req.system,
        prompt: req.prompt,
        maxOutputTokens: req.maxOutputTokens,
        temperature: 0.5,
        isJson: false,
      });
    });
  }

  async generateJSON<T>(req: {
    system: string;
    prompt: string;
    schema: import('zod').ZodType<T>;
    jsonSchema: object;
    maxOutputTokens: number;
  }): Promise<{ data: T; usage: Usage }> {
    return this.runWithFallback(async (model) => {
      let lastErr: unknown;

      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const res = await this.executeWithRetries(model, {
            system: req.system,
            prompt: req.prompt,
            maxOutputTokens: req.maxOutputTokens,
            temperature: 0.2,
            isJson: true,
            jsonSchema: req.jsonSchema,
          });

          let parsedRaw: unknown;
          try {
            parsedRaw = JSON.parse(res.text);
          } catch (jsonErr) {
            throw new SchemaOrParseError('Invalid JSON format returned by model');
          }

          const zodRes = req.schema.safeParse(parsedRaw);
          if (!zodRes.success) {
            throw new SchemaOrParseError('Model output failed Zod schema validation');
          }

          return { data: zodRes.data, usage: res.usage };
        } catch (err) {
          lastErr = err;
          if (err instanceof SchemaOrParseError) {
            if (attempt === 1) {
              await this.sleepJitter(500);
              continue;
            }
            throw new AIUnavailableError('invalid_output', err.message);
          }
          throw this.mapError(err);
        }
      }

      throw this.mapError(lastErr);
    });
  }
}
