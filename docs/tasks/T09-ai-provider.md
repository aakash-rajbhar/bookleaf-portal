# T09 AI provider layer (no business logic here; plumbing only)

Files: ai/types.ts, ai/errors.ts, ai/providers/gemini.ts, ai/providers/mock.ts, ai/rateLimiter.ts,
ai/index.ts (factory), db/aiUsageLog.ts, config/env.ts (+ AI_MOCK_FAILURE=none|always|rate_limit), .env.example.

types.ts:
interface LLMProvider {
readonly name: string; readonly model: string;
generateJSON<T>(req: {system: string; prompt: string; schema: ZodType<T>; jsonSchema: object;
maxOutputTokens: number}): Promise<{data: T; usage: Usage}>;
generateText(req: {system: string; prompt: string; maxOutputTokens: number}): Promise<{text: string; usage: Usage}>;
}
Usage = {promptTokens, completionTokens, latencyMs}
errors.ts: class AIUnavailableError extends Error {reason: 'not_configured'|'timeout'|'rate_limited'|'quota'|'upstream'|'invalid_output'}
Callers only ever catch AIUnavailableError. Provider-specific errors are mapped here, never leaked.
gemini.ts (@google/genai): key from env.GEMINI_API_KEY (throw not_configured if missing), model from env.GEMINI_MODEL.

- JSON mode: responseMimeType 'application/json' + responseSchema; ALSO validate with zod (never trust the model).
- temperature 0.2 for JSON, 0.5 for text; honour maxOutputTokens.
- If the model supports thinking config, turn thinking off/minimal for these tasks. Thinking tokens can eat
  maxOutputTokens and truncate the JSON. Check the installed SDK's types for the exact field.
- Timeout = env.AI_TIMEOUT_MS (abort signal if the SDK supports it, else Promise.race).
- Retry ONCE with backoff (500ms + jitter) on 5xx/timeout. 429 -> no retry, throw rate_limited (quota exhausted
  won't fix itself in 500ms). Invalid JSON/zod failure -> one retry, then invalid_output.
- Read tokens from the response usage metadata.
  rateLimiter.ts: sliding-window limiter, env.AI_RPM_LIMIT calls/minute, shared by all AI calls.
  acquire(): if a slot is free -> go; if it frees within 10s -> wait; else throw AIUnavailableError('rate_limited').
  (Failing fast triggers the fallback instead of stacking up a queue.)
  mock.ts: deterministic, zero network. generateJSON returns a keyword-based triage result; generateText returns a
  plausible template reply. AI_MOCK_FAILURE=always throws upstream; rate_limit throws rate_limited. Lets you demo and
  test graceful degradation without burning quota.
  index.ts: getProvider() singleton from env.AI_PROVIDER, wrapped so every call passes through rateLimiter.
  aiUsageLog.ts: logAiCall({ticketId|null, task:'triage'|'draft', model, promptTokens, completionTokens, latencyMs, success, error}) -> ai_usage_log.
  A logging failure must never throw into the caller.
  Rules: API key never logged, never in an error message. Do not log full prompts.
  Acceptance: tiny script (scripts/ai-smoke.ts) calls the provider with "Reply with the word OK" -> prints text + usage.
  With AI_PROVIDER=mock works offline; with a bad key prints reason 'upstream' or 'not_configured', not a stack trace.
  Commit: feat(ai): provider abstraction with gemini, mock and rate limiter
