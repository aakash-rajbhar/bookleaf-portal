import { ZodType } from 'zod';

/** Standardized usage metrics returned by all LLM operations. */
export type Usage = {
  promptTokens: number;
  completionTokens: number;
  thinkingTokens: number;
  latencyMs: number;
  model: string;
};

/**
 * Universal interface for LLM operations.
 * Concrete providers (Gemini, Mock) implement this interface.
 */
export interface LLMProvider {
  readonly name: string;
  readonly model: string;

  /**
   * Generates a structured JSON object conforming to the given schema.
   * Model output is always validated against req.schema (Zod).
   */
  generateJSON<T>(req: {
    system: string;
    prompt: string;
    schema: ZodType<T>;
    jsonSchema: object;
    maxOutputTokens: number;
  }): Promise<{ data: T; usage: Usage }>;

  /**
   * Generates unstructured free-form text.
   */
  generateText(req: {
    system: string;
    prompt: string;
    maxOutputTokens: number;
  }): Promise<{ text: string; usage: Usage }>;
}
