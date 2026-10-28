# PROGRESS (update before stopping. Next agent starts here)

## Checklist  (todo | doing | done)
| ID | Task | Status |
|---|---|---|
| T01 | Backend bootstrap: install, env validation, health route, error handler | done |
| T02 | DB pool + SQL migrations (schema from DATA_MODEL.md) | done |
| T03 | Seed script (JSON -> authors/books, users, admins) | done |
| T04 | Auth: login, JWT, authenticate + requireRole + validate middleware | done |
| T05 | Books endpoints with ownership rules | todo |
| T06 | Tickets: author create/list/get | todo |
| T07 | SSE hub + /events | todo |
| T08 | Admin ticket endpoints (queue filters, patch, notes, reply) | todo |
| T09 | AI: LLMProvider, GeminiProvider, MockProvider, rate limiter | todo |
| T10 | AI: triage (classify+priority) + fallback classifier + usage log | todo |
| T11 | AI: draft generation (KB slicing, book facts, cache, fallback draft) | todo |
| T12 | Frontend scaffold + author portal | todo |
| T13 | Admin portal | todo |
| T14 | Deploy (Neon + Render + Vercel) | todo |
| T15 | README, API docs, 1-page write-up | todo |

## Last session
- Agent: Antigravity (Gemini 3.8 Flash)
- Done: T04 complete (implemented auth service with dummy bcrypt hash timing defense, auth controller with zod validation, pinned HS256 JWT sign & verify, authenticate middleware, requireRole middleware, req.user typing, wired in routes/index.ts, added temporary GET /api/v1/_debug/admin-only route with TODO to remove in T08; verified all acceptance criteria).
- Not done: T05 books endpoints.
- Next: T05 (`docs/tasks/T05-books.md`).
- Known bugs: none.
