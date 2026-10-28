# PROGRESS (update before stopping. Next agent starts here)

## Checklist  (todo | doing | done)
| ID | Task | Status |
|---|---|---|
| T01 | Backend bootstrap: install, env validation, health route, error handler | done |
| T02 | DB pool + SQL migrations (schema from DATA_MODEL.md) | done |
| T03 | Seed script (JSON -> authors/books, users, admins) | done |
| T04 | Auth: login, JWT, authenticate + requireRole + validate middleware | done |
| T05 | Books endpoints with ownership rules | done |
| T06 | Tickets: author create/list/get | done |
| T07 | SSE hub + /events | done |
| T08 | Admin ticket endpoints (queue filters, patch, notes, reply) | done |
| T09 | AI: LLMProvider, GeminiProvider, MockProvider, rate limiter | done |
| T10 | AI: triage (classify+priority) + fallback classifier + usage log | todo |
| T11 | AI: draft generation (KB slicing, book facts, cache, fallback draft) | todo |
| T12 | Frontend scaffold + author portal | todo |
| T13 | Admin portal | todo |
| T14 | Deploy (Neon + Render + Vercel) | todo |
| T15 | README, API docs, 1-page write-up | todo |

## Last session
- Agent: Antigravity (Gemini 3.8 Flash)
- Done: T09 complete (implemented `LLMProvider` interface with `generateJSON` and `generateText`, `GeminiProvider` using `@google/genai` with lazy key validation, retry on 5xx/network error, fallback model support for timeout/rate_limit/quota/upstream, token usage reporting including thinking tokens, error sanitization to prevent API key leakage, `MockProvider` with deterministic keyword response and `AI_MOCK_FAILURE` modes, sliding-window `RateLimiter` with RPM/daily caps and 429 cooldowns, `AI_TOTAL_TIMEOUT_MS` deadline bounding total latency, per-request rate limiting inside `invokeModel`, migration `002_allow_smoke_task.sql`, `logAiCall` telemetry helper, and `scripts/ai-smoke.ts`).
- Not done: T10 AI triage.
- Next: T10 (`docs/tasks/T10-ai-triage.md`).
- Known bugs: none.
