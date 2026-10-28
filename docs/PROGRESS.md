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
| T10 | AI: triage (classify+priority) + fallback classifier + usage log | done |
| T11 | AI: draft generation (KB slicing, book facts, cache, fallback draft) | todo |
| T12 | Frontend scaffold + author portal | todo |
| T13 | Admin portal | todo |
| T14 | Deploy (Neon + Render + Vercel) | todo |
| T15 | README, API docs, 1-page write-up | todo |

## Last session
- Agent: Antigravity (Gemini 3.8 Flash)
- Done: T10 complete (implemented async AI ticket triage with `triageTicket`, system prompt & few-shots in `ai/prompts/triage.ts`, code-level guardrails in `applyTriageGuardrails` forcing ISBN issues to at least High priority, pure `fallbackClassifier` with keyword rules, single-concurrency in-memory `triageQueue` preserving admin overrides, startup recovery for pending tickets older than 1m, admin retry triage endpoint `POST /admin/tickets/:id/triage` returning 202, 19 labeled test cases in `triageCases.json`, and `eval:triage` script measuring category and priority accuracy).
- Not done: T11 AI draft generation.
- Next: T11 (`docs/tasks/T11-draft-responses.md`).
- Known bugs: none.
