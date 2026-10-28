import { GoogleGenAI } from '@google/genai';
import { LLMProvider, Usage } from '../types';
import { AIUnavailableError } from '../errors';
import { rateLimiter } from '../rateLimiter';
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
        rateLimiter.setCooldown('quota', 3600_000); // 1h cooldown
        return new AIUnavailableError('quota', 'AI quota exhausted');
      }
      rateLimiter.setCooldown('rate_limited', 60_000); // 60s cooldown
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

  /**
   * Invokes the Gemini API for a single attempt.
   * Acquires a rate-limit slot immediately before dispatching the real HTTP request.
   * Time spent waiting for rate limiting counts against the shared deadline.
   */
  private async invokeModel(
    modelName: string,
    req: {
      system: string;
      prompt: string;
      maxOutputTokens: number;
      temperature: number;
      isJson: boolean;
      jsonSchema?: object;
    },
    deadline: number
  ): Promise<{ text: string; usage: Usage }> {
    const remainingBeforeAcquire = deadline - Date.now();
    if (remainingBeforeAcquire <= 0) {
      throw new AIUnavailableError(
        'timeout',
        `AI total deadline of ${env.AI_TOTAL_TIMEOUT_MS}ms exceeded`
      );
    }

    // Rate-limit every real HTTP call (including retries and fallback attempts)
    await rateLimiter.acquire();

    const remainingAfterAcquire = deadline - Date.now();
    if (remainingAfterAcquire <= 0) {
      throw new AIUnavailableError(
        'timeout',
        `AI total deadline exceeded while waiting for rate limit slot`
      );
    }

    const attemptTimeoutMs = Math.min(env.AI_TIMEOUT_MS, remainingAfterAcquire);
    const ai = this.getClient();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), attemptTimeoutMs);
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

      // Treat any finishReason other than STOP (when present) as invalid_output
      if (finishReason && finishReason !== 'STOP') {
        throw new AIUnavailableError(
          'invalid_output',
          `Generation stopped with finish reason: ${finishReason}`
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
        throw new AIUnavailableError(
          'timeout',
          `AI attempt timed out after ${attemptTimeoutMs}ms`
        );
      }
      throw this.mapError(err);
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Executes a model call with retry policy:
   * - Never retries on 'timeout'.
   * - Retries once on 'upstream' (5xx / network error) provided >= 5000ms remains before deadline.
   */
  private async executeWithRetries(
    modelName: string,
    req: {
      system: string;
      prompt: string;
      maxOutputTokens: number;
      temperature: number;
      isJson: boolean;
      jsonSchema?: object;
    },
    deadline: number
  ): Promise<{ text: string; usage: Usage }> {
    try {
      return await this.invokeModel(modelName, req, deadline);
    } catch (err) {
      const mapped = this.mapError(err);

      // Do NOT retry on timeout, rate_limited, quota, not_configured, or invalid_output
      if (mapped.reason !== 'upstream') {
        throw mapped;
      }

      // Do not start a retry if less than 5000ms remains before the total deadline
      const remaining = deadline - Date.now();
      if (remaining < 5000) {
        throw mapped;
      }

      await this.sleepJitter(500);
      return await this.invokeModel(modelName, req, deadline);
    }
  }

  /**
   * Wraps call with total deadline across retries and optional fallback model.
   * Fallback is eligible for timeout, rate_limited, upstream, and quota.
   */
  private async runWithFallback<R>(
    fn: (model: string, deadline: number) => Promise<R>
  ): Promise<R> {
    const deadline = Date.now() + env.AI_TOTAL_TIMEOUT_MS;

    try {
      return await fn(this.model, deadline);
    } catch (err) {
      const mapped = this.mapError(err);
      const fallbackModel = env.GEMINI_FALLBACK_MODEL;

      const isEligibleForFallback =
        fallbackModel &&
        fallbackModel !== this.model &&
        (mapped.reason === 'timeout' ||
          mapped.reason === 'rate_limited' ||
          mapped.reason === 'upstream' ||
          mapped.reason === 'quota');

      if (isEligibleForFallback) {
        const remaining = deadline - Date.now();
        // Do not attempt fallback if less than 5000ms remains
        if (remaining >= 5000) {
          try {
            return await fn(fallbackModel, deadline);
          } catch (fallbackErr) {
            throw this.mapError(fallbackErr);
          }
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
    return this.runWithFallback(async (model, deadline) => {
      return this.executeWithRetries(
        model,
        {
          system: req.system,
          prompt: req.prompt,
          maxOutputTokens: req.maxOutputTokens,
          temperature: 0.5,
          isJson: false,
        },
        deadline
      );
    });
  }

  async generateJSON<T>(req: {
    system: string;
    prompt: string;
    schema: import('zod').ZodType<T>;
    jsonSchema: object;
    maxOutputTokens: number;
  }): Promise<{ data: T; usage: Usage }> {
    return this.runWithFallback(async (model, deadline) => {
      const executeAndValidate = async () => {
        const res = await this.executeWithRetries(
          model,
          {
            system: req.system,
            prompt: req.prompt,
            maxOutputTokens: req.maxOutputTokens,
            temperature: 0.2,
            isJson: true,
            jsonSchema: req.jsonSchema,
          },
          deadline
        );

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
      };

      try {
        return await executeAndValidate();
      } catch (err) {
        if (err instanceof SchemaOrParseError) {
          // Schema/parse retry must also respect the 5000ms deadline threshold
          const remaining = deadline - Date.now();
          if (remaining >= 5000) {
            await this.sleepJitter(500);
            try {
              return await executeAndValidate();
            } catch (retryErr) {
              if (retryErr instanceof SchemaOrParseError) {
                throw new AIUnavailableError('invalid_output', retryErr.message);
              }
              throw this.mapError(retryErr);
            }
          }
          throw new AIUnavailableError('invalid_output', err.message);
        }
        throw this.mapError(err);
      }
    });
  }
}
