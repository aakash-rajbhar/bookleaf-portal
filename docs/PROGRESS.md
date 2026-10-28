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
| T09 | AI: LLMProvider, GeminiProvider, MockProvider, rate limiter | todo |
| T10 | AI: triage (classify+priority) + fallback classifier + usage log | todo |
| T11 | AI: draft generation (KB slicing, book facts, cache, fallback draft) | todo |
| T12 | Frontend scaffold + author portal | todo |
| T13 | Admin portal | todo |
| T14 | Deploy (Neon + Render + Vercel) | todo |
| T15 | README, API docs, 1-page write-up | todo |

## Last session
- Agent: Antigravity (Gemini 3.8 Flash)
- Done: T07 complete (implemented in-memory `sseHub` keyed by `author:<authorId>` and `admins`, short-lived 60s stream tokens at `POST /events/token`, `authenticateStream` on `GET /events`, mutual token rejection between stream and login JWTs, minimal `{type, ticketId}` event payloads, 25s heartbeat pings, clean unsubscription on disconnect; integrated real event emission in `ticketEvents.ts`, `ticketService.ts`, and `adminTicketService.ts`).
- Not done: T09 AI provider abstraction.
- Next: T09 (`docs/tasks/T09-ai-provider.md`).
- Known bugs: none.
